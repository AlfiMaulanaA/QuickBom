import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('[API] GET /api/assembly-categories - Starting fetch');
    const categories = await prisma.assemblyCategory.findMany({
      include: {
        assemblies: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            assemblies: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`[API] GET /api/assembly-categories - Found ${categories?.length || 0} categories`);

    // Ensure we return an array even if database is empty
    if (!categories) {
      console.log('[API] GET /api/assembly-categories - No categories found, returning empty array');
      return NextResponse.json([]);
    }

    console.log('[API] GET /api/assembly-categories - Returning categories successfully');
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('API Error [GET /api/assembly-categories]:', error);

    // Handle specific Prisma errors
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: "Database server unreachable", details: "Please check database connection" },
        { status: 503 }
      );
    }

    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: "Database operation timeout", details: "Request took too long to process" },
        { status: 504 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: "Failed to fetch assembly categories",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await prisma.assemblyCategory.create({
      data: {
        name,
        description: description || null,
        color: color || null,
        icon: icon || null
      },
      include: {
        assemblies: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        _count: {
          select: {
            assemblies: true
          }
        }
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Assembly category with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create assembly category" },
      { status: 500 }
    );
  }
}
