import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-helper";
import { fetchDatabaseContext } from "@/lib/ai-db-context";

// GET /api/ai/context - preview what DB data the AI can see
export async function GET(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const context = await fetchDatabaseContext();
        return NextResponse.json({ context });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
