import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Consolidated BOQ API by Inquiry ID
 * Returns project data + consolidated materials (typical & installation)
 * path: /api/boq/inquiry/[inquiryId]/consolidated
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
                        externalId: am.externalId,
                        name: am.name,
                        partNumber: am.partNumber || "",
                        partDesc: am.partDesc || "",
                        manufacturer: am.manufacturer || "",
                        unit: am.unit,
                        price: Number(am.price),
                        totalQuantity: totalQty,
                        assemblyName: assembly.name
                    });
                } else {
                    const key = `${am.name}_${am.partNumber || ''}_${am.manufacturer || ''}_${am.unit}`;
                    if (typicalMaterialMap.has(key)) {
                        typicalMaterialMap.get(key).totalQuantity += totalQty;
                    } else {
                        typicalMaterialMap.set(key, {
                            externalId: am.externalId,
                            name: am.name,
                            partNumber: am.partNumber || "",
                            partDesc: am.partDesc || "",
                            manufacturer: am.manufacturer || "",
                            unit: am.unit,
                            price: Number(am.price),
                            totalQuantity: totalQty
                        });
                    }
                }
            });
        });

        return NextResponse.json({
            project: {
                id: project.id,
                name: project.name,
                crmInquiryId: project.crmInquiryId,
                status: project.status,
                totalPrice: Number(project.totalPrice),
                client: project.client ? {
                    name: project.client.contactPerson,
                    companyName: project.client.companyName
                } : null
            },
            consolidatedMaterials: {
                typical: Array.from(typicalMaterialMap.values()),
                installation: installationMaterials
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
    }
}
