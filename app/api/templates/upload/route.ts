import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
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
    const templateId = data.get("templateId") as string;

    if (!file || !templateId) {
      return NextResponse.json(
        { error: "Missing required fields: file or templateId" },
        { status: 400 }
      );
    }

    // Validate file type - only PDF files allowed
    if (!file.type || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file extension as additional check
    const originalFileName = file.name.toLowerCase();
    if (!originalFileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: "File must have .pdf extension" },
        { status: 400 }
      );
    }

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: Number(templateId) }
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "templates");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `template_${templateId}_${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create public URL path
    const fileUrl = `/uploads/templates/${fileName}`;

    // Create document object
    const docObject = {
      name: originalName,
      url: fileUrl,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString()
    };

    // Get current docs array or create new one
    const currentDocs = template.docs ? (Array.isArray(template.docs) ? template.docs : []) : [];
    const updatedDocs = [...currentDocs, docObject];

    // Update template with new docs array
    const updatedTemplate = await prisma.template.update({
      where: { id: Number(templateId) },
      data: { docs: updatedDocs },
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
        },
        projects: true
      }
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      doc: docObject,
      template: updatedTemplate
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
    const templateId = searchParams.get("templateId");
    const fileUrl = searchParams.get("fileUrl");

    if (!templateId || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required parameters: templateId or fileUrl" },
        { status: 400 }
      );
    }

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: Number(templateId) }
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Get current docs array
    const currentDocs = template.docs ? (Array.isArray(template.docs) ? template.docs : []) : [];

    // Find the document to remove
    const docToRemove = currentDocs.find((doc: any) => doc.url === fileUrl);
    if (!docToRemove) {
      return NextResponse.json(
        { error: "Document not found in template" },
        { status: 404 }
      );
    }

    // Remove file from filesystem
    try {
      const filePath = join(process.cwd(), "public", fileUrl);
      await unlink(filePath);
    } catch (fileError) {
      console.warn("Could not delete file from filesystem:", fileError);
      // Continue with database update even if file deletion fails
    }

    // Update docs array by removing the document
    const updatedDocs = currentDocs.filter((doc: any) => doc.url !== fileUrl);

    const updatedTemplate = await prisma.template.update({
      where: { id: Number(templateId) },
      data: updatedDocs.length > 0 ? { docs: updatedDocs } : { docs: [] },
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
        },
        projects: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Document removed",
      template: updatedTemplate
    });

  } catch (error: any) {
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove document", details: error.message },
      { status: 500 }
    );
  }
}
