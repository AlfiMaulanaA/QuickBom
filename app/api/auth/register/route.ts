// File: app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";


export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validasi input dasar
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Cek apakah email sudah ada
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use." },
        { status: 409 } // Conflict
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat pengguna baru dengan peran WORKER (default)
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "WORKER", // Default role for new users
      },
    });

    // Jangan kirim data sensitif kembali
    return NextResponse.json(
      { message: "User created successfully. Please login." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API Error [POST /api/auth/register]:', error);

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

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        message: "An error occurred during registration",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
