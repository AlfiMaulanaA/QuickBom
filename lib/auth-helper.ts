import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export function getUserFromRequest(request: NextRequest): { userId: string; email: string; name?: string; role?: string } | null {
    const tokenCookie = (request.headers.get("cookie") || "").match(
        /authToken=([^;]+)/
    );
    if (!tokenCookie) return null;

    try {
        const payload = jwt.verify(tokenCookie[1], process.env.JWT_SECRET!) as any;
        if (payload.userId) {
            return {
                userId: payload.userId,
                email: payload.email,
                name: payload.name,
                role: payload.role,
            };
        }
        return null;
    } catch {
        return null;
    }
}
