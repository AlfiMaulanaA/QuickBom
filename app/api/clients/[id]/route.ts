import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientData = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            totalPrice: true,
          },
        },
      },
    });

    if (!clientData) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Calculate project statistics
    const totalProjects = clientData.projects.length;
    const activeProjects = clientData.projects.filter((p: any) =>
      p.status === 'IN_PROGRESS' || p.status === 'APPROVED'
    ).length;
    const completedProjects = clientData.projects.filter((p: any) =>
      p.status === 'COMPLETED'
    ).length;
    const totalContractValue = clientData.projects.reduce((sum: number, p: any) => sum + p.totalPrice, 0);

    const transformedClient = {
      ...clientData,
      totalProjects,
      activeProjects,
      completedProjects,
      totalContractValue,
    };

    return NextResponse.json(transformedClient);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if contact email is already taken by another client
    if (contactEmail && contactEmail !== existingClient.contactEmail) {
      const emailExists = await prisma.client.findFirst({
        where: { contactEmail },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Contact email already taken by another client" },
          { status: 400 }
        );
      }
    }

    // Update client
    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
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
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : null,
        creditLimit: creditLimit ? parseFloat(creditLimit) : null,
        paymentTerms,
        website,
        specialNotes,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if client has any projects
    const clientProjects = await prisma.project.count({
      where: { clientId: params.id },
    });

    if (clientProjects > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete client with existing projects. Please reassign or delete related projects first."
        },
        { status: 400 }
      );
    }

    // Delete client
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
