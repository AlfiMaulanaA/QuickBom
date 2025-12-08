import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from 'jspdf';

interface PDFConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  documentTitle: string;
  requesterTitle: string;
  approverTitle: string;
  showProjectDescription: boolean;
  showClientInfo: boolean;
  showMaterialDetails: boolean;
  showSignatureSection: boolean;
  includeAssemblyBreakdown: boolean;
  customFooter: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Default configuration for backward compatibility
  const defaultConfig: PDFConfig = {
    companyName: "PT. QUICKBOM INDONESIA",
    companyAddress: "Jl. Raya Industri No. 123, Jakarta Pusat",
    companyPhone: "(021) 1234-5678",
    companyEmail: "procurement@quickbom.id",
    documentTitle: "SURAT SERAH TERIMA MATERIAL",
    requesterTitle: "Requester",
    approverTitle: "Approved By",
    showProjectDescription: true,
    showClientInfo: true,
    showMaterialDetails: true,
    showSignatureSection: true,
    includeAssemblyBreakdown: true,
    customFooter: "Dokumen ini dibuat secara otomatis oleh sistem QuickBom"
  };

  return generatePDF(params.id, defaultConfig);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const config: PDFConfig = await request.json();
    return generatePDF(params.id, config);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid configuration data" },
      { status: 400 }
    );
  }
}

async function generatePDF(projectId: string, config: PDFConfig) {
  try {
    const projectIdNum = parseInt(projectId);

    if (isNaN(projectIdNum)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Fetch project with all necessary relations
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum },
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

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (!project.template) {
      return NextResponse.json(
        { error: "Project has no template - cannot generate material handover letter" },
        { status: 400 }
      );
    }

    // Generate PDF content using jsPDF
    const pdfBuffer = await generateMaterialHandoverPDF(project, config);

    // Set response headers for PDF download
    const filename = `Surat_Serah_Terima_Material_${project.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}.pdf`;

    // Convert Buffer to Uint8Array for proper NextResponse handling
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Return PDF as NextResponse with proper headers
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfUint8Array.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error.message },
      { status: 500 }
    );
  }
}

