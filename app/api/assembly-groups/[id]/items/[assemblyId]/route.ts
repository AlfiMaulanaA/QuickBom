import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; assemblyId: string } }
) {
  try {
    const { id: groupId, assemblyId } = params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Valid quantity (minimum 1) is required" },
        { status: 400 }
      );
    }

    // Update the quantity for the specific assembly item in the group
    const updatedItem = await prisma.assemblyGroupItem.updateMany({
      where: {
        assemblyGroupId: groupId,
        assemblyId: parseInt(assemblyId)
      },
      data: {
        quantity: quantity
      }
    });

    if (updatedItem.count === 0) {
      return NextResponse.json(
        { error: "Assembly item not found in group" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Quantity updated successfully",
      quantity: quantity
    });

  } catch (error: any) {
    console.error('API Error [PATCH /api/assembly-groups/[groupId]/items/[assemblyId]]:', error);
    return NextResponse.json(
      { error: "Failed to update quantity" },
      { status: 500 }
    );
  }
}
