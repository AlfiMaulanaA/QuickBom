import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const tokenCookie = (request.headers.get("cookie") || "").match(
    /authToken=([^;]+)/
  );

  if (!tokenCookie) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(tokenCookie[1], process.env.JWT_SECRET!) as any;

    // Validate user exists in database
    if (payload.userId) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true }
      });

      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 401 });
      }

      return NextResponse.json({
        userId: payload.userId,
        email: payload.email,
        name: user.name,
        role: payload.role || 'user', // Use role from token payload
        isAuthenticated: true
      });
    }

    return NextResponse.json({ message: "Invalid token payload" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  } finally {
    await prisma.$disconnect();
  }
}
