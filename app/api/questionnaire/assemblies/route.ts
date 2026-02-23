import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// GET /api/questionnaire/assemblies?groupId=<cuid>
// Returns assemblies in a specific assembly group (AssemblyGroup.id is String/cuid)
export async function GET(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
        return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    try {
        // AssemblyGroupItem.groupId is a String (cuid from AssemblyGroup.id)
        const groupItems = await prisma.assemblyGroupItem.findMany({
            where: { groupId }, // String, no parseInt needed
            orderBy: { sortOrder: "asc" },
            include: {
                assembly: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        module: true,
                        category: { select: { name: true, color: true } },
                        _count: { select: { materials: true, templates: true } },
                    },
                },
            },
        });

        const assemblies = groupItems.map((item) => ({
            ...item.assembly,
            isDefault: item.isDefault,
            quantity: item.quantity,
        }));

        return NextResponse.json({ assemblies });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
