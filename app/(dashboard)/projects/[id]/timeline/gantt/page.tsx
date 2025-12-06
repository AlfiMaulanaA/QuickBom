"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/components/ui/sidebar";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Target,
  Settings,
  Download,
  RefreshCw,
  BarChart3,
  Clock,
  TrendingUp,
  Layers,
  Maximize2
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

interface GanttItem {
  id: string;
  name: string;
  type: 'task' | 'milestone';
  status: string;
  progress: number;
  // Union properties
  plannedStart?: string;
  plannedEnd?: string;
  dueDate?: string;
  taskType?: string;
  duration?: number;
  priority?: string;
  tasks?: Task[];
}

export default function GanttChartPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpen, setOpenMobile } = useSidebar();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2); // 0.5, 1, 1.5, 2 - Start with daily view
  const [viewStartDate, setViewStartDate] = useState<Date | null>(null);
  const [viewEndDate, setViewEndDate] = useState<Date | null>(null);

  useEffect(() => {
    // Close sidebar when opening Gantt chart for better UX (both mobile and desktop)
    setOpen(false);
    setOpenMobile(false);
    fetchProjectAndTimeline();
  }, [projectId, setOpen, setOpenMobile]);

  const fetchProjectAndTimeline = async () => {
    try {
      // Fetch project details
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData);
      }

      // Fetch timeline if exists
      const timelineRes = await fetch(`/api/projects/${projectId}/timeline`);
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        if (timelineData.exists) {
          setTimeline(timelineData.timeline);

          // Calculate view dates based on timeline
          const startDate = new Date(timelineData.timeline.startDate);
          const endDate = timelineData.timeline.endDate
            ? new Date(timelineData.timeline.endDate)
            : new Date(Math.max(...timelineData.timeline.tasks.map((t: Task) => new Date(t.plannedEnd).getTime())));

          // Add some buffer days
          const bufferStart = new Date(startDate);
          bufferStart.setDate(bufferStart.getDate() - 7);

          const bufferEnd = new Date(endDate);
          bufferEnd.setDate(bufferEnd.getDate() + 7);

          setViewStartDate(bufferStart);
          setViewEndDate(bufferEnd);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaskBarColor = (taskType: string) => {
    const baseColors = {
      CONSTRUCTION: '#3b82f6', // blue
      ELECTRICAL: '#eab308',   // yellow
      PLUMBING: '#06b6d4',     // cyan
      MECHANICAL: '#8b5cf6',   // violet
      DESIGN: '#10b981',       // emerald
      PERMIT: '#f59e0b',       // amber
      SUPERVISION: '#ef4444',  // red
      OTHER: '#6b7280'         // gray
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

  const calculateTaskPosition = (item: GanttItem) => {
    if (!viewStartDate || !viewEndDate || !item.plannedStart || !item.plannedEnd) return { left: 0, width: 0 };

    const taskStart = new Date(item.plannedStart);
    const taskEnd = new Date(item.plannedEnd);
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime();

    const left = ((taskStart.getTime() - viewStartDate.getTime()) / totalViewDuration) * 100;
    const duration = taskEnd.getTime() - taskStart.getTime();

    // Adjust width based on zoom level to prevent bars from being too wide in detailed views
    const zoomAdjustment = Math.max(0.3, 1 / zoomLevel); // Higher zoom level = narrower bars
    const width = Math.min(((duration / totalViewDuration) * 100 * zoomAdjustment), 95); // Cap at 95% max width

    return { left: Math.max(0, left), width: Math.max(2, width) }; // Minimum 2% width
  };

  const calculateMilestonePosition = (item: GanttItem) => {
    if (!viewStartDate || !viewEndDate || !item.dueDate) return 0;

    const milestoneDate = new Date(item.dueDate);
    const totalViewDuration = viewEndDate.getTime() - viewStartDate.getTime();

    return ((milestoneDate.getTime() - viewStartDate.getTime()) / totalViewDuration) * 100;
  };

  const generateTimeLabels = () => {
    if (!viewStartDate || !viewEndDate) return [];

    const labels = [];
    const current = new Date(viewStartDate);

    while (current <= viewEndDate) {
      labels.push({
        date: new Date(current),
        label: current.toLocaleDateString('id-ID', {
          month: zoomLevel >= 1 ? 'short' : 'long',
          day: 'numeric',
          ...(zoomLevel >= 1.5 && { year: '2-digit' })
        })
      });

      // Increment based on zoom level
      if (zoomLevel >= 2) {
        current.setDate(current.getDate() + 1);
      } else if (zoomLevel >= 1.5) {
        current.setDate(current.getDate() + 3);
      } else if (zoomLevel >= 1) {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }

    return labels;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(2, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev - 0.5));
  };

  const handleExport = () => {
    // Placeholder for export functionality
    toast({
      title: "Export Feature",
      description: "Gantt chart export coming soon",
    });
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

  const timeLabels = generateTimeLabels();
  const allItems: GanttItem[] = [
    ...timeline.tasks.map(task => ({
      id: task.id,
      name: task.name,
      type: 'task' as const,
      status: task.status,
      progress: task.progress,
      plannedStart: task.plannedStart,
      plannedEnd: task.plannedEnd,
      taskType: task.taskType,
      duration: task.duration,
      priority: task.priority
    })),
    ...timeline.milestones.map(milestone => ({
      id: milestone.id,
      name: milestone.name,
      type: 'milestone' as const,
      status: milestone.status,
      progress: milestone.progress,
      dueDate: milestone.dueDate,
      tasks: milestone.tasks
    }))
  ].sort((a, b) => {
    if (a.type === 'milestone' && b.type === 'task') return -1;
    if (a.type === 'task' && b.type === 'milestone') return 1;
    const aDate = a.type === 'task' ? a.plannedStart : a.dueDate;
    const bDate = b.type === 'task' ? b.plannedStart : b.dueDate;
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

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
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">Gantt Chart</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0"
              disabled={zoomLevel <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <div className="px-2 py-0.5 text-xs font-medium min-w-[3rem] text-center">
              {zoomLevel === 0.5 ? 'Month' :
               zoomLevel === 1 ? 'Week' :
               zoomLevel === 1.5 ? '3 Days' :
               zoomLevel === 2 ? 'Day' : `${zoomLevel}x`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0"
              disabled={zoomLevel >= 2}
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjectAndTimeline}
            className="h-8 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

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

      {/* Gantt Chart - Fixed Height with Scrollable Content */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-3">
            <Layers className="h-5 w-5" />
            Project Timeline Gantt Chart
          </CardTitle>
          <CardDescription>
            Interactive visualization of tasks, milestones, and project timeline
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {/* Fixed Time Header */}
          <div className="border-b mb-4">
            <div className="flex">
              <div className="w-80 p-4 border-r bg-muted/50">
                <h3 className="font-semibold text-sm">Task / Milestone</h3>
              </div>
              {/* Scrollable Time Header */}
              <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div style={{ minWidth: `${Math.max(1200, timeLabels.length * 80 * zoomLevel)}px` }} className="flex">
                  {timeLabels.map((label, index) => (
                    <div
                      key={index}
                      className="flex-1 text-center p-3 border-r text-xs font-medium bg-muted/30"
                      style={{ minWidth: `${80 * zoomLevel}px` }}
                    >
                      {label.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Chart Rows */}
          <div className="space-y-1">
            {allItems.map((item, index) => (
              <div key={item.id} className="flex border-b">
                {/* Task Info */}
                <div className="w-80 p-4 border-r bg-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center ${
                      item.type === 'milestone'
                        ? 'bg-purple-100 dark:bg-purple-900/50'
                        : 'bg-blue-100 dark:bg-blue-900/50'
                    }`}>
                      {item.type === 'milestone' ? (
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.type === 'milestone'
                          ? `Milestone • Due: ${item.dueDate ? formatDate(item.dueDate) : 'N/A'}`
                          : `${item.taskType || 'Task'} • ${item.duration || 0} days • ${item.progress}% complete`
                        }
                      </p>
                      {item.type === 'task' && item.priority && (
                        <Badge
                          variant="secondary"
                          className="text-xs mt-1"
                          style={{
                            backgroundColor: `${getPriorityColor(item.priority)}15`,
                            color: getPriorityColor(item.priority)
                          }}
                        >
                          {item.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Timeline Visualization */}
                <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                  <div style={{ minWidth: `${Math.max(1200, timeLabels.length * 80 * zoomLevel)}px` }} className="relative h-20 border-l">
                    {/* Background Grid */}
                    <div className="absolute inset-0 flex">
                      {timeLabels.map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-1 border-r border-muted/20"
                          style={{ minWidth: `${80 * zoomLevel}px` }}
                        />
                      ))}
                    </div>

                    {/* Task/Milestone Bars */}
                    {item.type === 'task' ? (
                      <div
                        className="absolute top-6 h-8 rounded cursor-pointer hover:shadow-lg transition-shadow border-2"
                        style={{
                          left: `${calculateTaskPosition(item).left}%`,
                          width: `${calculateTaskPosition(item).width}%`,
                          backgroundColor: getTaskBarColor(item.taskType || 'OTHER'),
                          borderColor: getTaskBarColor(item.taskType || 'OTHER'),
                          opacity: item.progress === 100 ? 1 : 0.85
                        }}
                        title={`${item.name} (${item.progress}% complete)`}
                      >
                        {/* Progress Fill */}
                        <div
                          className="h-full bg-white/40 rounded"
                          style={{ width: `${item.progress}%` }}
                        />
                        {/* Task Label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold drop-shadow truncate px-2">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Milestone Diamond */
                      <div
                        className="absolute top-8 transform -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform"
                        style={{ left: `${calculateMilestonePosition(item)}%` }}
                        title={`${item.name} - Milestone`}
                      >
                        <div
                          className="w-4 h-4 rotate-45 border-2"
                          style={{
                            backgroundColor: '#8b5cf6',
                            borderColor: '#7c3aed'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Chart Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm">Construction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm">Electrical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-green-500 rounded"></div>
                <span className="text-sm">Design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-purple-500 rounded"></div>
                <span className="text-sm">Mechanical</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
