import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assemblies = await prisma.assembly.findMany({
      include: {
        materials: {
          include: {
            material: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(assemblies);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assemblies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, materials } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const assembly = await prisma.assembly.create({
      data: {
        name,
        description,
        materials: materials ? {
          create: materials.map((m: any) => ({
            materialId: m.materialId,
            quantity: m.quantity
          }))
        } : undefined
      },
      include: {
        materials: {
          include: {
            material: true
          }
        }
      }
    });

    return NextResponse.json(assembly, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Assembly with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create assembly" },
      { status: 500 }
    );
  }
}
