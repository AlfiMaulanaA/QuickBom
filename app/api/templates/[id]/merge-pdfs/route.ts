import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

const ILOVEPDF_PUBLIC_KEY = "project_public_a9f4bea676c8f8e97e06ec2a3b2a348185d8a57e59ba";
const ILOVEPDF_SECRET_KEY = "secret_key_65a51e430b3e1c63e317f7785293a5a5_iBlqW554eb6973b71b5d88aeac55f67ca21ab";

// Initialize Supabase client (lazy initialization to avoid build-time errors)
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase environment variables not configured');
    }

    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase;
}

interface PDFMergeRequest {
  templateName?: string;
  pdfOrder?: number[]; // Array of assembly IDs in merge order
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const templateId = parseInt(params.id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "Invalid template ID" },
        { status: 400 }
      );
    }

    const body: PDFMergeRequest = await request.json().catch(() => ({}));
    const { templateName, pdfOrder } = body;

    // Fetch template with all assemblies and their documents
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: {
        assemblies: {
          include: {
            assembly: true
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

    // Sort assemblies based on pdfOrder if provided
    let sortedAssemblies = template.assemblies;
    if (pdfOrder && pdfOrder.length > 0) {
      // Create a map for quick lookup
      const assemblyMap = new Map(template.assemblies.map(ta => [ta.assemblyId, ta]));

      // Sort assemblies based on the provided order
      sortedAssemblies = pdfOrder
        .map(assemblyId => assemblyMap.get(assemblyId))
        .filter(Boolean) as typeof template.assemblies;

      // Add any assemblies not in the order array at the end
      const orderedIds = new Set(pdfOrder);
      const remainingAssemblies = template.assemblies.filter(ta => !orderedIds.has(ta.assemblyId));
      sortedAssemblies = [...sortedAssemblies, ...remainingAssemblies];

      console.log(`📋 Custom PDF merge order applied: ${pdfOrder.join(', ')}`);
    }

    // Collect all PDF files from assemblies in the specified order
    const pdfFiles: { url: string; name: string; assemblyName: string }[] = [];
    const tempFiles: string[] = []; // Track files that haven't been uploaded yet

    for (const templateAssembly of sortedAssemblies) {
      const assembly = templateAssembly.assembly;

      // Parse docs Json field
      let docs: any[] = [];
      if (assembly.docs) {
        try {
          docs = Array.isArray(assembly.docs) ? assembly.docs : JSON.parse(assembly.docs as string);
        } catch (error) {
          console.warn(`Failed to parse docs for assembly ${assembly.id}:`, error);
          continue;
        }
      }

      if (docs && docs.length > 0) {
        for (const doc of docs) {
          // Check if it's a PDF file
          const isPdf = doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf');

          if (isPdf) {
            if (doc.url.startsWith('#temp-')) {
              // Track temporary files that haven't been uploaded
              tempFiles.push(doc.name);
            } else {
              // Include uploaded PDF files with assembly name for better tracking
              pdfFiles.push({
                url: doc.url,
                name: doc.name,
                assemblyName: assembly.name
              });
            }
          }
        }
      }
    }

    // Check for temporary files that need to be uploaded first
    if (tempFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Some PDF files need to be uploaded first: ${tempFiles.join(', ')}. Please upload these files before merging.`
        },
        { status: 400 }
      );
    }

    if (pdfFiles.length === 0) {
      return NextResponse.json(
        { error: "No PDF files found in template assemblies" },
        { status: 400 }
      );
    }

    if (pdfFiles.length === 1) {
      return NextResponse.json(
        { error: "Only one PDF file found. Need at least 2 files to merge" },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting PDF merge for template "${template.name}"`);
    console.log(`📄 Found ${pdfFiles.length} PDF files to merge`);

    // Step 1: Read all PDF files from local filesystem
    const pdfBuffers: Buffer[] = [];

    for (const pdfFile of pdfFiles) {
      try {
        console.log(`📖 Reading file: ${pdfFile.name}`);

        // File URL is stored as '/uploads/assemblies/filename.pdf' or '/uploads/templates/filename.pdf'
        // Convert to absolute path: process.cwd() + '/public' + pdfFile.url
        const filePath = join(process.cwd(), 'public', pdfFile.url);
        console.log(`📁 File path: ${filePath}`);

        const buffer = await readFile(filePath);
        pdfBuffers.push(buffer);
        console.log(`✅ Read ${pdfFile.name} (${buffer.length} bytes)`);

      } catch (error) {
        console.error(`❌ Error reading ${pdfFile.name}:`, error);
        continue;
      }
    }

    if (pdfBuffers.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 valid PDF files to merge" },
        { status: 400 }
      );
    }

    console.log(`📋 Successfully downloaded ${pdfBuffers.length} PDF files`);

    let mergedPdfBuffer: Uint8Array;
    let mergeMethod = 'pdf-lib';

    try {
      // Step 2: Try ilovepdf API first
      console.log('🚀 Attempting merge with ilovepdf API...');

      // Step 2a: Upload files to ilovepdf first
      const uploadedFiles = [];

      for (let i = 0; i < pdfBuffers.length; i++) {
        const formData = new FormData();
        formData.append('file', new Blob([new Uint8Array(pdfBuffers[i])], { type: 'application/pdf' }), `file_${i + 1}.pdf`);

        const uploadResponse = await fetch('https://api.ilovepdf.com/v1/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for file ${i + 1}`);
        }

        const uploadData = await uploadResponse.json();
        uploadedFiles.push(uploadData.server_filename);
        console.log(`✅ Uploaded file ${i + 1} to ilovepdf: ${uploadData.server_filename}`);
      }

      // Step 2b: Create merge task
      const taskResponse = await fetch('https://api.ilovepdf.com/v1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'merge',
          files: uploadedFiles.map(filename => ({
            server_filename: filename
          }))
        })
      });

      if (!taskResponse.ok) {
        throw new Error('Task creation failed');
      }

      const taskData = await taskResponse.json();
      const taskId = taskData.task;

      console.log(`✅ Created ilovepdf merge task: ${taskId}`);

      // Step 2c: Process the task
      const processResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!processResponse.ok) {
        throw new Error('Task processing failed');
      }

      const processData = await processResponse.json();

      if (processData.status !== 'TaskSuccess') {
        throw new Error('Task processing unsuccessful');
      }

      console.log('✅ ilovepdf merge completed successfully');

      // Step 2d: Download the merged PDF
      const downloadResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`
        }
      });

      if (!downloadResponse.ok) {
        throw new Error('Download failed');
      }

      mergedPdfBuffer = new Uint8Array(await downloadResponse.arrayBuffer());
      console.log(`📦 Downloaded merged PDF from ilovepdf (${mergedPdfBuffer.length} bytes)`);

    } catch (ilovepdfError: any) {
      console.log('⚠️ ilovepdf failed, falling back to pdf-lib:', ilovepdfError.message);

      // Fallback to pdf-lib
      console.log('🚀 Falling back to pdf-lib for PDF merging...');

      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      // Process each PDF file
      for (let i = 0; i < pdfBuffers.length; i++) {
        try {
          // Load the PDF document
          const pdfDoc = await PDFDocument.load(pdfBuffers[i]);
          const pageCount = pdfDoc.getPageCount();

          console.log(`📖 Processing ${pdfFiles[i].name}: ${pageCount} pages`);

          // Copy all pages from this PDF to the merged PDF
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach(page => mergedPdf.addPage(page));

          totalPages += pageCount;

        } catch (error) {
          console.error(`❌ Failed to process ${pdfFiles[i].name}:`, error);
          throw new Error(`Failed to process PDF: ${pdfFiles[i].name}`);
        }
      }

      // Serialize the merged PDF
      mergedPdfBuffer = await mergedPdf.save();
      mergeMethod = 'pdf-lib';

      console.log(`📋 pdf-lib merged ${pdfBuffers.length} PDFs into ${totalPages} total pages`);
    }

    // Step 3: Save merged PDF to local filesystem
    const mergedFileName = `merged_${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`;
    const templatesUploadDir = join(process.cwd(), 'public', 'uploads', 'templates');

    // Ensure templates directory exists
    try {
      const { mkdir } = await import('fs/promises');
      await mkdir(templatesUploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    const localFilePath = join(templatesUploadDir, mergedFileName);
    const { writeFile } = await import('fs/promises');
    await writeFile(localFilePath, mergedPdfBuffer);

    const publicUrl = `/uploads/templates/${mergedFileName}`;
    console.log(`✅ Saved merged PDF to: ${localFilePath}`);
    console.log(`📄 Public URL: ${publicUrl}`);

    // Step 4: Save reference in template documents
    const mergedDocData = {
      name: `Merged PDFs - ${template.name}`,
      url: publicUrl,
      size: mergedPdfBuffer.length,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString()
    };

    console.log('📝 Saving merged PDF reference to template...');
    console.log('Merged doc data:', mergedDocData);

    // Get current template docs to ensure proper update
    const currentTemplate = await prisma.template.findUnique({
      where: { id: templateId },
      select: { docs: true }
    });

    let currentDocs: any[] = [];
    if (currentTemplate?.docs && Array.isArray(currentTemplate.docs)) {
      currentDocs = currentTemplate.docs as any[];
    }

    const updatedDocs = [...currentDocs, mergedDocData];

    console.log('Current docs count:', currentDocs.length);
    console.log('Updated docs count:', updatedDocs.length);

    // Update template with merged document
    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        docs: updatedDocs
      },
      select: {
        id: true,
        name: true,
        docs: true
      }
    });

    console.log('✅ Template updated successfully');
    const finalDocs = Array.isArray(updatedTemplate.docs) ? updatedTemplate.docs : [];
    console.log('Final docs count:', finalDocs.length);
    console.log('Merged file in docs:', finalDocs.find((d: any) => d.url === publicUrl));

    return NextResponse.json({
      success: true,
      message: `PDFs merged successfully using ${mergeMethod}`,
      mergedFile: {
        name: mergedDocData.name,
        url: mergedDocData.url,
        size: mergedDocData.size,
        type: mergedDocData.type,
        uploadedAt: mergedDocData.uploadedAt
      },
      totalFilesMerged: pdfBuffers.length,
      mergeMethod: mergeMethod
    });

  } catch (error: any) {
    console.error("PDF merge error:", error);
    return NextResponse.json(
      { error: "Failed to merge PDFs", details: error.message },
      { status: 500 }
    );
  }
}
