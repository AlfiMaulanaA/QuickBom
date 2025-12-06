import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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

    const data = await request.formData();
    const file = data.get("file") as File;
    const projectId = data.get("projectId") as string;
    const docType = data.get("docType") as string; // "schematic" or "qualityCheck"

    if (!file || !projectId || !docType) {
      return NextResponse.json(
        { error: "Missing required fields: file, projectId, or docType" },
        { status: 400 }
      );
    }

    // Validate docType
    if (!["schematic", "qualityCheck"].includes(docType)) {
      return NextResponse.json(
        { error: "Invalid docType. Must be 'schematic' or 'qualityCheck'" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "projects");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${projectId}_${docType}_${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create public URL path
    const fileUrl = `/uploads/projects/${fileName}`;

    // Update project with file path
    const updateData: any = {};
    if (docType === "schematic") {
      updateData.schematicDocs = fileUrl;
    } else if (docType === "qualityCheck") {
      updateData.qualityCheckDocs = fileUrl;
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(projectId) },
      data: updateData,
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
        creator: true
      }
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      project: updatedProject
    });

  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove files
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const docType = searchParams.get("docType");

    if (!projectId || !docType) {
      return NextResponse.json(
        { error: "Missing required parameters: projectId or docType" },
        { status: 400 }
      );
    }

    // Validate docType
    if (!["schematic", "qualityCheck"].includes(docType)) {
      return NextResponse.json(
        { error: "Invalid docType. Must be 'schematic' or 'qualityCheck'" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Clear the file path in database
    const updateData: any = {};
    if (docType === "schematic") {
      updateData.schematicDocs = null;
    } else if (docType === "qualityCheck") {
      updateData.qualityCheckDocs = null;
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(projectId) },
      data: updateData,
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
        creator: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "File reference removed",
      project: updatedProject
    });

  } catch (error: any) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove file reference", details: error.message },
      { status: 500 }
    );
  }
}
