import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// GET /api/questionnaire/categories
// Returns all assembly categories
export async function GET(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const categories = await prisma.assemblyCategory.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                icon: true,
                _count: {
                    select: {
                        assemblies: true,
                        assemblyGroups: true,
                    },
                },
            },
        });

        return NextResponse.json({ categories });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
