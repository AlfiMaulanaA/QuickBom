"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, FolderOpen, DollarSign, Calculator, Search, Download, ArrowUpDown, Copy, MoreHorizontal, Eye, Calendar, MapPin, Building2, Target, AlertTriangle, Users, Clock, Package, BarChart3, FileText, Lightbulb, Info, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Template {
  id: number;
  name: string;
  description: string | null;
  assemblies: any[];
  docs: any[] | null;
}

interface Client {
  id: string;
  companyName: string | null;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  clientType: string;
}

interface DocumentFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  clientId: string | null;
  client: Client | null;
  projectType: string | null;
  location: string | null;
  area: number | null;
  budget: number | null;
  totalPrice: number;
  startDate: Date | null;
  endDate: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: string;
  progress: number;
  priority: string;
  schematicDocs: string | null;
  qualityCheckDocs: string | null;
  fromTemplateId: number | null;
  template: Template | null;
  createdBy: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
  };
  assignedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    projectType: "",
    location: "",
    area: "",
    budget: "",
    startDate: "",
    endDate: "",
    actualStart: "",
    actualEnd: "",
    status: "PLANNING",
    progress: "0",
    priority: "MEDIUM",
    fromTemplateId: "",
    assignedUsers: [] as string[]
  });

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTemplates();
    fetchClients();
  }, []);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        clientId: formData.clientId || null,
        projectType: formData.projectType || null,
        location: formData.location || null,
        area: formData.area ? Number(formData.area) : null,
        budget: formData.budget ? Number(formData.budget) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        actualStart: formData.actualStart || null,
        actualEnd: formData.actualEnd || null,
        status: formData.status || "PLANNING",
        progress: formData.progress ? Number(formData.progress) : 0,
        priority: formData.priority || "MEDIUM",
        assignedUsers: formData.assignedUsers || []
      };

      if (formData.fromTemplateId && formData.fromTemplateId !== "none") {
        payload.fromTemplateId = parseInt(formData.fromTemplateId);

        // If editing an existing project and template changed, copy template docs
        if (editingProject && editingProject.fromTemplateId !== parseInt(formData.fromTemplateId)) {
          const selectedTemplate = templates.find(t => t.id.toString() === formData.fromTemplateId);
          if (selectedTemplate?.docs && Array.isArray(selectedTemplate.docs) && selectedTemplate.docs.length > 0) {
            // Copy template docs to schematicDocs
            payload.schematicDocs = selectedTemplate.docs;
          }
        } else if (!editingProject) {
          // For new projects, copy template docs
          const selectedTemplate = templates.find(t => t.id.toString() === formData.fromTemplateId);
          if (selectedTemplate?.docs && Array.isArray(selectedTemplate.docs) && selectedTemplate.docs.length > 0) {
            // Copy template docs to schematicDocs
            payload.schematicDocs = selectedTemplate.docs;
          }
        }
      }

      // Set default quality check document for new projects
      if (!editingProject) {
        payload.qualityCheckDocs = "/docs/Checksheet Form.docx";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Project ${editingProject ? "updated" : "created"} successfully`,
        });
        fetchProjects();
        setIsCreateDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingProject(null);
        setFormData({
          name: "",
          description: "",
          clientId: "",
          projectType: "",
          location: "",
          area: "",
          budget: "",
          startDate: "",
          endDate: "",
          actualStart: "",
          actualEnd: "",
          status: "PLANNING",
          progress: "0",
          priority: "MEDIUM",
          fromTemplateId: "",
          assignedUsers: []
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      clientId: project.clientId || "",
      projectType: project.projectType || "",
      location: project.location || "",
      area: project.area?.toString() || "",
      budget: project.budget?.toString() || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      actualStart: project.actualStart ? new Date(project.actualStart).toISOString().split('T')[0] : "",
      actualEnd: project.actualEnd ? new Date(project.actualEnd).toISOString().split('T')[0] : "",
      status: project.status || "PLANNING",
      progress: project.progress?.toString() || "0",
      priority: project.priority || "MEDIUM",
      fromTemplateId: project.fromTemplateId?.toString() || "",
      assignedUsers: project.assignedUsers || []
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });
        fetchProjects();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const isNewItem = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    return diffDays <= 3;
  };

  // Filter and sort projects
  const processedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const clientName = project.client ?
        (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson) : '';
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (clientName && clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (project.template?.name && project.template.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTemplate = templateFilter === "all" ||
                             (templateFilter === "none" && !project.template) ||
                             (project.fromTemplateId?.toString() === templateFilter);
      return matchesSearch && matchesTemplate;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [projects, searchTerm, templateFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(processedProjects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, id]);
    } else {
      setSelectedProjects(prev => prev.filter(projectId => projectId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProjects.length} projects?`)) return;

    try {
      const deletePromises = selectedProjects.map(id =>
        fetch(`/api/projects/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;

      toast({
        title: "Bulk Delete Completed",
        description: `Successfully deleted ${successCount} out of ${selectedProjects.length} projects`,
      });

      fetchProjects();
      setSelectedProjects([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete projects",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: "name" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };



  const handleDuplicate = (project: Project) => {
    setFormData({
      name: `${project.name} (Copy)`,
      description: project.description || "",
      clientId: project.clientId || "",
      projectType: project.projectType || "",
      location: project.location || "",
      area: project.area?.toString() || "",
      budget: project.budget?.toString() || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
      actualStart: project.actualStart ? new Date(project.actualStart).toISOString().split('T')[0] : "",
      actualEnd: project.actualEnd ? new Date(project.actualEnd).toISOString().split('T')[0] : "",
      status: project.status || "PLANNING",
      progress: project.progress?.toString() || "0",
      priority: project.priority || "MEDIUM",
      fromTemplateId: project.fromTemplateId?.toString() || "",
      assignedUsers: project.assignedUsers || []
    });
    setIsCreateDialogOpen(true);
  };

  const handleFileUpload = async (file: File, projectId: string | number, docType: "schematic" | "qualityCheck") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId.toString());
    formData.append("docType", docType);

    try {
      const response = await fetch("/api/projects/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "File uploaded successfully",
          description: `${docType === "schematic" ? "Schematic" : "Quality check"} document uploaded`,
        });
        fetchProjects(); // Refresh the projects list
        return result;
      } else {
        const error = await response.json();
        toast({
          title: "Upload failed",
          description: error.error || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Network error occurred during upload",
        variant: "destructive",
      });
    }
  };

  // Calculate cost for an assembly
  const calculateAssemblyCost = (assembly: any) => {
    return assembly.materials.reduce((total: number, am: any) => {
      return total + (Number(am.material.price) * Number(am.quantity));
    }, 0);
  };

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDocumentDetailsOpen, setIsDocumentDetailsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    projectId: number;
    projectName: string;
    docType: "schematic" | "qualityCheck";
    fileUrl: string;
    fileName?: string;
    uploadDate?: string;
  } | null>(null);

  const exportConsolidatedMaterialsForAllProjects = () => {
    const projectsWithTemplates = processedProjects.filter(project => project.template);

    if (projectsWithTemplates.length === 0) {
      toast({
        title: "No templates found",
        description: "No projects with templates to export materials for.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Exporting Consolidated Materials for All Projects');
    console.log('Projects to process:', projectsWithTemplates.length);

    // Process each project that has a template
    projectsWithTemplates.forEach((project, projectIndex) => {
      setTimeout(() => {
        exportConsolidatedMaterialsForProject(project);
      }, projectIndex * 500); // 500ms delay between downloads
    });

    toast({
      title: "Bulk export started",
      description: `Exporting consolidated materials for ${projectsWithTemplates.length} projects...`,
    });

    setIsExportDialogOpen(false);
  };

  const exportConsolidatedMaterialsForProject = (project: Project) => {
    // Check if project has template
    if (!project.template) {
      toast({
        title: "No template found",
        description: `Project "${project.name}" doesn't have a template to export materials for.`,
        variant: "destructive",
      });
      return;
    }

    console.log(`📋 Processing Project: ${project.name} (Template: ${project.template.name})`);

    // Create a map to consolidate materials within THIS project's template
    const materialMap = new Map();

    project.template.assemblies.forEach(templateAssembly => {
      const assembly = templateAssembly.assembly;
      const assemblyQuantity = Number(templateAssembly.quantity); // How many times this assembly is used in this project

      console.log(`   🏗️  Assembly: ${assembly.name} (Qty: ${assemblyQuantity})`);

      assembly.materials.forEach((assemblyMaterial: any) => {
        const material = assemblyMaterial.material;
        // Create unique key based on material properties
        const materialKey = `${material.name}_${material.partNumber || ''}_${material.manufacturer || ''}_${material.unit}_${material.price}`;

        // 🧮 CALCULATION LOGIC:
        // Material quantity needed = (material quantity per assembly) × (assembly quantity in template)
        const materialQuantityPerAssembly = Number(assemblyMaterial.quantity);
        const materialQuantity = materialQuantityPerAssembly * assemblyQuantity;
        const totalCost = materialQuantity * Number(material.price);

        console.log(`      📦 Material: ${material.name} | Qty per assembly: ${materialQuantityPerAssembly} | Assembly qty: ${assemblyQuantity} | Total qty: ${materialQuantity}`);

        // Check if this material already exists in our consolidation map for this project
        if (materialMap.has(materialKey)) {
          // ✅ MATERIAL EXISTS: Add to existing totals
          const existing = materialMap.get(materialKey);
          existing.totalQuantity += materialQuantity; // Sum quantities across all assemblies in this project
          existing.totalCost += totalCost; // Sum costs
          existing.usedInAssemblies.push({
            assemblyName: assembly.name,
            assemblyQuantity: assemblyQuantity,
            materialQuantityPerAssembly: materialQuantityPerAssembly,
            totalMaterialQuantity: materialQuantity
          });
        } else {
          // 🆕 NEW MATERIAL: Create new entry
          materialMap.set(materialKey, {
            name: material.name,
            partNumber: material.partNumber,
            manufacturer: material.manufacturer,
            unit: material.unit,
            unitPrice: material.price,
            totalQuantity: materialQuantity,
            totalCost: totalCost,
            usedInAssemblies: [{
              assemblyName: assembly.name,
              assemblyQuantity: assemblyQuantity,
              materialQuantityPerAssembly: materialQuantityPerAssembly,
              totalMaterialQuantity: materialQuantity
            }]
          });
        }
      });
    });

    console.log(`📊 Project "${project.name}" - Unique materials found:`, materialMap.size);

    // Create CSV content for this project
    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Project Name", "Template Name", "Description"];
    const csvContent = [
      `CONSOLIDATED MATERIALS FOR PROJECT: ${project.name.toUpperCase()}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Project Description: ${project.description || "No description"}`,
      `Template: ${project.template?.name || 'No template'}`,
      `Client: ${project.client ? (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson) : 'No client'}`,
      `Total Assemblies: ${project.template?.assemblies?.length || 0}`,
      `Total Estimated Cost: ${formatCurrency(Number(project.totalPrice))}`,
      "",
      headers.join(","),
    ];

    let rowNumber = 1;
    materialMap.forEach((material: any) => {
      // Create detailed usage description within this project
      const usageDetails = material.usedInAssemblies.map((usage: any) =>
        `${usage.assemblyName}(${usage.assemblyQuantity}x × ${usage.materialQuantityPerAssembly}ea = ${usage.totalMaterialQuantity})`
      ).join("; ");

      csvContent.push([
        rowNumber++,
        `"${material.manufacturer || ""}"`,
        `"${material.partNumber || ""}"`,
        `"${material.name}"`,
        material.totalQuantity,
        material.unit,
        material.unitPrice,
        material.totalCost,
        `"${project.name}"`,
        `"${project.template?.name || 'No template'}"`,
        `"Usage: ${usageDetails}"`
      ].join(","));
    });

    // Add summary information for this project
    const totalMaterials = materialMap.size;
    const totalQuantity = Array.from(materialMap.values()).reduce((sum, mat) => sum + mat.totalQuantity, 0);
    const totalValue = Array.from(materialMap.values()).reduce((sum, mat) => sum + mat.totalCost, 0);

    csvContent.push(
      "",
      `"SUMMARY FOR PROJECT: ${project.name.toUpperCase()}"`,
      `"Total Unique Materials: ${totalMaterials}"`,
      `"Total Quantity in Project: ${totalQuantity}"`,
      `"Total Value: ${formatCurrency(totalValue)}"`
    );

    // Download file for this project
    const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_consolidated_materials.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: `Exported consolidated materials for project "${project.name}".`,
    });
  };

  const exportConsolidatedMaterialsForProjects = () => {
    // Get projects that have templates
    const projectsWithTemplates = processedProjects.filter(project => project.template);

    if (projectsWithTemplates.length === 0) {
      toast({
        title: "No templates found",
        description: "Selected projects don't have templates to export materials for.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Consolidated Materials Export - Processing Projects:');
    console.log('Projects to process:', projectsWithTemplates.length);

    // Process each project that has a template
    projectsWithTemplates.forEach((project, projectIndex) => {
      // Use the individual export function for each project
      setTimeout(() => {
        exportConsolidatedMaterialsForProject(project);
      }, projectIndex * 500); // 500ms delay between downloads
    });

    toast({
      title: "Bulk export started",
      description: `Exporting consolidated materials for ${projectsWithTemplates.length} projects...`,
    });
  };

  const exportMaterialHandoverPDF = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export-pdf`, {
        method: 'GET',
      });

      if (response.ok) {
        // The PDF will be automatically downloaded by the browser
        // due to the Content-Disposition header set in the API
        toast({
          title: "PDF Export Successful",
          description: "Material handover PDF has been downloaded.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Export Failed",
          description: error.error || "Failed to generate PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Network error occurred during PDF export",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96"></div>
          <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Projects</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage construction projects and their cost calculations</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Add Project</span>
              <span className="xs:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Project
              </DialogTitle>
              <DialogDescription>
                Create a comprehensive construction project with detailed information and template selection.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Renovasi Rumah Pak Ahmad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectType">Project Type</Label>
                    <Select
                      value={formData.projectType}
                      onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Renovation">Renovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed project description..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Client & Template */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Client & Template
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client</SelectItem>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.clientType === 'COMPANY' ? client.companyName : client.contactPerson}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select
                      value={formData.fromTemplateId}
                      onValueChange={(value) => setFormData({ ...formData, fromTemplateId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template to base this project on" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No template (Custom Project)</SelectItem>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Selecting a template will automatically calculate the project cost
                    </p>
                  </div>
                </div>
              </div>

              {/* Location & Area */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location & Area
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Project location address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="e.g., 150"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget & Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (IDR)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="Approved budget"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Planned Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Planned End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actualStart">Actual Start Date</Label>
                    <Input
                      id="actualStart"
                      type="date"
                      value={formData.actualStart}
                      onChange={(e) => setFormData({ ...formData, actualStart: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actualEnd">Actual End Date</Label>
                    <Input
                      id="actualEnd"
                      type="date"
                      value={formData.actualEnd}
                      onChange={(e) => setFormData({ ...formData, actualEnd: e.target.value })}
                    />
                  </div>
                </div>
              </div>

            {/* Status & Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status & Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="DELAYED">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
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
            </div>

            {/* Project Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Project Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schematicDocs">Schematic Documents</Label>
                  <Input
                    id="schematicDocs"
                    type="file"
                    accept=".pdf,.doc,.docx,.dwg,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file, editingProject?.id || "new", "schematic");
                      }
                    }}
                  />
                  {editingProject?.schematicDocs && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Current file:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(editingProject.schematicDocs!, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View Schematic
                      </Button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualityCheckDocs">Quality Check Documents</Label>
                  <div className="space-y-2">
                    {!editingProject && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-900 dark:text-blue-100 font-medium">
                            Default file: Checksheet Form.docx
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          A default quality check form will be automatically attached to this project.
                        </p>
                      </div>
                    )}
                    <Input
                      id="qualityCheckDocs"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, editingProject?.id || "new", "qualityCheck");
                        }
                      }}
                    />
                    {editingProject?.qualityCheckDocs && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Current file:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(editingProject.qualityCheckDocs!, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View Quality Check
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setFormData({
                      name: "",
                      description: "",
                      clientId: "",
                      projectType: "",
                      location: "",
                      area: "",
                      budget: "",
                      startDate: "",
                      endDate: "",
                      actualStart: "",
                      actualEnd: "",
                      status: "PLANNING",
                      progress: "0",
                      priority: "MEDIUM",
                      fromTemplateId: "",
                      assignedUsers: []
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Projects</CardTitle>
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Available Templates</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              Reusable configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Value</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-lg font-bold text-green-600 dark:text-green-400 truncate">
              {formatCurrency(projects.reduce((total, project) => total + Number(project.totalPrice), 0))}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Combined project value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Avg Project Value</CardTitle>
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-lg font-bold truncate">
              {projects.length > 0
                ? formatCurrency(projects.reduce((total, project) => total + Number(project.totalPrice), 0) / projects.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Average per project
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects by name, client, or template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="none">Custom Projects</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export Materials
              </Button>
              {selectedProjects.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedProjects.length})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projects List
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {processedProjects.length} of {projects.length} projects
            </div>
          </CardTitle>
          <CardDescription>
            All construction projects and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first project.
              </p>
            </div>
          ) : processedProjects.length === 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedProjects.length === processedProjects.length && processedProjects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                        Project Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("createdAt")} className="h-auto p-0 font-semibold">
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-center">Schematic Docs</TableHead>
                    <TableHead className="text-center">Quality Check Docs</TableHead>
                    <TableHead className="text-center">BOQ</TableHead>
                    <TableHead className="text-center">Template Docs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setIsDetailsDialogOpen(true);
                            }}
                            className="hover:text-primary hover:underline text-left transition-colors"
                            title="Click to view project details"
                          >
                            {project.name}
                          </button>
                          {isNewItem(project.createdAt) && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                              New
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.client ?
                          (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson)
                          : "-"}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(Number(project.totalPrice))}
                      </TableCell>
                      <TableCell>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {project.schematicDocs ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(project.schematicDocs!, '_blank')}
                              title="Download Schematic Document"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument({
                                  projectId: project.id,
                                  projectName: project.name,
                                  docType: "schematic",
                                  fileUrl: project.schematicDocs!,
                                  fileName: project.schematicDocs!.split('/').pop() || 'Unknown',
                                  uploadDate: project.updatedAt
                                });
                                setIsDocumentDetailsOpen(true);
                              }}
                              title="View Document Details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.dwg,.xls,.xlsx"
                              style={{ display: 'none' }}
                              id={`schematic-upload-${project.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, project.id, "schematic");
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`schematic-upload-${project.id}`)?.click()}
                              title="Upload Schematic Document"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {project.qualityCheckDocs ? (
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(project.qualityCheckDocs!, '_blank')}
                              title="Download Quality Check Document"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument({
                                  projectId: project.id,
                                  projectName: project.name,
                                  docType: "qualityCheck",
                                  fileUrl: project.qualityCheckDocs!,
                                  fileName: project.qualityCheckDocs!.split('/').pop() || 'Unknown',
                                  uploadDate: project.updatedAt
                                });
                                setIsDocumentDetailsOpen(true);
                              }}
                              title="View Document Details"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              style={{ display: 'none' }}
                              id={`quality-upload-${project.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(file, project.id, "qualityCheck");
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`quality-upload-${project.id}`)?.click()}
                              title="Upload Quality Check Document"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {project.template ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/projects/${project.id}/boq`)}
                            title="View Bill of Quantity"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View BOQ
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {project.template?.docs && project.template.docs.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setIsDetailsDialogOpen(true);
                            }}
                            className="h-auto p-1 text-xs hover:bg-muted"
                            title={`View ${project.template.docs.length} template documents`}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {project.template.docs.length} docs
                          </Button>
                        ) : project.template ? (
                          <Badge variant="outline" className="text-xs">
                            0 docs
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProject(project);
                              setIsDetailsDialogOpen(true);
                            }}
                            title="View project details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/projects/${project.id}/timeline`)}
                            title="View project timeline"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/projects/${project.id}/boq`)}
                            title="View bill of quantity"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(project)}
                            title="Duplicate project"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(project)}
                            title="Edit project"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            title="Delete project"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Project: {editingProject?.name}
            </DialogTitle>
            <DialogDescription>
              Update comprehensive project information and settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Renovasi Rumah Pak Ahmad"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-projectType">Project Type</Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Renovation">Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed project description..."
                  rows={3}
                />
              </div>
            </div>

            {/* Client & Template */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client & Template
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-clientId">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.clientType === 'COMPANY' ? client.companyName : client.contactPerson}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-template">Template</Label>
                  <Select
                    value={formData.fromTemplateId}
                    onValueChange={(value) => setFormData({ ...formData, fromTemplateId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template to base this project on" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template (Custom Project)</SelectItem>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a template will automatically calculate the project cost
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Area */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location & Area
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Project location address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-area">Area (m²)</Label>
                  <Input
                    id="edit-area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g., 150"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget & Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-budget">Budget (IDR)</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Approved budget"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Planned Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Planned End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-actualStart">Actual Start Date</Label>
                  <Input
                    id="edit-actualStart"
                    type="date"
                    value={formData.actualStart}
                    onChange={(e) => setFormData({ ...formData, actualStart: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-actualEnd">Actual End Date</Label>
                  <Input
                    id="edit-actualEnd"
                    type="date"
                    value={formData.actualEnd}
                    onChange={(e) => setFormData({ ...formData, actualEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status & Progress */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status & Progress
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="DELAYED">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
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
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingProject(null);
                  setFormData({
                    name: "",
                    description: "",
                    clientId: "",
                    projectType: "",
                    location: "",
                    area: "",
                    budget: "",
                    startDate: "",
                    endDate: "",
                    actualStart: "",
                    actualEnd: "",
                    status: "PLANNING",
                    progress: "0",
                    priority: "MEDIUM",
                    fromTemplateId: "",
                    assignedUsers: []
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Project Details: "{selectedProject?.name}"
            </DialogTitle>
            <DialogDescription>
              Comprehensive project information and template breakdown
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Project Name</Label>
                    <p className="text-lg font-semibold">{selectedProject?.name}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Client Name</Label>
                    <p className="text-lg">{selectedProject?.client ?
                      (selectedProject.client.clientType === 'COMPANY' ? selectedProject.client.companyName : selectedProject.client.contactPerson)
                      : "Not specified"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Template Used</Label>
                    <div className="text-lg">
                      {selectedProject?.template ? (
                        <Badge variant="outline" className="text-base px-3 py-1">
                          {selectedProject.template.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          Custom Project
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created Date</Label>
                    <p className="text-lg">
                      {selectedProject ? new Date(selectedProject.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : ""}
                    </p>
                  </div>
                </div>

                {selectedProject?.template?.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Template Description</Label>
                    <p className="text-sm bg-muted p-3 rounded-md mt-1">
                      {selectedProject.template.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Template Documents (if applicable) */}
            {selectedProject?.template && selectedProject.template.docs && Array.isArray(selectedProject.template.docs) && selectedProject.template.docs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Template Documents
                  </CardTitle>
                  <CardDescription>
                    Documents from "{selectedProject.template.name}" template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Documents Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                          {selectedProject.template.docs?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Documents</div>
                      </div>

                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600">
                          {selectedProject.template.docs?.filter(doc => doc.name.startsWith('Merged PDFs -'))?.length || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Merged PDFs</div>
                      </div>

                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {selectedProject.template.docs ? (selectedProject.template.docs.reduce((sum, doc) => sum + doc.size, 0) / 1024).toFixed(1) : '0.0'} KB
                        </div>
                        <div className="text-sm text-muted-foreground">Total Size</div>
                      </div>

                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          {selectedProject.template.docs && selectedProject.template.docs.length > 0
                            ? new Date(Math.max(...selectedProject.template.docs.map(doc => new Date(doc.uploadedAt).getTime()))).toLocaleDateString()
                            : 'No docs'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">Last Upload</div>
                      </div>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <h4 className="font-medium">Available Documents</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to template details to manage documents
                            window.open(`/templates`, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Manage in Templates
                        </Button>
                      </div>

                      {selectedProject.template.docs.map((doc: DocumentFile, index: number) => {
                        const isMergedPdf = doc.name.startsWith('Merged PDFs -');

                        return (
                          <div key={`template-doc-${index}`} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="relative flex-shrink-0">
                              <File className="h-10 w-10 text-muted-foreground" />
                              {isMergedPdf && (
                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  ✓
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                                {isMergedPdf && (
                                  <Badge variant="secondary" className="text-xs">
                                    Merged PDF
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                <span>•</span>
                                <span>{doc.type}</span>
                                <span>•</span>
                                <span>From template</span>
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.url;
                                  link.download = doc.name;
                                  link.target = '_blank';
                                  link.click();
                                }}
                                className="hover:bg-blue-50 hover:text-blue-600"
                                title={`Download ${doc.name}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  window.open(doc.url, '_blank');
                                }}
                                className="hover:bg-green-50 hover:text-green-600"
                                title={`View ${doc.name} in browser`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!selectedProject) return;

                                  try {
                                    const response = await fetch(`/api/projects/${selectedProject.id}`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        id: selectedProject.id,
                                        name: selectedProject.name, // Required field for API validation
                                        schematicDocs: doc.url
                                      }),
                                    });

                                    if (response.ok) {
                                      const updatedProject = await response.json();

                                      toast({
                                        title: "Document Set as Schematic",
                                        description: `"${doc.name}" has been set as schematic document for this project.`,
                                      });

                                      // Update the projects list with the updated project
                                      setProjects(prevProjects =>
                                        prevProjects.map(p =>
                                          p.id === updatedProject.id ? updatedProject : p
                                        )
                                      );

                                      // Update local state for the dialog
                                      if (selectedProject) {
                                        setSelectedProject(updatedProject);
                                      }
                                    } else {
                                      const error = await response.json();
                                      toast({
                                        title: "Failed to Set Document",
                                        description: error.error || "Failed to set document as schematic",
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description: "Network error occurred",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                className="hover:bg-purple-50 hover:text-purple-600"
                                title={`Set "${doc.name}" as schematic document`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Copy all template documents to project documents
                          if (selectedProject?.template?.docs) {
                            toast({
                              title: "Feature Coming Soon",
                              description: "Copy template documents to project feature will be available soon.",
                            });
                          }
                        }}
                        disabled={!selectedProject?.template?.docs?.length}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Project Docs
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Open template details
                          window.open(`/templates`, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Template Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template Breakdown (if applicable) */}
            {selectedProject?.template && selectedProject.template.assemblies && Array.isArray(selectedProject.template.assemblies) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Template Breakdown
                  </CardTitle>
                  <CardDescription>
                    Assemblies and materials from the selected template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold">
                          {selectedProject.template.assemblies.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Assemblies</div>
                      </div>

                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold">
                          {selectedProject.template.assemblies?.reduce((total, ta) => {
                            return total + (ta.assembly?.materials?.length || 0);
                          }, 0) || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Materials</div>
                      </div>

                      <div className="text-center p-3 border rounded-lg">
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(Number(selectedProject.totalPrice))}
                        </div>
                        <div className="text-sm text-muted-foreground">Calculated Cost</div>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedProject.template.assemblies.map((templateAssembly, index) => {
                        const assembly = templateAssembly.assembly;
                        const quantity = Number(templateAssembly.quantity);

                        return (
                          <div key={templateAssembly.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 border rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium">{assembly.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {assembly.materials?.length || 0} materials × {quantity} qty
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(calculateAssemblyCost(assembly) * quantity)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(calculateAssemblyCost(assembly))} × {quantity}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Template Cost</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {selectedProject?.template
                          ? formatCurrency(Number(selectedProject.totalPrice))
                          : "N/A (Custom Project)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Additional Costs</span>
                      <span className="text-muted-foreground">
                        {selectedProject?.template ? "Included in template" : "Calculate manually"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 text-lg font-bold border-t-2">
                      <span>Total Project Cost</span>
                      <span className="text-green-600 dark:text-green-400">{formatCurrency(Number(selectedProject?.totalPrice || 0))}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Project Status</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Active Project</span>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Template Usage</h4>
                      <div className="text-sm">
                        {selectedProject?.template
                          ? `Based on "${selectedProject.template.name}" template`
                          : "Custom project without template"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export CSV Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Projects Data
            </DialogTitle>
            <DialogDescription>
              Choose the export format for your project data. Each option provides different levels of detail.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-6 overflow-hidden">
            {/* Export Options */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="space-y-3">
                {/* Consolidated Materials Export */}
                <div className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Export Consolidated Materials per Project</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Export separate CSV files for each project containing consolidated materials from their templates.
                        Perfect for procurement and cost analysis.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground flex items-center gap-1"><BarChart3 className="h-4 w-4" /> Projects:</span>
                          <span className="font-medium">{processedProjects.filter(p => p.template).length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground flex items-center gap-1"><FileText className="h-4 w-4" /> Files:</span>
                          <span className="font-medium">Multiple CSV</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" /> Content:</span>
                          <span className="font-medium">Cost breakdown</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={exportConsolidatedMaterialsForProjects}
                      className="ml-6 shrink-0 px-6 py-3"
                      size="default"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export All Projects
                    </Button>
                  </div>
                </div>
              </div>

              {/* Individual Project Export Note */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Individual Project Export
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      To export materials from a specific project only, click the "Export" button in the "Export Materials" column of the table.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Details Dialog */}
      <Dialog open={isDocumentDetailsOpen} onOpenChange={setIsDocumentDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Document Details
            </DialogTitle>
            <DialogDescription>
              Information about the selected document
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Document Type</Label>
                  <p className="text-lg font-semibold capitalize">
                    {selectedDocument.docType === "schematic" ? "Schematic Document" : "Quality Check Document"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Project Name</Label>
                  <p className="text-lg">{selectedDocument.projectName}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {selectedDocument.fileName}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Upload Date</Label>
                  <p className="text-lg">
                    {selectedDocument.uploadDate
                      ? new Date(selectedDocument.uploadDate).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Unknown'
                    }
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File URL</Label>
                  <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                    {selectedDocument.fileUrl}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDocumentDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.open(selectedDocument.fileUrl, '_blank');
                    setIsDocumentDetailsOpen(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
