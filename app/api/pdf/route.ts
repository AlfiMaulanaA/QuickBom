import { NextRequest, NextResponse } from "next/server";
import { readFile } from 'fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// const ILOVEPDF_SECRET_KEY = "secret_key_65a51e430b3e1c63e317f7785293a5a348185d8a57e59ba";
const ILOVEPDF_SECRET_KEY = "dummy_key_for_mock_processing"; // Not used when USE_MOCK_PROCESSING = true
const USE_MOCK_PROCESSING = true; // Set to false when you have a valid iLovePDF API key

interface PDFOperationRequest {
  fileUrl?: string; // Optional for merge operations
  fileUrls?: string[]; // For merge operations
  operation: 'split' | 'compress' | 'rotate' | 'protect' | 'organize' | 'merge';
  options?: {
    // Split options
    ranges?: string; // "1-3,5,7-9"

    // Rotate options
    rotation?: number; // 90, 180, 270

    // Protect options
    password?: string;

    // Organize options
    pageOrder?: number[]; // [3,1,2,4] - reorder pages

    // Merge options
    mergeOrder?: string[]; // Array of file URLs in merge order
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const fileUrls = searchParams.get('fileUrls')?.split(',') || [];
  const fileUrl = searchParams.get('fileUrl');
  const options = JSON.parse(searchParams.get('options') || '{}');

  if (!operation) {
    return NextResponse.json(
      { error: "Missing operation parameter" },
      { status: 400 }
    );
  }

  try {
    // Generate preview based on operation type
    let previewData: any = {};

    switch (operation) {
      case 'merge':
        if (fileUrls.length < 2) {
          return NextResponse.json(
            { error: "Merge preview requires at least 2 files" },
            { status: 400 }
          );
        }
        previewData = await generateMergePreview(fileUrls);
        break;

      case 'organize':
        if (!fileUrl) {
          return NextResponse.json(
            { error: "Organize preview requires fileUrl" },
            { status: 400 }
          );
        }
        previewData = await generateOrganizePreview(fileUrl, options.pageOrder || []);
        break;

      default:
        return NextResponse.json(
          { error: "Preview not available for this operation" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation,
      preview: previewData
    });

  } catch (error: any) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate preview: ${error.message}` },
      { status: 500 }
    );
  }
}

async function generateMergePreview(fileUrls: string[]): Promise<any> {
  // Simulate merge preview by getting file info
  const fileInfos = [];

  for (const url of fileUrls) {
    try {
      const filePath = join(process.cwd(), 'public', url);
      const stats = await import('fs/promises').then(fs => fs.stat(filePath));

      // Try to get page count (simplified - in real implementation you'd use pdf-lib)
      fileInfos.push({
        name: url.split('/').pop() || 'Unknown',
        size: stats.size,
        url: url,
        pages: Math.floor(Math.random() * 10) + 1 // Mock page count
      });
    } catch (error) {
      fileInfos.push({
        name: url.split('/').pop() || 'Unknown',
        size: 0,
        url: url,
        pages: 1
      });
    }
  }

  const totalPages = fileInfos.reduce((sum, file) => sum + file.pages, 0);
  const totalSize = fileInfos.reduce((sum, file) => sum + file.size, 0);

  return {
    type: 'merge',
    files: fileInfos,
    summary: {
      totalFiles: fileInfos.length,
      totalPages,
      totalSize,
      estimatedOutputSize: Math.round(totalSize * 0.95) // Rough estimate
    },
    previewText: `Will merge ${fileInfos.length} files into 1 PDF with ${totalPages} total pages`
  };
}

async function generateOrganizePreview(fileUrl: string, pageOrder: number[]): Promise<any> {
  try {
    const filePath = join(process.cwd(), 'public', fileUrl);
    const stats = await import('fs/promises').then(fs => fs.stat(filePath));

    // Mock page information (in real implementation, extract actual page info)
    const totalPages = Math.floor(Math.random() * 20) + 5; // Mock total pages
    const pages = Array.from({ length: totalPages }, (_, i) => ({
      originalIndex: i + 1,
      content: `Page ${i + 1} content...`
    }));

    let organizedPages;
    if (pageOrder.length > 0) {
      // Apply custom page order
      organizedPages = pageOrder.map(index => {
        const page = pages.find(p => p.originalIndex === index);
        return page || { originalIndex: index, content: `Page ${index} (not found)` };
      });
    } else {
      organizedPages = [...pages];
    }

    return {
      type: 'organize',
      originalPages: totalPages,
      organizedPages: organizedPages.length,
      pageMapping: organizedPages.map((page, newIndex) => ({
        newPosition: newIndex + 1,
        originalPosition: page.originalIndex,
        content: page.content.substring(0, 50) + '...'
      })),
      fileSize: stats.size,
      previewText: `Will reorganize ${totalPages} pages according to the specified order`
    };
  } catch (error) {
    return {
      type: 'organize',
      error: 'Could not generate preview',
      previewText: 'Preview unavailable - file may not exist or be accessible'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PDFOperationRequest = await request.json();
    const { fileUrl, fileUrls, operation, options = {} } = body;

    if (!operation) {
      return NextResponse.json(
        { error: "Missing required field: operation" },
        { status: 400 }
      );
    }

    // Validate operation
    const validOperations = ['split', 'compress', 'rotate', 'protect', 'organize', 'merge'];
    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${validOperations.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle merge operation differently
    if (operation === 'merge') {
      if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length < 2) {
        return NextResponse.json(
          { error: "Merge operation requires at least 2 files in fileUrls array" },
          { status: 400 }
        );
      }

      console.log(`🔄 Starting PDF merge operation for ${fileUrls.length} files`);
      const result = USE_MOCK_PROCESSING
        ? await mockProcessMerge(fileUrls, options)
        : await processMergeWithILovePDF(fileUrls, options);

      // Save the merged file
      const outputDir = join(process.cwd(), 'public', 'uploads', 'pdf-tools');
      await mkdir(outputDir, { recursive: true });

      const outputFileName = `merge_${Date.now()}_merged.pdf`;
      const outputPath = join(outputDir, outputFileName);
      await writeFile(outputPath, result.buffer);

      const publicUrl = `/uploads/pdf-tools/${outputFileName}`;

      console.log(`✅ PDF merge completed successfully. Output: ${publicUrl}`);

      return NextResponse.json({
        success: true,
        operation: 'merge',
        inputFiles: fileUrls,
        outputFile: {
          url: publicUrl,
          size: result.buffer.length,
          pages: result.pages
        }
      });
    }

    // Single file operations
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing required field: fileUrl (required for single file operations)" },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting PDF ${operation} operation for: ${fileUrl}`);

    // Read the source file
    const filePath = join(process.cwd(), 'public', fileUrl);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await readFile(filePath);
      console.log(`📖 Read source file: ${fileBuffer.length} bytes`);
    } catch (error) {
      return NextResponse.json(
        { error: "Source file not found or cannot be read" },
        { status: 404 }
      );
    }

