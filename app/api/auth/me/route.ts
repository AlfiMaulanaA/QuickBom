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
  } catch (error: any) {
    console.error('API Error [GET /api/auth/me]:', error);

    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json(
        { message: "Database server unreachable", details: "Please check database connection" },
        { status: 503 }
      );
    }

    if (error.code === 'P2028') {
      return NextResponse.json(
        { message: "Database operation timeout", details: "Request took too long to process" },
        { status: 504 }
      );
    }

    // JWT errors or other issues
    return NextResponse.json(
      {
        message: "Authentication error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 401 }
    );
  }
  // Removed prisma.$disconnect() - not needed in Vercel serverless functions
}
