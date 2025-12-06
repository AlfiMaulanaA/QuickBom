import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/timeline/[timelineId]/milestones - Get timeline milestones
export async function GET(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;

    const milestones = await prisma.projectMilestone.findMany({
      where: { timelineId },
      include: {
        tasks: {
          include: {
            dependencies: {
              include: {
                dependsOnTask: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/timeline/[timelineId]/milestones - Create new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const body = await request.json();

    const { name, description, dueDate, dependsOn } = body;

    if (!name || !dueDate) {
      return NextResponse.json(
        { error: 'Name and due date are required' },
        { status: 400 }
      );
    }

    // Check if timeline exists
    const timeline = await prisma.projectTimeline.findUnique({
      where: { id: timelineId }
    });

    if (!timeline) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      );
    }

    // Create milestone
    const milestone = await prisma.projectMilestone.create({
      data: {
        timelineId,
        name,
        description,
        dueDate: new Date(dueDate),
        dependsOn
      },
      include: {
        tasks: true
      }
    });

    return NextResponse.json({
      message: 'Milestone created successfully',
      milestone
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/timeline/[timelineId]/milestones/[milestoneId] - Update milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const url = new URL(request.url);
    const milestoneId = url.pathname.split('/').pop();

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

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
        ...(progress !== undefined && { progress }),
        updatedAt: new Date()
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

// DELETE /api/timeline/[timelineId]/milestones/[milestoneId] - Delete milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const url = new URL(request.url);
    const milestoneId = url.pathname.split('/').pop();

    if (!milestoneId) {
      return NextResponse.json(
        { error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

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