    // Process PDF (use mock processing if API key is not available)
    const result = USE_MOCK_PROCESSING
      ? await mockProcessPDF(fileBuffer, operation, options)
      : await processWithILovePDF(fileBuffer, operation, options);

    // Save the processed file
    const outputDir = join(process.cwd(), 'public', 'uploads', 'pdf-tools');
    await mkdir(outputDir, { recursive: true });

    const outputFileName = `${operation}_${Date.now()}_${fileUrl.split('/').pop()}`;
    const outputPath = join(outputDir, outputFileName);
    await writeFile(outputPath, result.buffer);

    const publicUrl = `/uploads/pdf-tools/${outputFileName}`;

    console.log(`✅ ${operation} completed successfully. Output: ${publicUrl}`);

    return NextResponse.json({
      success: true,
      operation,
      inputFile: fileUrl,
      outputFile: {
        url: publicUrl,
        size: result.buffer.length,
        pages: result.pages
      }
    });

  } catch (error: any) {
    console.error(`PDF ${error.operation || 'unknown'} error:`, error);
    return NextResponse.json(
      { error: `Failed to process PDF: ${error.message}` },
      { status: 500 }
    );
  }
}

async function processWithILovePDF(
  fileBuffer: Buffer,
  operation: string,
  options: any
): Promise<{ buffer: Buffer; pages: number }> {
  try {
    console.log(`🔄 Processing ${operation} with iLovePDF...`);

    // Step 1: Create task first (some APIs require this order)
    const taskResponse = await fetch('https://api.ilovepdf.com/v1/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: operation,
        files: [] // We'll add files after task creation
      })
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error('Task creation failed:', taskResponse.status, errorText);
      throw new Error(`Task creation failed: ${taskResponse.status}`);
    }

    const taskData = await taskResponse.json();
    const taskId = taskData.task;
    console.log(`✅ Created task: ${taskId}`);

    // Step 2: Upload file to the created task
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' }), 'file.pdf');

    const uploadResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('File upload failed:', uploadResponse.status, errorText);
      throw new Error(`File upload failed: ${uploadResponse.status}`);
    }

    const uploadData = await uploadResponse.json();
    console.log(`✅ File uploaded: ${uploadData.server_filename}`);

    // Step 3: Process the task
    const processConfig = getProcessConfig(operation, options);
    console.log(`🔄 Processing task with config:`, processConfig);

    const processResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(processConfig)
    });

    if (!processResponse.ok) {
      const errorText = await processResponse.text();
      console.error('Task processing failed:', processResponse.status, errorText);
      throw new Error(`Task processing failed: ${processResponse.status}`);
    }

    const processData = await processResponse.json();
    console.log(`✅ Task processed:`, processData);

    if (processData.status !== 'TaskSuccess') {
      throw new Error(`Task processing unsuccessful: ${processData.status}`);
    }

    // Step 4: Download the result
    console.log(`🔄 Downloading result...`);
    const downloadResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`
      }
    });

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error('Download failed:', downloadResponse.status, errorText);
      throw new Error(`Download failed: ${downloadResponse.status}`);
    }

    const resultBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    console.log(`✅ Downloaded ${resultBuffer.length} bytes`);

    return {
      buffer: resultBuffer,
      pages: processData.output?.pages || 1
    };

  } catch (error) {
    console.error(`iLovePDF ${operation} failed:`, error);
    throw error;
  }
}

async function processMergeWithILovePDF(
  fileUrls: string[],
  options: any
): Promise<{ buffer: Buffer; pages: number }> {
  try {
    // Step 1: Upload all files to iLovePDF
    const uploadedFiles = [];

    for (let i = 0; i < fileUrls.length; i++) {
      const fileUrl = fileUrls[i];
      const filePath = join(process.cwd(), 'public', fileUrl);

      try {
        const fileBuffer = await readFile(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' }), `file_${i + 1}.pdf`);

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

      } catch (error) {
        console.error(`❌ Failed to upload ${fileUrl}:`, error);
        throw new Error(`Failed to upload file: ${fileUrl}`);
      }
    }

    // Step 2: Create merge task
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
      throw new Error('Merge task creation failed');
    }

    const taskData = await taskResponse.json();
    const taskId = taskData.task;

    console.log(`✅ Created ilovepdf merge task: ${taskId}`);

    // Step 3: Process the merge task
    const processResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!processResponse.ok) {
      throw new Error('Merge task processing failed');
    }

    const processData = await processResponse.json();
    if (processData.status !== 'TaskSuccess') {
      throw new Error('Merge task processing unsuccessful');
    }

    console.log('✅ PDF merge completed successfully');

    // Step 4: Download the merged PDF
    const downloadResponse = await fetch(`https://api.ilovepdf.com/v1/tasks/${taskId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ILOVEPDF_SECRET_KEY}`
      }
    });

    if (!downloadResponse.ok) {
      throw new Error('Merge download failed');
    }

    const resultBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    console.log(`📦 Downloaded merged PDF (${resultBuffer.length} bytes)`);

    return {
      buffer: resultBuffer,
      pages: processData.output?.pages || 1
    };

  } catch (error) {
    console.error('iLovePDF merge failed:', error);
    throw error;
  }
}

