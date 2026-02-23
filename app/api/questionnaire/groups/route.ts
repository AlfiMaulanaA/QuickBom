import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// GET /api/questionnaire/groups?categoryId=1
// Returns assembly groups filtered by category (categoryId is Int)
export async function GET(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
        return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }

    try {
        // AssemblyGroup.categoryId is Int; AssemblyGroup.id is String (cuid)
        const groups = await prisma.assemblyGroup.findMany({
            where: { categoryId: parseInt(categoryId) },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
                id: true,        // String (cuid)
                name: true,
                description: true,
                groupType: true,
                sortOrder: true,
                _count: {
                    select: { items: true },
                },
            },
        });

        return NextResponse.json({ groups });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
