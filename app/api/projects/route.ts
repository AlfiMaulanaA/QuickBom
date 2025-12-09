import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookie, requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTimeline = searchParams.get('include') === 'timeline';

    const projects = await prisma.project.findMany({
      include: {
        template: {
          include: {
            assemblies: {
              include: {
                assembly: {
                  include: {
                    materials: {
                      include: {
                        material: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        client: true,
        creator: true,
        ...(includeTimeline && {
          timeline: {
            include: {
              milestones: {
                include: {
                  tasks: true
                }
              },
              tasks: {
                include: {
                  milestone: true
                }
              }
            }
          }
        })
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ensure we return an array even if database is empty
    if (!projects) {
      return NextResponse.json([]);
    }

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('API Error [GET /api/projects]:', error);

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
        error: "Failed to fetch projects",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log out and log back in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      clientId,
      projectType,
      location,
      area,
      budget,
      startDate,
      endDate,
      actualStart,
      actualEnd,
      status,
      progress,
      priority,
      fromTemplateId,
      assignedUsers,
      schematicDocs,
      qualityCheckDocs
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Calculate total price if template is provided
    let totalPrice = 0;
    if (fromTemplateId) {
      const template = await prisma.template.findUnique({
        where: { id: fromTemplateId },
        include: {
          assemblies: {
            include: {
              assembly: {
                include: {
                  materials: {
                    include: {
                      material: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      // Calculate total price from template
      for (const templateAssembly of template.assemblies) {
        const assembly = templateAssembly.assembly;
        for (const assemblyMaterial of assembly.materials) {
          const material = assemblyMaterial.material;
          totalPrice += Number(material.price) * Number(assemblyMaterial.quantity) * Number(templateAssembly.quantity);
        }
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        clientId: clientId || null,
        projectType: projectType || null,
        location: location || null,
        area: area ? Number(area) : null,
        budget: budget ? Number(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        actualStart: actualStart ? new Date(actualStart) : null,
        actualEnd: actualEnd ? new Date(actualEnd) : null,
        status: status || "PLANNING",
        progress: progress ? Number(progress) : 0,
        priority: priority || "MEDIUM",
        schematicDocs: schematicDocs || null,
        qualityCheckDocs: qualityCheckDocs || "/docs/Checksheet Form.docx",
        fromTemplateId,
        totalPrice,
        createdBy: auth.userId,
        assignedUsers: assignedUsers || []
      },
      include: {
        template: true,
        creator: true,
        client: true
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please log out and log back in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      name,
      description,
      clientId,
      projectType,
      location,
      area,
      budget,
      startDate,
      endDate,
      actualStart,
      actualEnd,
      status,
      progress,
      priority,
      assignedUsers,
      schematicDocs,
      qualityCheckDocs
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name,
        description: description || null,
        clientId: clientId || null,
        projectType: projectType || null,
        location: location || null,
        area: area ? Number(area) : null,
        budget: budget ? Number(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        actualStart: actualStart ? new Date(actualStart) : null,
        actualEnd: actualEnd ? new Date(actualEnd) : null,
        status: status || "PLANNING",
        progress: progress ? Number(progress) : 0,
        priority: priority || "MEDIUM",
        ...(schematicDocs !== undefined && { schematicDocs }),
        ...(qualityCheckDocs !== undefined && { qualityCheckDocs }),
        assignedUsers: assignedUsers || []
      },
      include: {
        template: {
          include: {
            assemblies: {
              include: {
                assembly: {
                  include: {
                    materials: {
                      include: {
                        material: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        creator: true,
        client: true
      }
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project", details: error.message },
      { status: 500 }
    );
  }
}
