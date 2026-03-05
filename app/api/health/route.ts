import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const dbStatus = await checkDatabaseConnection();

        const status = {
            status: dbStatus.connected ? "UP" : "DEGRADED",
            timestamp: new Date().toISOString(),
            database: dbStatus.connected ? "connected" : "disconnected",
            latency: dbStatus.latency ? `${dbStatus.latency}ms` : undefined,
            error: dbStatus.error,
        };

        return NextResponse.json(status, {
            status: dbStatus.connected ? 200 : 503
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "DOWN",
            timestamp: new Date().toISOString(),
            error: error.message || "Unknown error",
        }, { status: 500 });
    }
}
