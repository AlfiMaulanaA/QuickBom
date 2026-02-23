import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";

// GET /api/ai/sessions/[id] - get session with messages
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: params.id, userId: user.userId },
            include: {
                messages: { orderBy: { createdAt: "asc" } },
            },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ session });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/ai/sessions/[id] - delete a session
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const session = await prisma.chatSession.findFirst({
            where: { id: params.id, userId: user.userId },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        await prisma.chatSession.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/ai/sessions/[id] - rename session
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { title } = await request.json();
        const session = await prisma.chatSession.findFirst({
            where: { id: params.id, userId: user.userId },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const updated = await prisma.chatSession.update({
            where: { id: params.id },
            data: { title },
        });

        return NextResponse.json({ session: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
