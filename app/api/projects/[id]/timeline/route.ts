import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/timeline - Get project timeline
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get timeline if exists
    const timeline = await prisma.projectTimeline.findUnique({
      where: { projectId },
      include: {
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
      return NextResponse.json({
        exists: false,
        message: 'No timeline found for this project'
      });
    }

    return NextResponse.json({
      exists: true,
      timeline
    });
  } catch (error) {
    console.error('Error fetching project timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/timeline - Create new timeline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const body = await request.json();

    const { startDate, endDate, workingDays, holidays } = body;

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if timeline already exists
    const existingTimeline = await prisma.projectTimeline.findUnique({
      where: { projectId }
    });

    if (existingTimeline) {
      return NextResponse.json(
        { error: 'Timeline already exists for this project' },
        { status: 409 }
      );
    }

    // Calculate duration if endDate provided
    const duration = endDate ?
      Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) :
      null;

    // Create timeline
    const timeline = await prisma.projectTimeline.create({
      data: {
        projectId,
        startDate: new Date(startDate),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(duration && { duration }),
        workingDays: workingDays || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        holidays: holidays || []
      },
      include: {
        project: true
      }
    });

    return NextResponse.json({
      message: 'Timeline created successfully',
      timeline: {
        ...timeline,
        milestones: [],
        tasks: []
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/timeline - Update project timeline
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);
    const body = await request.json();

    const { startDate, endDate, workingDays, holidays, progress, status } = body;

    // Check if timeline exists
    const existingTimeline = await prisma.projectTimeline.findUnique({
      where: { projectId }
    });

    if (!existingTimeline) {
      return NextResponse.json(
        { error: 'Timeline not found for this project' },
        { status: 404 }
      );
    }

    // Calculate duration if dates changed
    let duration = existingTimeline.duration;
    if (startDate && endDate) {
      duration = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    } else if (startDate && existingTimeline.endDate) {
      duration = Math.ceil((existingTimeline.endDate.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    } else if (endDate && existingTimeline.startDate) {
      duration = Math.ceil((new Date(endDate).getTime() - existingTimeline.startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const updatedTimeline = await prisma.projectTimeline.update({
      where: { projectId },
      data: {
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(duration !== undefined && { duration }),
        ...(workingDays && { workingDays }),
        ...(holidays && { holidays }),
        ...(progress !== undefined && { progress }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        project: true,
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

    return NextResponse.json({
      message: 'Timeline updated successfully',
      timeline: {
        ...updatedTimeline,
        milestones: updatedTimeline.milestones || [],
        tasks: updatedTimeline.tasks || []
      }
    });
  } catch (error) {
    console.error('Error updating timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/timeline - Delete project timeline
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = parseInt(params.id);

    // Check if timeline exists
    const timeline = await prisma.projectTimeline.findUnique({
      where: { projectId }
    });

    if (!timeline) {
      return NextResponse.json(
        { error: 'Timeline not found for this project' },
        { status: 404 }
      );
    }

    // Delete timeline (cascade will handle related records)
    await prisma.projectTimeline.delete({
      where: { projectId }
    });

    return NextResponse.json({
      message: 'Project timeline deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project timeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
