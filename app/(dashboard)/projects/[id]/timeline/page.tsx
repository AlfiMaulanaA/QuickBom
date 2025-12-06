"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Plus,
  Settings,
  BarChart3,
  GanttChart,
  Target,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Users,
  Wrench,
  Package,
  Edit, 
  Trash2,
  MoreHorizontal
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  clientName: string | null;
  totalPrice: number;
  fromTemplateId: number | null;
  template: any;
  createdAt: string;
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
  description: string | null;
  dueDate: string;
  status: string;
  progress: number;
  tasks: Task[];
  dependsOn?: string | null;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
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

export default function ProjectTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMilestoneDialogOpen, setCreateMilestoneDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [editTaskDialogOpen, setEditTaskDialogOpen] = useState(false);
  const [editMilestoneDialogOpen, setEditMilestoneDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Form states for creating timeline
  const [timelineForm, setTimelineForm] = useState({
    startDate: "",
    endDate: "",
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });

  // Form states for creating milestone
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    description: "",
    dueDate: "",
    dependsOn: ""
  });

  // Form states for creating task
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
    taskType: "CONSTRUCTION",
    plannedStart: "",
    plannedEnd: "",
    duration: "",
    milestoneId: "",
    priority: "MEDIUM",
    estimatedCost: ""
  });

  useEffect(() => {
    fetchProjectAndTimeline();
  }, [projectId]);

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

  const handleCreateTimeline = async () => {
    if (!timelineForm.startDate) {
      toast({
        title: "Validation Error",
        description: "Start date is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timelineForm),
      });

      if (response.ok) {
        const result = await response.json();
        setTimeline(result.timeline);
        setCreateDialogOpen(false);
        toast({
          title: "Success",
          description: "Timeline created successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create timeline",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating timeline:', error);
      toast({
        title: "Error",
        description: "Failed to create timeline",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PLANNING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateMilestone = async () => {
    if (!milestoneForm.name || !milestoneForm.dueDate) {
      toast({
        title: "Validation Error",
        description: "Name and due date are required",
        variant: "destructive",
      });
      return;
    }

    if (!timeline) {
      toast({
        title: "Error",
        description: "Timeline not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline.id}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneForm),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh timeline data
        await fetchProjectAndTimeline();
        setCreateMilestoneDialogOpen(false);
        setMilestoneForm({ name: "", description: "", dueDate: "", dependsOn: "" });
        toast({
          title: "Success",
          description: "Milestone created successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create milestone",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to create milestone",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!taskForm.name || !taskForm.plannedStart || !taskForm.duration) {
      toast({
        title: "Validation Error",
        description: "Name, start date, and duration are required",
        variant: "destructive",
      });
      return;
    }

    if (!timeline) {
      toast({
        title: "Error",
        description: "Timeline not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh timeline data
        await fetchProjectAndTimeline();
        setCreateTaskDialogOpen(false);
        setTaskForm({
          name: "",
          description: "",
          taskType: "CONSTRUCTION",
          plannedStart: "",
          plannedEnd: "",
          duration: "",
          milestoneId: "",
          priority: "MEDIUM",
          estimatedCost: ""
        });
        toast({
          title: "Success",
          description: "Task created successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      description: task.description || "",
      taskType: task.taskType,
      plannedStart: task.plannedStart.split('T')[0], // Extract date part
      plannedEnd: task.plannedEnd.split('T')[0], // Extract date part
      duration: task.duration.toString(),
      milestoneId: task.milestone?.id || "",
      priority: task.priority,
      estimatedCost: ""
    });
    setEditTaskDialogOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.name || !taskForm.plannedStart || !taskForm.duration) {
      toast({
        title: "Validation Error",
        description: "Name, start date, and duration are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline?.id}/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskForm),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh timeline data
        await fetchProjectAndTimeline();
        setEditTaskDialogOpen(false);
        setEditingTask(null);
        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline?.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh timeline data
        await fetchProjectAndTimeline();
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      name: milestone.name,
      description: milestone.description || "",
      dueDate: milestone.dueDate.split('T')[0], // Extract date part
      dependsOn: milestone.dependsOn || ""
    });
    setEditMilestoneDialogOpen(true);
  };

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !milestoneForm.name || !milestoneForm.dueDate) {
      toast({
        title: "Validation Error",
        description: "Name and due date are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline?.id}/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(milestoneForm),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh timeline data
        await fetchProjectAndTimeline();
        setEditMilestoneDialogOpen(false);
        setEditingMilestone(null);
        toast({
          title: "Success",
          description: "Milestone updated successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update milestone",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to update milestone",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all associated tasks.')) {
      return;
    }

    try {
      const response = await fetch(`/api/timeline/${timeline?.id}/milestones/${milestoneId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh timeline data
        await fetchProjectAndTimeline();
        toast({
          title: "Success",
          description: "Milestone deleted successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete milestone",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Error",
        description: "Failed to delete milestone",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
          <p className="text-gray-600 mt-2">The requested project could not be found.</p>
          <Button
            onClick={() => router.push('/projects')}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              Timeline Management
            </p>
          </div>
        </div>

        {!timeline && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Timeline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project Timeline</DialogTitle>
                <DialogDescription>
                  Set up the timeline for project planning and execution.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={timelineForm.startDate}
                    onChange={(e) => setTimelineForm({ ...timelineForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={timelineForm.endDate}
                    onChange={(e) => setTimelineForm({ ...timelineForm, endDate: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTimeline}>
                    Create Timeline
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{project.name}</div>
              <div className="text-sm text-muted-foreground">Project Name</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(project.totalPrice)}
              </div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {project.clientName || "No Client"}
              </div>
              <div className="text-sm text-muted-foreground">Client</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Status */}
      {timeline ? (
        <div className="space-y-6">
          {/* Timeline Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GanttChart className="h-5 w-5" />
                Timeline Overview
              </CardTitle>
              <CardDescription>
                Current project timeline status and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDate(timeline.startDate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Start Date</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {timeline.endDate ? formatDate(timeline.endDate) : "Not Set"}
                  </div>
                  <div className="text-sm text-muted-foreground">End Date</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {timeline.progress}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                  <Progress value={timeline.progress} className="mt-2" />
                </div>
                <div className="text-center">
                  <Badge className={`text-sm ${getStatusColor(timeline.status)}`}>
                    {timeline.status.replace('_', ' ')}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Milestones Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Milestones ({timeline.milestones.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeline.milestones.slice(0, 3).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{milestone.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Due: {formatDate(milestone.dueDate)}
                            </div>
                          </div>
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      {timeline.milestones.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No milestones created yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Tasks ({timeline.tasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeline.tasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{task.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.taskType.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {timeline.tasks.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No tasks created yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gantt" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GanttChart className="h-5 w-5" />
                      Gantt Chart
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/projects/${projectId}/timeline/gantt`)}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Full Screen View
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Interactive project timeline visualization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <GanttChart className="mx-auto h-12 w-12 mb-4" />
                    <p className="mb-2">Interactive Gantt Chart</p>
                    <p className="text-sm mb-4">View and manage your project timeline visually</p>
                    <Button
                      onClick={() => router.push(`/projects/${projectId}/timeline/gantt`)}
                      className="mt-2"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Open Full Gantt Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Tasks</span>
                    <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Task</DialogTitle>
                          <DialogDescription>
                            Add a new task to the project timeline.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="task-name">Task Name *</Label>
                            <Input
                              id="task-name"
                              value={taskForm.name}
                              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                              placeholder="e.g., Install electrical wiring"
                            />
                          </div>
                          <div>
                            <Label htmlFor="task-description">Description</Label>
                            <Input
                              id="task-description"
                              value={taskForm.description}
                              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                              placeholder="Brief description of the task"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="task-type">Task Type</Label>
                              <Select value={taskForm.taskType} onValueChange={(value) => setTaskForm({ ...taskForm, taskType: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select task type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                                  <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                                  <SelectItem value="PLUMBING">Plumbing</SelectItem>
                                  <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                                  <SelectItem value="DESIGN">Design</SelectItem>
                                  <SelectItem value="PERMIT">Permit</SelectItem>
                                  <SelectItem value="SUPERVISION">Supervision</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="task-priority">Priority</Label>
                              <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
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
                              <Label htmlFor="task-start">Planned Start *</Label>
                              <Input
                                id="task-start"
                                type="date"
                                value={taskForm.plannedStart}
                                onChange={(e) => setTaskForm({ ...taskForm, plannedStart: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="task-duration">Duration (days) *</Label>
                              <Input
                                id="task-duration"
                                type="number"
                                value={taskForm.duration}
                                onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })}
                                placeholder="e.g., 5"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="task-milestone">Associated Milestone (Optional)</Label>
                            <Select value={taskForm.milestoneId || "none"} onValueChange={(value) => setTaskForm({ ...taskForm, milestoneId: value === "none" ? "" : value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select milestone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No milestone</SelectItem>
                                {timeline?.milestones.map((milestone) => (
                                  <SelectItem key={milestone.id} value={milestone.id}>
                                    {milestone.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="task-cost">Estimated Cost (Optional)</Label>
                            <Input
                              id="task-cost"
                              type="number"
                              value={taskForm.estimatedCost}
                              onChange={(e) => setTaskForm({ ...taskForm, estimatedCost: e.target.value })}
                              placeholder="e.g., 5000000"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setCreateTaskDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCreateTask}>
                              Create Task
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Task Dialog */}
                    <Dialog open={editTaskDialogOpen} onOpenChange={setEditTaskDialogOpen}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                          <DialogDescription>
                            Update task information and settings.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-task-name">Task Name *</Label>
                            <Input
                              id="edit-task-name"
                              value={taskForm.name}
                              onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                              placeholder="e.g., Install electrical wiring"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-task-description">Description</Label>
                            <Input
                              id="edit-task-description"
                              value={taskForm.description}
                              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                              placeholder="Brief description of the task"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-task-type">Task Type</Label>
                              <Select value={taskForm.taskType} onValueChange={(value) => setTaskForm({ ...taskForm, taskType: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select task type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CONSTRUCTION">Construction</SelectItem>
                                  <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                                  <SelectItem value="PLUMBING">Plumbing</SelectItem>
                                  <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                                  <SelectItem value="DESIGN">Design</SelectItem>
                                  <SelectItem value="PERMIT">Permit</SelectItem>
                                  <SelectItem value="SUPERVISION">Supervision</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-task-priority">Priority</Label>
                              <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
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
                              <Label htmlFor="edit-task-start">Planned Start *</Label>
                              <Input
                                id="edit-task-start"
                                type="date"
                                value={taskForm.plannedStart}
                                onChange={(e) => setTaskForm({ ...taskForm, plannedStart: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-task-duration">Duration (days) *</Label>
                              <Input
                                id="edit-task-duration"
                                type="number"
                                value={taskForm.duration}
                                onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })}
                                placeholder="e.g., 5"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="edit-task-milestone">Associated Milestone (Optional)</Label>
                            <Select value={taskForm.milestoneId || "none"} onValueChange={(value) => setTaskForm({ ...taskForm, milestoneId: value === "none" ? "" : value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select milestone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No milestone</SelectItem>
                                {timeline?.milestones.map((milestone) => (
                                  <SelectItem key={milestone.id} value={milestone.id}>
                                    {milestone.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-task-cost">Estimated Cost (Optional)</Label>
                            <Input
                              id="edit-task-cost"
                              type="number"
                              value={taskForm.estimatedCost}
                              onChange={(e) => setTaskForm({ ...taskForm, estimatedCost: e.target.value })}
                              placeholder="e.g., 5000000"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditTaskDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateTask}>
                              Update Task
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Milestone Dialog */}
                    <Dialog open={editMilestoneDialogOpen} onOpenChange={setEditMilestoneDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Milestone</DialogTitle>
                          <DialogDescription>
                            Update milestone information and settings.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-milestone-name">Milestone Name *</Label>
                            <Input
                              id="edit-milestone-name"
                              value={milestoneForm.name}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                              placeholder="e.g., Foundation Complete"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-milestone-description">Description</Label>
                            <Input
                              id="edit-milestone-description"
                              value={milestoneForm.description}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                              placeholder="Brief description of the milestone"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-milestone-dueDate">Due Date *</Label>
                            <Input
                              id="edit-milestone-dueDate"
                              type="date"
                              value={milestoneForm.dueDate}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-milestone-dependsOn">Depends On (Optional)</Label>
                            <Select value={milestoneForm.dependsOn || "none"} onValueChange={(value) => setMilestoneForm({ ...milestoneForm, dependsOn: value === "none" ? "" : value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dependency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No dependency</SelectItem>
                                {timeline?.milestones.filter(m => m.id !== editingMilestone?.id).map((milestone) => (
                                  <SelectItem key={milestone.id} value={milestone.id}>
                                    {milestone.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditMilestoneDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateMilestone}>
                              Update Milestone
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline.tasks.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">No tasks created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeline.tasks.map((task) => (
                        <div key={task.id} className="border rounded-md p-3 bg-card hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.taskType.replace('_', ' ')}
                                </Badge>
                                <span className="font-medium text-sm">{task.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(task.plannedStart)} - {formatDate(task.plannedEnd)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Progress value={task.progress} className="w-12 h-1.5" />
                                <span className="text-xs w-8 text-right">{task.progress}%</span>
                              </div>
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0)}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTask(task)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Milestones</span>
                    <Dialog open={createMilestoneDialogOpen} onOpenChange={setCreateMilestoneDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Milestone
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Milestone</DialogTitle>
                          <DialogDescription>
                            Add a key milestone to track project progress.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="milestone-name">Milestone Name *</Label>
                            <Input
                              id="milestone-name"
                              value={milestoneForm.name}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                              placeholder="e.g., Foundation Complete"
                            />
                          </div>
                          <div>
                            <Label htmlFor="milestone-description">Description</Label>
                            <Input
                              id="milestone-description"
                              value={milestoneForm.description}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                              placeholder="Brief description of the milestone"
                            />
                          </div>
                          <div>
                            <Label htmlFor="milestone-dueDate">Due Date *</Label>
                            <Input
                              id="milestone-dueDate"
                              type="date"
                              value={milestoneForm.dueDate}
                              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="milestone-dependsOn">Depends On (Optional)</Label>
                            <Select value={milestoneForm.dependsOn} onValueChange={(value) => setMilestoneForm({ ...milestoneForm, dependsOn: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select dependency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No dependency</SelectItem>
                                {timeline?.milestones.map((milestone) => (
                                  <SelectItem key={milestone.id} value={milestone.id}>
                                    {milestone.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setCreateMilestoneDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleCreateMilestone}>
                              Create Milestone
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline.milestones.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Target className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">No milestones created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {timeline.milestones.map((milestone) => (
                        <div key={milestone.id} className="border rounded-md p-3 bg-card hover:bg-muted/20 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <Target className="h-4 w-4 text-purple-600" />
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{milestone.name}</span>
                                <div className="text-xs text-muted-foreground">
                                  Due: {formatDate(milestone.dueDate)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground">
                                {milestone.tasks.length} tasks
                              </div>
                              <div className="flex items-center gap-1">
                                <Progress value={milestone.progress} className="w-12 h-1.5" />
                                <span className="text-xs w-8 text-right">{milestone.progress}%</span>
                              </div>
                              <Badge className={`text-xs ${getStatusColor(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMilestone(milestone)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* No Timeline State */
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Timeline Created</h3>
            <p className="text-muted-foreground mb-6">
              Create a timeline to start planning and tracking your project progress.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project Timeline
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
