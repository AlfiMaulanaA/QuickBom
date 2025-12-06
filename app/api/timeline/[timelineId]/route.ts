import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/timeline/[timelineId] - Get timeline details
export async function GET(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;

    const timeline = await prisma.projectTimeline.findUnique({
      where: { id: timelineId },
      include: {
        project: {
          include: {
            template: true
          }
        },
        milestones: {
          include: {
            tasks: true
          },
          orderBy: { dueDate: 'asc' }
        },
        tasks: {
          include: {
            milestone: true,
            dependencies: {
              include: {
                dependsOnTask: true
              }
            }
          },
          orderBy: { plannedStart: 'asc' }
        }
      }
    });

    if (!timeline) {
      return NextResponse.json(
        { error: 'Timeline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/timeline/[timelineId] - Update timeline
export async function PUT(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const body = await request.json();

    const { startDate, endDate, workingDays, holidays, progress, status } = body;

    const updatedTimeline = await prisma.projectTimeline.update({
      where: { id: timelineId },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(workingDays && { workingDays }),
        ...(holidays && { holidays }),
        ...(progress !== undefined && { progress }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        project: true
      }
    });

    return NextResponse.json(updatedTimeline);
  } catch (error) {
    console.error('Error updating timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/timeline/[timelineId] - Delete timeline
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;

    // Delete timeline (cascade will handle related records)
    await prisma.projectTimeline.delete({
      where: { id: timelineId }
    });

    return NextResponse.json({ message: 'Timeline deleted successfully' });
  } catch (error) {
    console.error('Error deleting timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
