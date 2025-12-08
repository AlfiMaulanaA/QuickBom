import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/timeline/[timelineId]/tasks/[taskId] - Update individual task
export async function PUT(
  request: NextRequest,
  { params }: { params: { timelineId: string; taskId: string } }
) {
  try {
    const { timelineId, taskId } = params;
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
        ...(estimatedCost !== undefined && { estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null })
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

// DELETE /api/timeline/[timelineId]/tasks/[taskId] - Delete individual task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timelineId: string; taskId: string } }
) {
  try {
    const { timelineId, taskId } = params;

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
