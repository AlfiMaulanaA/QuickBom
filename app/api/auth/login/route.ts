// File: app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    console.log('Login attempt - Received request');

    const body = await request.json();
    console.log('Login attempt - Body parsed');

    const { email, password } = body;
    console.log('Login attempt - Extracted email/password');

    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Login attempt - User lookup completed:', user ? 'found' : 'not found');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Login attempt - Invalid credentials');
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Use the actual role from the database
    const roleName = user.role;
    console.log('Login attempt - Role determined:', roleName);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable not found');
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: roleName,
        email: user.email
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    console.log('Login attempt - JWT token created successfully');

    const serializedCookie = serialize("authToken", token, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 hari
      path: "/",
    });

    console.log('Login attempt - Cookie serialized');

    // Kirim response dengan header Set-Cookie DAN token di body
    return new Response(
      JSON.stringify({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          role: roleName
        },
        token
      }),
      {
        status: 200,
        headers: { "Set-Cookie": serializedCookie },
      }
    );
  } catch (error: any) {
    console.error('API Error [POST /api/auth/login]:', error);

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

    // Generic error response
    return NextResponse.json(
      {
        message: "An error occurred during login",
        error: error.message || "Unknown error",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
