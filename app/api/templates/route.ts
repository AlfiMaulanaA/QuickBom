import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        assemblies: {
          include: {
            assembly: {
              include: {
                category: true,
                materials: true
              }
            }
          }
        },
        projects: true,
        assemblyGroups: {
          include: {
            category: true,
            items: {
              include: {
                assembly: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ensure we return an array even if database is empty
    if (!templates) {
      return NextResponse.json([]);
    }

    // Transform data to ensure consistent format
    const transformedTemplates = templates.map(template => ({
      ...template,
      assemblies: template.assemblies.map(ta => ({
        ...ta,
        quantity: Number(ta.quantity) // Ensure quantity is number, not string
      }))
    }));

    return NextResponse.json(transformedTemplates);
  } catch (error: any) {
    console.error('API Error [GET /api/templates]:', error);

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
        error: "Failed to fetch templates",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, docs, assemblies, assemblySelections } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // --- De-duplicate assemblies by assemblyId (sum quantities for duplicates) ---
    // Prevents Unique constraint error on (templateId, assemblyId) when same assembly
    // appears in multiple groups from the CategoryBasedSelector
    const deduplicatedAssemblies = assemblies
      ? Object.values(
        (assemblies as { assemblyId: number; quantity: number }[]).reduce(
          (acc: Record<number, { assemblyId: number; quantity: number }>, a) => {
            if (acc[a.assemblyId]) {
              acc[a.assemblyId].quantity += Number(a.quantity) || 1;
            } else {
              acc[a.assemblyId] = { assemblyId: a.assemblyId, quantity: Number(a.quantity) || 1 };
            }
            return acc;
          },
          {}
        )
      )
      : [];

    const template = await prisma.template.create({
      data: {
        name,
        description: description || null,
        docs: docs || null,
        assemblySelections: assemblySelections || null,
        ...(deduplicatedAssemblies.length > 0 ? {
          assemblies: {
            create: deduplicatedAssemblies.map((a) => ({
              assemblyId: a.assemblyId,
              quantity: a.quantity
            }))
          }
        } : {})
      },
      include: {
        assemblies: {
          include: {
            assembly: {
              include: {
                category: true,
                materials: true
              }
            }
          }
        },
        projects: true,
        assemblyGroups: {
          include: {
            category: true,
            items: {
              include: {
                assembly: true
              }
            }
          }
        }
      }
    });

    // Transform data to ensure consistent format
    const transformedTemplate = {
      ...template,
      assemblies: template.assemblies.map(ta => ({
        ...ta,
        quantity: Number(ta.quantity) // Ensure quantity is number, not string
      }))
    };

    return NextResponse.json(transformedTemplate, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Template with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
