"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/components/ui/sidebar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Target,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingUp,
  Layers,
  Maximize2,
  Plus,
  Wrench,
  Zap,
  Droplets,
  Cog,
  Palette,
  FileText,
  Users,
  CircleDot,
  Hammer,
  Eye
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  clientName: string | null;
}

interface Timeline {
  id: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  progress: number;
  status: string;
  milestones: Milestone[];
  tasks: Task[];
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  progress: number;
  tasks: Task[];
}

interface Task {
  id: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  progress: number;
  status: string;
  priority: string;
  taskType: string;
  duration: number;
  milestone?: {
    id: string;
    name: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'milestone';
  status: string;
  progress: number;
  taskType?: string;
  priority?: string;
  duration?: number;
}

type ViewType = 'month' | 'week' | 'day';

export default function ProjectCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpen, setOpenMobile } = useSidebar();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addEventType, setAddEventType] = useState<'task' | 'milestone'>('task');
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '',
    endDate: '',
    taskType: 'CONSTRUCTION',
    priority: 'MEDIUM',
    duration: 1
  });

  // Task editing states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editEventData, setEditEventData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    taskType: 'CONSTRUCTION',
    priority: 'MEDIUM',
    progress: 0,
    status: 'NOT_STARTED'
  });

  // Progress update states
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  // Delete confirmation states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // User assignment states
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningEvent, setAssigningEvent] = useState<CalendarEvent | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    setOpen(false);
    setOpenMobile(false);
    fetchProjectAndTimeline();
  }, [projectId, setOpen, setOpenMobile]);

  const fetchProjectAndTimeline = async () => {
    try {
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData);
      }

      const timelineRes = await fetch(`/api/projects/${projectId}/timeline`);
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        if (timelineData.exists) {
          setTimeline(timelineData.timeline);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project timeline",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTaskBarColor = (taskType: string) => {
    const baseColors = {
      CONSTRUCTION: '#3b82f6',
      ELECTRICAL: '#eab308',
      PLUMBING: '#06b6d4',
      MECHANICAL: '#8b5cf6',
      DESIGN: '#10b981',
      PERMIT: '#f59e0b',
      SUPERVISION: '#ef4444',
      OTHER: '#6b7280'
    };
    return baseColors[taskType as keyof typeof baseColors] || baseColors.OTHER;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      case 'LOW': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#10b981';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'ON_HOLD': return '#f59e0b';
      case 'PLANNING': return '#8b5cf6';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'CONSTRUCTION': return <Hammer className="h-4 w-4" />;
      case 'ELECTRICAL': return <Zap className="h-4 w-4" />;
      case 'PLUMBING': return <Droplets className="h-4 w-4" />;
      case 'MECHANICAL': return <Cog className="h-4 w-4" />;
      case 'DESIGN': return <Palette className="h-4 w-4" />;
      case 'PERMIT': return <FileText className="h-4 w-4" />;
      case 'SUPERVISION': return <Users className="h-4 w-4" />;
      default: return <CircleDot className="h-4 w-4" />;
    }
  };

  const getMilestoneIcon = () => <Target className="h-4 w-4" />;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCalendarEvents = (): CalendarEvent[] => {
    if (!timeline) return [];

    const events: CalendarEvent[] = [];

    // Add tasks
    timeline.tasks.forEach(task => {
      events.push({
        id: task.id,
        title: task.name,
        start: new Date(task.plannedStart),
        end: new Date(task.plannedEnd),
        type: 'task',
        status: task.status,
        progress: task.progress,
        taskType: task.taskType,
        priority: task.priority,
        duration: task.duration
      });
    });

    // Add milestones
    timeline.milestones.forEach(milestone => {
      events.push({
        id: milestone.id,
        title: milestone.name,
        start: new Date(milestone.dueDate),
        end: new Date(milestone.dueDate),
        type: 'milestone',
        status: milestone.status,
        progress: milestone.progress
      });
    });

    return events;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek));
      startOfWeek.setDate(startOfWeek.getDate() + 1);
    }

    return days;
  };

  const getDayEvents = (date: Date) => {
    const events = getCalendarEvents();
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart <= date && eventEnd >= date;
    });
  };

  const handleAddEvent = async () => {
    if (!timeline || !newEvent.title || !newEvent.startDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (addEventType === 'task') {
        // Calculate duration from dates
        const startDate = new Date(newEvent.startDate);
        const endDate = new Date(newEvent.endDate || newEvent.startDate);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const response = await fetch(`/api/timeline/${timeline.id}/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newEvent.title,
            taskType: newEvent.taskType,
            plannedStart: newEvent.startDate,
            plannedEnd: newEvent.endDate,
            duration: duration,
            priority: newEvent.priority,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create task');
        }

        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        // Add milestone
        const response = await fetch(`/api/timeline/${timeline.id}/milestones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newEvent.title,
            dueDate: newEvent.startDate,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create milestone');
        }

        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
      }

      // Reset form and close dialog
      setShowAddDialog(false);
      setNewEvent({
        title: '',
        startDate: '',
        endDate: '',
        taskType: 'CONSTRUCTION',
        priority: 'MEDIUM',
        duration: 1
      });

      // Refresh timeline data
      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add event",
        variant: "destructive",
      });
    }
  };

  // Task Editing Functions
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditEventData({
      title: event.title,
      startDate: event.start.toISOString().split('T')[0],
      endDate: event.end.toISOString().split('T')[0],
      taskType: event.taskType || 'CONSTRUCTION',
      priority: event.priority || 'MEDIUM',
      progress: event.progress,
      status: event.status
    });
    setShowEditDialog(true);
  };

  const handleUpdateEvent = async () => {
    if (!timeline || !editingEvent) return;

    try {
      if (editingEvent.type === 'task') {
        const response = await fetch(`/api/timeline/${timeline.id}/tasks/${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editEventData.title,
            taskType: editEventData.taskType,
            plannedStart: editEventData.startDate,
            plannedEnd: editEventData.endDate,
            priority: editEventData.priority,
            progress: editEventData.progress,
            status: editEventData.status,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update task');
        }

        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        const response = await fetch(`/api/timeline/${timeline.id}/milestones/${editingEvent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editEventData.title,
            dueDate: editEventData.startDate,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update milestone');
        }

        const result = await response.json();
        toast({
          title: "Success",
          description: result.message,
        });
      }

      setShowEditDialog(false);
      setEditingEvent(null);
      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive",
      });
    }
  };

  // Task Deletion Functions
  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setShowDeleteDialog(true);
  };

  const confirmDeleteEvent = async () => {
    if (!timeline || !eventToDelete) return;

    try {
      if (eventToDelete.type === 'task') {
        const response = await fetch(`/api/timeline/${timeline.id}/tasks/${eventToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete task');
        }

        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        const response = await fetch(`/api/timeline/${timeline.id}/milestones/${eventToDelete.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete milestone');
        }

        toast({
          title: "Success",
          description: "Milestone deleted successfully",
        });
      }

      setShowDeleteDialog(false);
      setEventToDelete(null);
      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  // Progress Update Functions
  const handleProgressUpdate = async (taskId: string, newProgress: number) => {
    if (!timeline) return;

    try {
      const response = await fetch(`/api/timeline/${timeline.id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress: newProgress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update progress');
      }

      toast({
        title: "Success",
        description: "Task progress updated",
      });

      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update progress",
        variant: "destructive",
      });
    }
  };

  // User Assignment Functions
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssignUsers = async () => {
    if (!timeline || !assigningEvent) return;

    try {
      const response = await fetch(`/api/timeline/${timeline.id}/tasks/${assigningEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedUsers: selectedUsers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign users');
      }

      toast({
        title: "Success",
        description: "Users assigned successfully",
      });

      setShowAssignDialog(false);
      setAssigningEvent(null);
      setSelectedUsers([]);
      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error assigning users:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign users",
        variant: "destructive",
      });
    }
  };

  // Initialize available users
  useEffect(() => {
    if (!loading) {
      fetchAvailableUsers();
    }
  }, [loading]);

  // Drag and Drop Functions
  const handleDragStart = (event: DragStartEvent) => {
    // Optional: Add visual feedback when dragging starts
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) return;

    const draggedEventId = active.id as string;
    const dropTargetId = over.id as string;

    // Find the dragged event
    const draggedEvent = getCalendarEvents().find(e => e.id === draggedEventId);
    if (!draggedEvent) return;

    // Parse the drop target (should be a date string like "2025-12-08")
    const targetDate = new Date(dropTargetId);

    if (isNaN(targetDate.getTime())) return;

    try {
      if (draggedEvent.type === 'task') {
        // Calculate new dates for task
        const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime();
        const newStartDate = targetDate;
        const newEndDate = new Date(targetDate.getTime() + duration);

        const response = await fetch(`/api/timeline/${timeline!.id}/tasks/${draggedEventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plannedStart: newStartDate.toISOString().split('T')[0],
            plannedEnd: newEndDate.toISOString().split('T')[0],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reschedule task');
        }

        toast({
          title: "Success",
          description: "Task rescheduled successfully",
        });

      } else {
        // Reschedule milestone
        const response = await fetch(`/api/timeline/${timeline!.id}/milestones/${draggedEventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dueDate: targetDate.toISOString().split('T')[0],
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to reschedule milestone');
        }

        toast({
          title: "Success",
          description: "Milestone rescheduled successfully",
        });
      }

      // Refresh timeline data
      await fetchProjectAndTimeline();

    } catch (error) {
      console.error('Error rescheduling event:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule event",
        variant: "destructive",
      });
    }
  };

  const DraggableEvent = ({ event }: { event: CalendarEvent }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={{
            backgroundColor: event.type === 'task' ? `${getTaskBarColor(event.taskType || 'OTHER')}20` : undefined,
            color: event.type === 'task' ? getTaskBarColor(event.taskType || 'OTHER') : undefined,
            ...style,
          }}
          {...listeners}
          {...attributes}
          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
            event.type === 'milestone' ? 'bg-purple-100 text-purple-800' : ''
          } ${isDragging ? 'shadow-lg' : ''}`}
          onClick={(e) => {
            if (!isDragging) {
              setSelectedEvent(event);
            }
          }}
          title={event.title}
        >
          <div className="flex items-center gap-1 truncate">
            {event.type === 'milestone' ? (
              <Target className="h-3 w-3 flex-shrink-0" />
            ) : (
              <div className="h-3 w-3 flex-shrink-0 flex items-center justify-center">
                {event.taskType === 'CONSTRUCTION' && <Hammer className="h-3 w-3" />}
                {event.taskType === 'ELECTRICAL' && <Zap className="h-3 w-3" />}
                {event.taskType === 'PLUMBING' && <Droplets className="h-3 w-3" />}
                {event.taskType === 'MECHANICAL' && <Cog className="h-3 w-3" />}
                {event.taskType === 'DESIGN' && <Palette className="h-3 w-3" />}
                {event.taskType === 'PERMIT' && <FileText className="h-3 w-3" />}
                {event.taskType === 'SUPERVISION' && <Users className="h-3 w-3" />}
                {(!event.taskType || event.taskType === 'OTHER') && <CircleDot className="h-3 w-3" />}
              </div>
            )}
            <span className="font-medium truncate">{event.title}</span>
            {event.type === 'task' && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 ml-auto"
                style={{
                  backgroundColor: getPriorityColor(event.priority || 'MEDIUM')
                }}
                title={`Priority: ${event.priority}`}
              />
            )}
          </div>
          {event.type === 'task' && (
            <Progress value={event.progress} className="h-1 mt-1" />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setSelectedEvent(event)}>
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleEditEvent(event)}>
          <Plus className="h-4 w-4 mr-2" />
          Edit {event.type === 'task' ? 'Task' : 'Milestone'}
        </ContextMenuItem>
        {event.type === 'task' && (
          <ContextMenuItem onClick={() => {
            setAssigningEvent(event);
            setSelectedUsers([]);
            setShowAssignDialog(true);
          }}>
            <Users className="h-4 w-4 mr-2" />
            Assign Users
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => handleDeleteEvent(event)}
          className="text-destructive focus:text-destructive"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Delete {event.type === 'task' ? 'Task' : 'Milestone'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

const DroppableDay = ({ day, children, isCurrentMonth, isToday }: { 
  day: Date; 
  children: React.ReactNode; 
  isCurrentMonth: boolean; 
  isToday: boolean; 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString().split('T')[0], // Use date string as ID
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 border border-border/50 ${
        isCurrentMonth ? 'bg-background' : 'bg-muted/20'
      } ${isToday ? 'ring-2 ring-primary' : ''} ${isOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
    >
      <div className="text-sm font-medium mb-1">
        {day.getDate()}
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

const renderMonthView = () => {
  const days = getMonthDays();
  const events = getCalendarEvents();

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Header */}
      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="p-2 text-center font-semibold text-sm bg-muted/50 text-foreground">
            {day}
          </div>
      ))}

      {/* Days */}
      {days.map((day, index) => {
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.start);
          const eventEnd = new Date(event.end);
          return eventStart <= day && eventEnd >= day;
        });

        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <DroppableDay key={index} day={day} isCurrentMonth={isCurrentMonth} isToday={isToday}>
            {dayEvents.slice(0, 3).map(event => (
              <DraggableEvent key={event.id} event={event} />
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} more
              </div>
            )}
          </DroppableDay>
        );
      })}
    </div>
  );
};

  const renderWeekView = () => {
    const days = getWeekDays();
    const events = getCalendarEvents();

    return (
      <div className="space-y-2">
        {days.map(day => {
          const dayEvents = events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return eventStart <= day && eventEnd >= day;
          });

          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-primary' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {formatDateShort(day)}
                  {isToday && <Badge className="ml-2">Today</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <ContextMenu key={event.id}>
                      <ContextMenuTrigger>
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 truncate">
                              {event.type === 'milestone' ? (
                                getMilestoneIcon()
                              ) : (
                                getTaskIcon(event.taskType || 'OTHER')
                              )}
                              <span className="font-medium truncate">{event.title}</span>
                              {event.type === 'task' && (
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0 ml-auto"
                                  style={{
                                    backgroundColor: getPriorityColor(event.priority || 'MEDIUM')
                                  }}
                                  title={`Priority: ${event.priority}`}
                                />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {event.type === 'milestone' ? 'Milestone' : `${event.taskType} • ${event.progress}%`}
                            </div>
                          </div>
                          {event.type === 'task' && (
                            <Progress value={event.progress} className="w-16 h-2" />
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => setSelectedEvent(event)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleEditEvent(event)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Edit {event.type === 'task' ? 'Task' : 'Milestone'}
                        </ContextMenuItem>
                        {event.type === 'task' && (
                          <ContextMenuItem onClick={() => {
                            setAssigningEvent(event);
                            setSelectedUsers([]);
                            setShowAssignDialog(true);
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Users
                          </ContextMenuItem>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => handleDeleteEvent(event)}
                          className="text-destructive focus:text-destructive"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Delete {event.type === 'task' ? 'Task' : 'Milestone'}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No events scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const events = getDayEvents(currentDate);

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {formatDate(currentDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map(event => (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger>
                    <div
                      className="flex items-start gap-4 p-4 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {event.type === 'milestone' ? (
                              getMilestoneIcon()
                            ) : (
                              getTaskIcon(event.taskType || 'OTHER')
                            )}
                            <h3 className="font-semibold">{event.title}</h3>
                            {event.type === 'task' && (
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0 ml-auto"
                                style={{
                                  backgroundColor: getPriorityColor(event.priority || 'MEDIUM')
                                }}
                                title={`Priority: ${event.priority}`}
                              />
                            )}
                          </div>
                          <Badge variant="secondary">
                            {event.type === 'milestone' ? 'Milestone' : 'Task'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <span className="font-medium">Start:</span> {formatDate(event.start)}
                          </div>
                          <div>
                            <span className="font-medium">End:</span> {formatDate(event.end)}
                          </div>
                          {event.type === 'task' && (
                            <>
                              <div>
                                <span className="font-medium">Type:</span> {event.taskType}
                              </div>
                              <div>
                                <span className="font-medium">Priority:</span>
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-xs"
                                  style={{
                                    borderColor: getPriorityColor(event.priority || ''),
                                    color: getPriorityColor(event.priority || '')
                                  }}
                                >
                                  {event.priority}
                                </Badge>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge
                              style={{
                                backgroundColor: `${getStatusColor(event.status)}20`,
                                color: getStatusColor(event.status)
                              }}
                            >
                              {event.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          {event.type === 'task' && (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm font-medium">Progress:</span>
                              <Progress value={event.progress} className="flex-1 h-2" />
                              <span className="text-sm text-muted-foreground w-8">
                                {event.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => setSelectedEvent(event)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleEditEvent(event)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Edit {event.type === 'task' ? 'Task' : 'Milestone'}
                    </ContextMenuItem>
                    {event.type === 'task' && (
                      <ContextMenuItem onClick={() => {
                        setAssigningEvent(event);
                        setSelectedUsers([]);
                        setShowAssignDialog(true);
                      }}>
                        <Users className="h-4 w-4 mr-2" />
                        Assign Users
                      </ContextMenuItem>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => handleDeleteEvent(event)}
                      className="text-destructive focus:text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete {event.type === 'task' ? 'Task' : 'Milestone'}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this day</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project || !timeline) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Timeline Not Found</h1>
          <p className="text-gray-600 mt-2">
            {!project ? "Project not found" : "No timeline created for this project"}
          </p>
          <Button
            onClick={() => router.push(`/projects/${projectId}/timeline`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Timeline
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/timeline`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Timeline
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">Project Calendar</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Type Toggle */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
            {(['month', 'week', 'day'] as ViewType[]).map(type => (
              <Button
                key={type}
                variant={viewType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType(type)}
                className="h-7 px-3 text-xs capitalize"
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3"
            >
              Today
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjectAndTimeline}
            className="h-8 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          {/* Add Event Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setAddEventType('task');
                setShowAddDialog(true);
              }}
              className="h-8 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAddEventType('milestone');
                setShowAddDialog(true);
              }}
              className="h-8 flex items-center gap-1.5"
            >
              <Target className="h-3.5 w-3.5" />
              Add Milestone
            </Button>
          </div>
        </div>
      </div>

      {/* Current Period Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {viewType === 'month' && currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          {viewType === 'week' && `Week of ${formatDateShort(getWeekDays()[0])} - ${formatDateShort(getWeekDays()[6])}`}
          {viewType === 'day' && formatDate(currentDate)}
        </h2>
      </div>

      {/* Calendar Views */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="min-h-[600px]">
          {viewType === 'month' && renderMonthView()}
          {viewType === 'week' && renderWeekView()}
          {viewType === 'day' && renderDayView()}
        </div>
      </DndContext>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{timeline.tasks.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Milestones</p>
                <p className="text-2xl font-bold">{timeline.milestones.length}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{timeline.progress}%</p>
                <Progress value={timeline.progress} className="mt-2" />
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant="secondary" className="mt-1">
                  {timeline.status.replace('_', ' ')}
                </Badge>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-600">
                  {timeline.tasks.filter(t => t.status === 'COMPLETED').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-blue-600">
                  {timeline.tasks.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-600">
                  {timeline.tasks.filter(t => t.status === 'ON_HOLD').length +
                   timeline.tasks.filter(t => t.status === 'PLANNING').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {selectedEvent?.type === 'task' ? getTaskIcon(selectedEvent.taskType || 'OTHER') : getMilestoneIcon()}
              </div>
              <div>
                <div className="text-lg font-semibold">{selectedEvent?.title}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {selectedEvent?.type === 'milestone' ? 'Milestone' : 'Task'}
                  {selectedEvent?.type === 'task' && (
                    <>
                      <span>•</span>
                      <span>{selectedEvent.taskType}</span>
                    </>
                  )}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this {selectedEvent?.type}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="text-sm font-medium">{formatDate(selectedEvent.start)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">End Date</label>
                  <p className="text-sm font-medium">{formatDate(selectedEvent.end)}</p>
                </div>
              </div>

              {/* Task-specific information */}
              {selectedEvent.type === 'task' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Task Type</label>
                      <p className="text-sm font-medium">{selectedEvent.taskType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: getPriorityColor(selectedEvent.priority || ''),
                          color: getPriorityColor(selectedEvent.priority || '')
                        }}
                      >
                        {selectedEvent.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="text-sm font-medium">{selectedEvent.duration} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Progress</label>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedEvent.progress} className="flex-1 h-2" />
                        <span className="text-sm font-medium w-8">{selectedEvent.progress}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge
                    style={{
                      backgroundColor: `${getStatusColor(selectedEvent.status)}20`,
                      color: getStatusColor(selectedEvent.status)
                    }}
                  >
                    {selectedEvent.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Task Type Icon Legend */}
              {selectedEvent.type === 'task' && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Task Type Legend</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Hammer className="h-3 w-3 text-blue-600" />
                      <span>Construction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-yellow-600" />
                      <span>Electrical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-3 w-3 text-cyan-600" />
                      <span>Plumbing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Cog className="h-3 w-3 text-purple-600" />
                      <span>Mechanical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette className="h-3 w-3 text-green-600" />
                      <span>Design</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-amber-600" />
                      <span>Permit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-red-600" />
                      <span>Supervision</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDot className="h-3 w-3 text-gray-600" />
                      <span>Other</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestone Information */}
              {selectedEvent.type === 'milestone' && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <Target className="h-4 w-4 inline mr-1" />
                    Milestones represent important project checkpoints and deadlines.
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {addEventType === 'task' ? <Plus className="h-5 w-5" /> : <Target className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Add {addEventType === 'task' ? 'Task' : 'Milestone'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Create a new {addEventType} for this project timeline
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder={`Enter ${addEventType} title`}
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>

              {addEventType === 'task' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taskType">Task Type</Label>
                      <Select value={newEvent.taskType} onValueChange={(value) => setNewEvent({...newEvent, taskType: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select task type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSTRUCTION">
                            <div className="flex items-center gap-2">
                              <Hammer className="h-4 w-4 text-blue-600" />
                              Construction
                            </div>
                          </SelectItem>
                          <SelectItem value="ELECTRICAL">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-600" />
                              Electrical
                            </div>
                          </SelectItem>
                          <SelectItem value="PLUMBING">
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-cyan-600" />
                              Plumbing
                            </div>
                          </SelectItem>
                          <SelectItem value="MECHANICAL">
                            <div className="flex items-center gap-2">
                              <Cog className="h-4 w-4 text-purple-600" />
                              Mechanical
                            </div>
                          </SelectItem>
                          <SelectItem value="DESIGN">
                            <div className="flex items-center gap-2">
                              <Palette className="h-4 w-4 text-green-600" />
                              Design
                            </div>
                          </SelectItem>
                          <SelectItem value="PERMIT">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-amber-600" />
                              Permit
                            </div>
                          </SelectItem>
                          <SelectItem value="SUPERVISION">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-red-600" />
                              Supervision
                            </div>
                          </SelectItem>
                          <SelectItem value="OTHER">
                            <div className="flex items-center gap-2">
                              <CircleDot className="h-4 w-4 text-gray-600" />
                              Other
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newEvent.priority} onValueChange={(value) => setNewEvent({...newEvent, priority: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value, endDate: e.target.value})}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.startDate || (addEventType === 'task' && !newEvent.endDate)}
              >
                Add {addEventType === 'task' ? 'Task' : 'Milestone'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {editingEvent?.type === 'task' ? <Plus className="h-5 w-5" /> : <Target className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-lg font-semibold">
                  Edit {editingEvent?.type === 'task' ? 'Task' : 'Milestone'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Update {editingEvent?.type} details
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editEventData.title}
                onChange={(e) => setEditEventData({...editEventData, title: e.target.value})}
              />
            </div>

            {editingEvent?.type === 'task' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-taskType">Task Type</Label>
                    <Select value={editEventData.taskType} onValueChange={(value) => setEditEventData({...editEventData, taskType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSTRUCTION">
                          <div className="flex items-center gap-2">
                            <Hammer className="h-4 w-4 text-blue-600" />
                            Construction
                          </div>
                        </SelectItem>
                        <SelectItem value="ELECTRICAL">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-600" />
                            Electrical
                          </div>
                        </SelectItem>
                        <SelectItem value="PLUMBING">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-cyan-600" />
                            Plumbing
                          </div>
                        </SelectItem>
                        <SelectItem value="MECHANICAL">
                          <div className="flex items-center gap-2">
                            <Cog className="h-4 w-4 text-purple-600" />
                            Mechanical
                          </div>
                        </SelectItem>
                        <SelectItem value="DESIGN">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-green-600" />
                            Design
                          </div>
                        </SelectItem>
                        <SelectItem value="PERMIT">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-amber-600" />
                            Permit
                          </div>
                        </SelectItem>
                        <SelectItem value="SUPERVISION">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-red-600" />
                            Supervision
                          </div>
                        </SelectItem>
                        <SelectItem value="OTHER">
                          <div className="flex items-center gap-2">
                            <CircleDot className="h-4 w-4 text-gray-600" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <Select value={editEventData.priority} onValueChange={(value) => setEditEventData({...editEventData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input
                      id="edit-startDate"
                      type="date"
                      value={editEventData.startDate}
                      onChange={(e) => setEditEventData({...editEventData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input
                      id="edit-endDate"
                      type="date"
                      value={editEventData.endDate}
                      onChange={(e) => setEditEventData({...editEventData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Progress: {editEventData.progress}%</Label>
                  <Slider
                    value={[editEventData.progress]}
                    onValueChange={(value) => setEditEventData({...editEventData, progress: value[0]})}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {editingEvent?.type === 'milestone' && (
              <div>
                <Label htmlFor="edit-dueDate">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={editEventData.startDate}
                  onChange={(e) => setEditEventData({...editEventData, startDate: e.target.value, endDate: e.target.value})}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>
              Update {editingEvent?.type === 'task' ? 'Task' : 'Milestone'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {eventToDelete?.type === 'task' ? 'Task' : 'Milestone'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Users to Task</DialogTitle>
            <DialogDescription>
              Select team members to assign to this task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Task: {assigningEvent?.title}</Label>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                    selectedUsers.includes(user.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedUsers(prev =>
                      prev.includes(user.id)
                        ? prev.filter(id => id !== user.id)
                        : [...prev, user.id]
                    );
                  }}
                >
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center">
                    {selectedUsers.includes(user.id) && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignUsers}>
              Assign Users
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
