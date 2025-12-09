import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients - Get all clients with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: any = {};

    if (type && type !== "all") {
      where.clientType = type;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const clientsData = await prisma.client.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            status: true,
            totalPrice: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data to include calculated fields
    const transformedClients = clientsData.map((client: any) => {
      // Calculate total contract value from all projects
      const totalContractValue = client.projects.reduce((sum: number, project: any) => {
        return sum + (Number(project.totalPrice) || 0);
      }, 0);

      // Calculate outstanding balance (simplified - could be more complex)
      const outstandingBalance = client.projects
        .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
        .reduce((sum: number, project: any) => {
          return sum + (Number(project.totalPrice) || 0);
        }, 0);

      return {
        ...client,
        totalProjects: client.projects.length,
        activeProjects: client.projects.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'APPROVED').length,
        completedProjects: client.projects.filter((p: any) => p.status === 'COMPLETED').length,
        totalContractValue,
        outstandingBalance,
      };
    });

    // Ensure we return an array even if database is empty
    if (!transformedClients) {
      return NextResponse.json([]);
    }

    return NextResponse.json(transformedClients);
  } catch (error: any) {
    console.error('API Error [GET /api/clients]:', error);

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
        error: "Failed to fetch clients",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientType,
      category,
      status,
      companyName,
      companyType,
      businessLicense,
      taxId,
      contactPerson,
      contactTitle,
      contactEmail,
      contactPhone,
      contactPhone2,
      address,
      city,
      province,
      postalCode,
      country,
      industry,
      companySize,
      annualRevenue,
      creditLimit,
      paymentTerms,
      website,
      specialNotes,
    } = body;

    // Validate required fields
    if (!contactPerson || !contactEmail || !contactPhone || !address || !city || !province) {
      return NextResponse.json(
        { error: "Contact person, email, phone, address, city, and province are required" },
        { status: 400 }
      );
    }

    // Check if contact email is already taken
    const existingClient = await prisma.client.findFirst({
      where: { contactEmail },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Contact email already exists" },
        { status: 400 }
      );
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        clientType: clientType || "INDIVIDUAL",
        category: category || "RESIDENTIAL",
        status: status || "ACTIVE",
        companyName,
        companyType,
        businessLicense,
        taxId,
        contactPerson,
        contactTitle,
        contactEmail,
        contactPhone,
        contactPhone2,
        address,
        city,
        province,
        postalCode,
        country: country || "Indonesia",
        industry,
        companySize,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms,
        website,
        specialNotes,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalContractValue: 0,
        outstandingBalance: 0,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
