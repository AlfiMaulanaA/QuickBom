import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hierarchical BOQ API by Inquiry ID
 * Returns project data + assembly breakdown (hierarchy)
 * path: /api/boq/inquiry/[inquiryId]/hierarki
 */
export async function GET(request: NextRequest, { params }: { params: { inquiryId: string } }) {
    try {
        const inquiryId = parseInt(params.inquiryId);

        if (isNaN(inquiryId)) {
            return NextResponse.json({ error: "Invalid inquiry ID." }, { status: 400 });
        }

        const project = await prisma.project.findFirst({
            where: { crmInquiryId: inquiryId },
            orderBy: { updatedAt: 'desc' },
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
            return NextResponse.json({ error: "Project or template not found for this Inquiry ID." }, { status: 404 });
        }

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

        return NextResponse.json({
            project: {
                id: project.id,
                name: project.name,
                crmInquiryId: project.crmInquiryId,
                status: project.status,
                client: project.client ? {
                    name: project.client.contactPerson,
                    companyName: project.client.companyName
                } : null
            },
            hierarchy
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