async function generateMaterialHandoverPDF(project: any, config: PDFConfig): Promise<Buffer> {
  // Create jsPDF document
  const doc = new jsPDF('p', 'mm', 'a4');

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  let yPosition = 20;

  // Header - Company Letterhead
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(config.companyName, 105, yPosition, { align: 'center' });
  yPosition += 7;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Material Procurement & Project Management', 105, yPosition, { align: 'center' });
  yPosition += 7;

  doc.setFontSize(10);
  doc.text(config.companyAddress, 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`${config.companyPhone} | ${config.companyEmail}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Document Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(config.documentTitle, 105, yPosition, { align: 'center' });
  yPosition += 7;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Material Handover Letter', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Document Number and Date
  const docNumber = `SST-${project.id.toString().padStart(4, '0')}-${new Date().getFullYear()}`;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor: ${docNumber}`, 20, yPosition);
  doc.text(`Tanggal: ${formatDate(new Date())}`, 190, yPosition, { align: 'right' });
  yPosition += 15;

  // Recipient Information
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada Yth:', 20, yPosition);
  yPosition += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Kepala Gudang / Procurement Manager', 20, yPosition);
  yPosition += 7;

  if (project.client) {
    doc.text(project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson, 20, yPosition);
    yPosition += 7;
    if (project.client.contactEmail) {
      doc.text(`Email: ${project.client.contactEmail}`, 20, yPosition);
      yPosition += 7;
    }
  } else {
    doc.text('Client/Project Owner', 20, yPosition);
    yPosition += 7;
  }

  yPosition += 10;

  // Subject
  doc.setFont('helvetica', 'bold');
  doc.text('Perihal: Penyerahan Material untuk Project', 20, yPosition);
  yPosition += 15;

  // Opening Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const openingText = 'Dengan hormat,\n\nSehubungan dengan project yang sedang berjalan, bersama ini kami serahkan material-material yang diperlukan untuk pelaksanaan project tersebut. Berikut adalah rincian material yang diserahkan:';
  const splitOpening = doc.splitTextToSize(openingText, 170);
  doc.text(splitOpening, 20, yPosition);
  yPosition += splitOpening.length * 5 + 15;

  // Project Information - Display as regular text blocks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  // Project Name
  doc.text('Nama Project:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name, 60, yPosition);
  yPosition += 8;

  // Template
  doc.setFont('helvetica', 'bold');
  doc.text('Template:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(project.template.name, 60, yPosition);
  yPosition += 8;

  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const clientName = project.client ?
    (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson) : '-';
  doc.text(clientName, 60, yPosition);
  yPosition += 8;

  // Project Date
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Project:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  const projectDate = project.startDate ? formatDate(new Date(project.startDate)) : '-';
  doc.text(projectDate, 60, yPosition);
  yPosition += 15;

  // Materials Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DAFTAR MATERIAL YANG DISERAHKAN', 20, yPosition);
  yPosition += 10;

  // Create consolidated materials
  const materialMap = new Map();

  project.template.assemblies.forEach((templateAssembly: any) => {
    const assembly = templateAssembly.assembly;
    const assemblyQuantity = Number(templateAssembly.quantity);

    assembly.materials.forEach((assemblyMaterial: any) => {
      const material = assemblyMaterial.material;
      const materialKey = `${material.name}_${material.partNumber || ''}_${material.manufacturer || ''}`;

      const materialQuantityPerAssembly = Number(assemblyMaterial.quantity);
      const materialQuantity = materialQuantityPerAssembly * assemblyQuantity;

      if (materialMap.has(materialKey)) {
        const existing = materialMap.get(materialKey);
        existing.totalQuantity += materialQuantity;
        existing.totalCost += materialQuantity * Number(material.price);
      } else {
        materialMap.set(materialKey, {
          name: material.name,
          partNumber: material.partNumber,
          manufacturer: material.manufacturer,
          unit: material.unit,
          unitPrice: material.price,
          totalQuantity: materialQuantity,
          totalCost: materialQuantity * Number(material.price)
        });
      }
    });
  });

  // Materials Table - Manual drawing (simplified without price columns)
  const materialsColWidths = [20, 60, 40, 30, 30]; // Adjusted widths for remaining columns
  const materialsRowHeight = 10;

  // Table headers (plain text without background)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let xPos = 20;
  const headers = ['No', 'Nama Item', 'Part Number', 'Qty', 'Unit'];

  headers.forEach((header, index) => {
    doc.text(header, xPos + 2, yPosition + 7);
    doc.rect(xPos, yPosition, materialsColWidths[index], materialsRowHeight);
    xPos += materialsColWidths[index];
  });

  yPosition += materialsRowHeight;

  // Table data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  Array.from(materialMap.values()).forEach((material: any, index: number) => {
    // Check if we need a new page
    if (yPosition + materialsRowHeight > 270) { // Near bottom of A4 page
      doc.addPage();
      yPosition = 20;

      // Redraw headers on new page (plain text without background)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      xPos = 20;
      headers.forEach((header, headerIndex) => {
        doc.text(header, xPos + 2, yPosition + 7);
        doc.rect(xPos, yPosition, materialsColWidths[headerIndex], materialsRowHeight);
        xPos += materialsColWidths[headerIndex];
      });
      yPosition += materialsRowHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }

    xPos = 20;
    const rowData = [
      (index + 1).toString(),
      material.name.length > 15 ? material.name.substring(0, 15) + '...' : material.name,
      (material.partNumber || '-').length > 10 ? (material.partNumber || '-').substring(0, 10) + '...' : (material.partNumber || '-'),
      material.totalQuantity.toString(),
      material.unit
    ];

    rowData.forEach((data, dataIndex) => {
      doc.text(data, xPos + 2, yPosition + 7);
      doc.rect(xPos, yPosition, materialsColWidths[dataIndex], materialsRowHeight);
      xPos += materialsColWidths[dataIndex];
    });

    yPosition += materialsRowHeight;
  });

  yPosition += 10;

  // Summary (only total count, no price information)
  const totalMaterials = materialMap.size;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Jenis Material: ${totalMaterials}`, 20, yPosition);
  yPosition += 15;

  // Closing paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const closingText = 'Material-material tersebut telah diperiksa dan dinyatakan lengkap sesuai dengan spesifikasi yang dibutuhkan untuk project ini. Mohon untuk segera diproses dan digunakan sesuai dengan jadwal project.\n\nDemikian surat serah terima material ini dibuat untuk dapat dipergunakan sebagaimana mestinya.';
  const splitClosing = doc.splitTextToSize(closingText, 170);
  doc.text(splitClosing, 20, yPosition);
  yPosition += splitClosing.length * 5 + 30; // More space before signatures

  // Signature section with more spacing
  const pageWidth = doc.internal.pageSize.width;
  const signatureWidth = (pageWidth - 40) / 2; // 40 is total margin

  // Requester signature (left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(config.requesterTitle, 20 + signatureWidth / 2, yPosition, { align: 'center' });
  yPosition += 15; // More space

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('(____________________)', 20 + signatureWidth / 2, yPosition, { align: 'center' });
  yPosition += 12; // More space
  doc.text('Nama: ____________________', 20, yPosition);
  yPosition += 8; // More space
  doc.text('Jabatan: ____________________', 20, yPosition);
  yPosition += 8; // More space
  doc.text(`Tanggal: ${formatDate(new Date())}`, 20, yPosition);

  // Approval signature (right)
  const rightX = 20 + signatureWidth;
  let rightY = yPosition - 43; // Go back up for right signature with more space

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(config.approverTitle, rightX + signatureWidth / 2, rightY, { align: 'center' });
  rightY += 15; // More space

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('(____________________)', rightX + signatureWidth / 2, rightY, { align: 'center' });
  rightY += 12; // More space
  doc.text('Nama: ____________________', rightX, rightY);
  rightY += 8; // More space
  doc.text('Jabatan: ____________________', rightX, rightY);
  rightY += 8; // More space
  doc.text(`Tanggal: ${formatDate(new Date())}`, rightX, rightY);

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(config.customFooter, 105, pageHeight - 20, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 105, pageHeight - 10, { align: 'center' });

  // Return PDF as buffer
  return Buffer.from(doc.output('arraybuffer'));
}
