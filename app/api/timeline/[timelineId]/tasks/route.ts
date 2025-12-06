import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/timeline/[timelineId]/tasks - Get timeline tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;

    const tasks = await prisma.projectTask.findMany({
      where: { timelineId },
      include: {
        milestone: true,
        dependencies: {
          include: {
            dependsOnTask: true
          }
        },
        dependents: {
          include: {
            task: true
          }
        }
      },
      orderBy: { plannedStart: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/timeline/[timelineId]/tasks - Create new task
export async function POST(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const body = await request.json();

    const {
      name,
      description,
      taskType,
      plannedStart,
      plannedEnd,
      duration,
      milestoneId,
      priority,
      assignedUsers,
      resources,
      estimatedCost
    } = body;

    // Handle milestoneId - convert empty strings to null
    const processedMilestoneId = milestoneId && milestoneId.trim() !== "" ? milestoneId : null;

    if (!name || !plannedStart || !duration) {
      return NextResponse.json(
        { error: 'Name, start date, and duration are required' },
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

    // Calculate actual end date if duration provided
    const startDate = new Date(plannedStart);
    const endDate = plannedEnd ? new Date(plannedEnd) : new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    // Create task
    const task = await prisma.projectTask.create({
      data: {
        timelineId,
        milestoneId: processedMilestoneId,
        name,
        description,
        taskType: taskType || 'CONSTRUCTION',
        plannedStart: startDate,
        plannedEnd: endDate,
        duration: parseInt(duration.toString(), 10),
        priority: priority || 'MEDIUM',
        assignedUsers,
        resources,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null
      },
      include: {
        milestone: true,
        dependencies: {
          include: {
            dependsOnTask: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Task created successfully',
      task
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/timeline/[timelineId]/tasks/[taskId] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const url = new URL(request.url);
    const taskId = url.pathname.split('/').pop();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      taskType,
      plannedStart,
      plannedEnd,
      duration,
      milestoneId,
      priority,
      progress,
      status,
      assignedUsers,
      resources,
      estimatedCost
    } = body;

    // Handle milestoneId - convert empty strings to null
    const processedMilestoneId = milestoneId && milestoneId.trim() !== "" ? milestoneId : null;

    // Check if task exists and belongs to timeline
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        timelineId
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Calculate actual end date if dates changed
    let endDate = existingTask.plannedEnd;
    if (plannedStart && duration) {
      const startDate = new Date(plannedStart);
      endDate = plannedEnd ? new Date(plannedEnd) : new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    }

    // Update task
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(taskType && { taskType }),
        ...(plannedStart && { plannedStart: new Date(plannedStart) }),
        ...(endDate && { plannedEnd: endDate }),
        ...(duration !== undefined && { duration: parseInt(duration.toString(), 10) }),
        ...(milestoneId !== undefined && { milestoneId: processedMilestoneId }),
        ...(priority && { priority }),
        ...(progress !== undefined && { progress }),
        ...(status && { status }),
        ...(assignedUsers && { assignedUsers }),
        ...(resources && { resources }),
        ...(estimatedCost !== undefined && { estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null }),
        updatedAt: new Date()
      },
      include: {
        milestone: true,
        dependencies: {
          include: {
            dependsOnTask: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/timeline/[timelineId]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timelineId: string } }
) {
  try {
    const timelineId = params.timelineId;
    const url = new URL(request.url);
    const taskId = url.pathname.split('/').pop();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Check if task exists and belongs to timeline
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        timelineId
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete task
    await prisma.projectTask.delete({
      where: { id: taskId }
    });

    return NextResponse.json({
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
