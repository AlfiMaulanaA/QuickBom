import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/timeline/[timelineId]/milestones/[milestoneId] - Update individual milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { timelineId: string; milestoneId: string } }
) {
  try {
    const { timelineId, milestoneId } = params;
    const body = await request.json();

    const { name, description, dueDate, dependsOn, status, progress } = body;

    // Check if milestone exists and belongs to timeline
    const existingMilestone = await prisma.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        timelineId
      }
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Update milestone
    const updatedMilestone = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(dependsOn !== undefined && { dependsOn }),
        ...(status && { status }),
        ...(progress !== undefined && { progress })
      },
      include: {
        tasks: true
      }
    });

    return NextResponse.json({
      message: 'Milestone updated successfully',
      milestone: updatedMilestone
    });
  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/timeline/[timelineId]/milestones/[milestoneId] - Delete individual milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timelineId: string; milestoneId: string } }
) {
  try {
    const { timelineId, milestoneId } = params;

    // Check if milestone exists and belongs to timeline
    const existingMilestone = await prisma.projectMilestone.findFirst({
      where: {
        id: milestoneId,
        timelineId
      }
    });

    if (!existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Delete milestone (cascade will handle related tasks)
    await prisma.projectMilestone.delete({
      where: { id: milestoneId }
    });

    return NextResponse.json({
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
