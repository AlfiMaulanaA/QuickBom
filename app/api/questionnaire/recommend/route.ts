import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// POST /api/questionnaire/recommend
// Body: { assemblyIds: number[], categoryId: number }
// Returns templates ranked by similarity score (Jaccard similarity)
export async function POST(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { assemblyIds, categoryId } = await request.json();

        if (!assemblyIds || !Array.isArray(assemblyIds) || assemblyIds.length === 0) {
            return NextResponse.json({ error: "No assemblies selected" }, { status: 400 });
        }

        const selectedIds = new Set<number>(assemblyIds.map(Number));

        // 1. Fetch relevant groups to map assemblies back to their group names
        const allGroups = categoryId ? await prisma.assemblyGroup.findMany({
            where: { categoryId: Number(categoryId) },
            include: { items: { select: { assemblyId: true } } }
        }) : [];

        const assemblyToGroupMap = new Map<number, { id: string, name: string }>();
        const requiredIds = new Set<number>();

        allGroups.forEach(g => {
            if (g.groupType === "REQUIRED") {
                g.items.forEach(i => requiredIds.add(i.assemblyId));
            }
            g.items.forEach(i => {
                assemblyToGroupMap.set(i.assemblyId, { id: g.id, name: g.name });
            });
        });

        // 2. Fetch templates
        const where: any = {
            OR: [
                {
                    assemblies: {
                        some: {
                            assemblyId: {
                                in: Array.from(selectedIds)
                            }
                        }
                    }
                }
            ]
        };

        if (categoryId) {
            where.OR.push({
                assemblies: {
                    some: {
                        assembly: {
                            categoryId: Number(categoryId)
                        }
                    }
                }
            });
        }

        const templates = await prisma.template.findMany({
            where,
            include: {
                assemblies: {
                    include: {
                        assembly: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        }) as any[];

        // 3. Calculate similarity with REQUIRED items discounted
        const scored = templates.map((template) => {
            const templateAssemblyIds = new Set<number>();
            template.assemblies.forEach((ta: any) => {
                templateAssemblyIds.add(ta.assemblyId);
            });

            // "Useful" sets are those that are NOT in the required list
            const usefulSelected = Array.from(selectedIds).filter(id => !requiredIds.has(id));
            const usefulTemplate = Array.from(templateAssemblyIds).filter(id => !requiredIds.has(id));

            let score = 0;
            let coverage = 0;
            let jaccardScore = 0;
            let intersectionCount = 0;

            if (usefulSelected.length === 0 && usefulTemplate.length === 0) {
                // If everything is required, fallback to absolute matching but with a lower "certainty"
                const intersection = Array.from(selectedIds).filter(id => templateAssemblyIds.has(id)).length;
                const union = new Set([...selectedIds, ...templateAssemblyIds]).size;
                intersectionCount = intersection;
                coverage = selectedIds.size > 0 ? (intersection / selectedIds.size) * 100 : 0;
                jaccardScore = union > 0 ? (intersection / union) * 100 : 0;
                score = (coverage * 0.5 + jaccardScore * 0.5) * 0.8; // Penalty for only matching base items
            } else {
                const intersection = usefulSelected.filter(id => usefulTemplate.includes(id)).length;
                const union = new Set([...usefulSelected, ...usefulTemplate]).size;
                intersectionCount = intersection + Array.from(selectedIds).filter(id => requiredIds.has(id) && templateAssemblyIds.has(id)).length;

                coverage = usefulSelected.length > 0 ? (intersection / usefulSelected.length) * 100 : 100;
                jaccardScore = union > 0 ? (intersection / union) * 100 : 100;

                // Combined score
                score = coverage * 0.6 + jaccardScore * 0.4;
            }

            const matchedAssemblies = Array.from(selectedIds)
                .filter((id) => templateAssemblyIds.has(id))
                .map((id) => {
                    const found = template.assemblies.find((ta: any) => ta.assemblyId === id);
                    const groupInfo = assemblyToGroupMap.get(id);
                    return {
                        id,
                        name: found?.assembly.name || `Assembly #${id}`,
                        isBase: requiredIds.has(id),
                        groupId: groupInfo?.id,
                        groupName: groupInfo?.name || "Other"
                    };
                });

            const missingInTemplate = Array.from(selectedIds)
                .filter((id) => !templateAssemblyIds.has(id))
                .map((id) => {
                    const groupInfo = assemblyToGroupMap.get(id);
                    return {
                        id,
                        name: `Assembly #${id}`,
                        isBase: requiredIds.has(id),
                        groupId: groupInfo?.id,
                        groupName: groupInfo?.name || "Other"
                    };
                });

            return {
                template: {
                    id: template.id,
                    name: template.name,
                    description: template.description,
                    totalAssemblies: templateAssemblyIds.size,
                },
                score: Math.round(score * 10) / 10,
                coverage: Math.round(coverage * 10) / 10,
                jaccardScore: Math.round(jaccardScore * 10) / 10,
                matchedCount: intersectionCount,
                totalSelected: selectedIds.size,
                matchedAssemblies,
                missingAssemblies: missingInTemplate,
                recommendation: score >= 85
                    ? "EXCELLENT_MATCH"
                    : score >= 60
                        ? "GOOD_MATCH"
                        : score > 20
                            ? "PARTIAL_MATCH"
                            : "POOR_MATCH",
            };
        });

        const results = scored
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const top = results[0];
        const needsNewTemplate = !top || top.score < 50;

        return NextResponse.json({
            results,
            summary: {
                totalTemplatesChecked: templates.length,
                topScore: top?.score ?? 0,
                needsNewTemplate,
                discountedBaseItems: requiredIds.size,
                recommendation: needsNewTemplate
                    ? "No templates match your specific choices well. Consider creating a new template."
                    : `Template "${top.template.name}" is the best choice based on your specific selections.`,
            },
        });
    } catch (error: any) {
        console.error("[Questionnaire Recommend Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
