import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const projectId = parseInt(params.id);
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                template: {
                    include: {
                        assemblies: {
                            include: {
                                assembly: {
                                    include: {
                                        materials: true,
                                        category: true
                                    }
                                }
                            }
                        }
                    }
                },
                client: true
            }
        });

        if (!project || !project.template) {
            return NextResponse.json({ error: "Project or template not found" }, { status: 404 });
        }

        // 1. Hierarchical View (Grouped by Assembly)
        const hierarchy = project.template.assemblies.map((ta) => {
            const assembly = ta.assembly;
            const assemblyQty = Number(ta.quantity);

            return {
                id: assembly.id,
                name: assembly.name,
                module: assembly.module,
                category: assembly.category?.name,
                quantity: assemblyQty,
                materials: assembly.materials.map((am: any) => ({
                    id: am.id,
                    externalId: am.externalId,
                    name: am.name,
                    partNumber: am.partNumber,
                    partDesc: am.partDesc,
                    manufacturer: am.manufacturer,
                    unit: am.unit,
                    price: Number(am.price),
                    quantityPerAssembly: Number(am.quantity),
                    totalQuantity: Number(am.quantity) * assemblyQty
                }))
            };
        });

        // 2. Consolidated View (Logic copied from previous version)
        const typicalMaterialMap = new Map();
        const installationMaterials: any[] = [];

        project.template.assemblies.forEach((ta) => {
            const assembly = ta.assembly;
            const assemblyQty = Number(ta.quantity);
            const isInst = assembly.module === 'INSTALLATION';

            assembly.materials.forEach((am: any) => {
                const totalQty = Number(am.quantity) * assemblyQty;
                if (isInst) {
                    installationMaterials.push({
                        name: am.name,
                        partNumber: am.partNumber || "",
                        partDesc: am.partDesc || "",
                        manufacturer: am.manufacturer || "",
                        unit: am.unit,
                        price: Number(am.price),
                        quantity: totalQty,
                        assemblyName: assembly.name,
                        category: assembly.category?.name
                    });
                } else {
                    const key = `${am.name}_${am.partNumber || ''}_${am.manufacturer || ''}_${am.unit}`;
                    if (typicalMaterialMap.has(key)) {
                        typicalMaterialMap.get(key).totalQuantity += totalQty;
                        typicalMaterialMap.get(key).assemblies.add(assembly.name);
                    } else {
                        typicalMaterialMap.set(key, {
                            name: am.name,
                            partNumber: am.partNumber || "",
                            partDesc: am.partDesc || "",
                            manufacturer: am.manufacturer || "",
                            unit: am.unit,
                            price: Number(am.price),
                            totalQuantity: totalQty,
                            assemblies: new Set([assembly.name])
                        });
                    }
                }
            });
        });

        const response = {
            projectId: project.id,
            projectName: project.name,
            projectType: project.projectType,
            client: project.client,
            hierarchy,
            consolidated: {
                typical: Array.from(typicalMaterialMap.values()).map(m => ({
                    ...m,
                    assemblies: Array.from(m.assemblies)
                })),
                installation: installationMaterials
            },
            summary: {
                totalAssemblies: hierarchy.length,
                totalTypicalItems: typicalMaterialMap.size,
                totalInstallationItems: installationMaterials.length
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
