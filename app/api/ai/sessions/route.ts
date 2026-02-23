import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// GET /api/ai/sessions - list all sessions for current user
export async function GET(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: user.userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { messages: true } },
            },
        });
        return NextResponse.json({ sessions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/ai/sessions - create new chat session
export async function POST(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { title } = await request.json().catch(() => ({}));
        const session = await prisma.chatSession.create({
            data: {
                userId: user.userId,
                title: title || null,
            },
        });
        return NextResponse.json({ session }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