async function mockProcessPDF(
  fileBuffer: Buffer,
  operation: string,
  options: any
): Promise<{ buffer: Buffer; pages: number }> {
  console.log(`🔄 Mock processing ${operation}...`);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Mock different behaviors based on operation
  let pageCount = 1;

  switch (operation) {
    case 'compress':
      pageCount = Math.floor(Math.random() * 10) + 1;
      const compressedPDF = createMockPDF([{ name: 'compressed.pdf', size: Math.floor(fileBuffer.length * 0.7), pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock compress completed: ${compressedPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: compressedPDF,
        pages: pageCount
      };

    case 'split':
      pageCount = Math.floor(Math.random() * 5) + 1;
      const splitPDF = createMockPDF([{ name: 'split_part.pdf', size: fileBuffer.length, pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock split completed: ${splitPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: splitPDF,
        pages: pageCount
      };

    case 'rotate':
      pageCount = Math.floor(Math.random() * 10) + 1;
      const rotatedPDF = createMockPDF([{ name: 'rotated.pdf', size: fileBuffer.length, pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock rotate completed: ${rotatedPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: rotatedPDF,
        pages: pageCount
      };

    case 'protect':
      pageCount = Math.floor(Math.random() * 10) + 1;
      const protectedPDF = createMockPDF([{ name: 'protected.pdf', size: fileBuffer.length, pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock protect completed: ${protectedPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: protectedPDF,
        pages: pageCount
      };

    case 'organize':
      pageCount = options.pageOrder ? options.pageOrder.length : Math.floor(Math.random() * 10) + 1;
      const organizedPDF = createMockPDF([{ name: 'organized.pdf', size: fileBuffer.length, pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock organize completed: ${organizedPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: organizedPDF,
        pages: pageCount
      };

    default:
      pageCount = Math.floor(Math.random() * 10) + 1;
      const defaultPDF = createMockPDF([{ name: `${operation}_result.pdf`, size: fileBuffer.length, pages: pageCount }], pageCount, operation, options);
      console.log(`✅ Mock ${operation} completed: ${defaultPDF.length} bytes, ${pageCount} pages`);
      return {
        buffer: defaultPDF,
        pages: pageCount
      };
  }
}

async function mockProcessMerge(
  fileUrls: string[],
  options: any
): Promise<{ buffer: Buffer; pages: number }> {
  console.log(`🔄 Mock merging ${fileUrls.length} files...`);

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

  // Read all files to get info
  let totalPages = 0;
  const fileInfos = [];

  for (const url of fileUrls) {
    try {
      const filePath = join(process.cwd(), 'public', url);
      const buffer = await readFile(filePath);
      const pages = Math.floor(Math.random() * 5) + 1; // Mock pages per file
      totalPages += pages;
      fileInfos.push({
        name: url.split('/').pop() || 'Unknown',
        size: buffer.length,
        pages: pages
      });
    } catch (error) {
      console.error(`Failed to read ${url}:`, error);
      // Add placeholder info
      totalPages += 1;
      fileInfos.push({
        name: url.split('/').pop() || 'Unknown',
        size: 1000,
        pages: 1
      });
    }
  }

  // Create a valid PDF buffer instead of concatenating
  const mockPDF = createMockPDF(fileInfos, totalPages);

  console.log(`✅ Mock merge completed: ${mockPDF.length} bytes, ${totalPages} total pages`);

  return {
    buffer: mockPDF,
    pages: totalPages
  };
}

// Create a minimal valid PDF for demonstration
function createMockPDF(fileInfos: any[], totalPages: number, operation: string = 'unknown', options: any = {}): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [${Array.from({ length: totalPages }, (_, i) => `${i + 3} 0 R`).join(' ')}]
/Count ${totalPages}
>>
endobj

${Array.from({ length: totalPages }, (_, i) => {
  const pageNum = i + 1;
  const fileInfo = fileInfos[Math.floor(i / 2)] || fileInfos[0]; // Distribute pages across files
  return `${i + 3} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents ${i + totalPages + 3} 0 R
/Resources <<
/Font <<
/F1 ${i + totalPages * 2 + 3} 0 R
>>
>>
>>
endobj`;
}).join('\n')}

${Array.from({ length: totalPages }, (_, i) => {
  const pageNum = i + 1;
  const fileInfo = fileInfos[Math.floor(i / 2)] || fileInfos[0];

  // Generate operation-specific content
  let contentLines = [];
  switch (operation) {
    case 'merge':
      contentLines = [
        `(Merged PDF - Page ${pageNum}) Tj`,
        `(Total Pages: ${totalPages}) Tj`,
        `(Files merged: ${fileInfos.length}) Tj`
      ];
      break;
    case 'compress':
      contentLines = [
        `(Compressed PDF - Page ${pageNum}) Tj`,
        `(Size reduced by ~30%) Tj`,
        `(Total Pages: ${totalPages}) Tj`
      ];
      break;
    case 'split':
      contentLines = [
        `(Split PDF - Part ${Math.ceil(pageNum / 3)}) Tj`,
        `(Page ${pageNum} of ${totalPages}) Tj`,
        `(Split operation completed) Tj`
      ];
      break;
    case 'rotate':
      const rotation = options.rotation || 90;
      contentLines = [
        `(Rotated PDF - Page ${pageNum}) Tj`,
        `(Rotation: ${rotation}°) Tj`,
        `(Total Pages: ${totalPages}) Tj`
      ];
      break;
    case 'protect':
      const password = options.password || 'demo_password';
      contentLines = [
        `(Protected PDF - Page ${pageNum}) Tj`,
        `(Password: ${password}) Tj`,
        `(*Note: Demo mode - password simulated) Tj`,
        `(Total Pages: ${totalPages}) Tj`
      ];
      break;
    case 'organize':
      const pageOrder = options.pageOrder || [];
      contentLines = [
        `(Organized PDF - Page ${pageNum}) Tj`,
        `(Page order: ${pageOrder.slice(0, 5).join(',')}...) Tj`,
        `(Total Pages: ${totalPages}) Tj`
      ];
      break;
    default:
      contentLines = [
        `(${operation.toUpperCase()} PDF - Page ${pageNum}) Tj`,
        `(Operation completed) Tj`,
        `(Total Pages: ${totalPages}) Tj`
      ];
  }

  return `${i + totalPages + 3} 0 obj
<<
/Length ${100 + Math.random() * 200}
>>
stream
BT
/F1 12 Tf
50 700 Td
${contentLines.join('\n0 -20 Td\n')}
ET
endstream
endobj`;
}).join('\n')}

${Array.from({ length: totalPages }, (_, i) => {
  return `${i + totalPages * 2 + 3} 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj`;
}).join('\n')}

xref
0 ${totalPages * 3 + 3}
0000000000 65535 f
${Array.from({ length: totalPages * 3 + 2 }, (_, i) => {
  const offset = 1000 + (i * 200); // Mock offsets
  return `${offset.toString().padStart(10, '0')} 00000 n`;
}).join('\n')}
trailer
<<
/Size ${totalPages * 3 + 3}
/Root 1 0 R
>>
startxref
${2000 + (totalPages * 400)}
%%EOF`;

  return Buffer.from(pdfContent, 'utf-8');
}

function getTaskConfig(operation: string, serverFilename: string, options: any) {
  const baseConfig = {
    files: [{ server_filename: serverFilename }]
  };

  switch (operation) {
    case 'split':
      return {
        ...baseConfig,
        tool: 'split'
      };

    case 'compress':
      return {
        ...baseConfig,
        tool: 'compress'
      };

    case 'rotate':
      return {
        ...baseConfig,
        tool: 'rotate'
      };

    case 'protect':
      return {
        ...baseConfig,
        tool: 'protect'
      };

    case 'organize':
      return {
        ...baseConfig,
        tool: 'organize'
      };

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

function getProcessConfig(operation: string, options: any) {
  const baseConfig: any = {};

  switch (operation) {
    case 'split':
      if (options.ranges) {
        baseConfig.ranges = options.ranges; // "1-3,5,7-9"
      }
      break;

    case 'rotate':
      if (options.rotation) {
        baseConfig.rotation = options.rotation; // 90, 180, 270
      }
      break;

    case 'protect':
      if (options.password) {
        baseConfig.password = options.password;
      }
      break;

    case 'organize':
      if (options.pageOrder && Array.isArray(options.pageOrder)) {
        baseConfig.pages = options.pageOrder.join(','); // "3,1,2,4"
      }
      break;
  }

  return baseConfig;
}
