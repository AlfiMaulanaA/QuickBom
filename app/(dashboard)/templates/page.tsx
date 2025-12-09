"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, FileText, Settings, DollarSign, Search, Download, ArrowUpDown, Copy, MoreHorizontal, Package, BarChart3, Clock, X, ChevronLeft, ChevronRight, Eye, Upload, File, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  price: number;
}

interface AssemblyMaterial {
  id?: number;
  materialId: number;
  quantity: number;
  material: Material;
}

interface Assembly {
  id: number;
  name: string;
  description: string | null;
  materials: AssemblyMaterial[];
  docs?: DocumentFile[] | null;
}

interface TemplateAssembly {
  id?: number;
  assemblyId: number;
  quantity: number;
  assembly: Assembly;
}

interface DocumentFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  docs: DocumentFile[] | null;
  assemblies: TemplateAssembly[];
  projects: any[];
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assembliesCountFilter, setAssembliesCountFilter] = useState("all");
  const [costFilter, setCostFilter] = useState("all");
  const [projectsCountFilter, setProjectsCountFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [isAssemblyDetailsDialogOpen, setIsAssemblyDetailsDialogOpen] = useState(false);
  const [isTemplateDocumentsDialogOpen, setIsTemplateDocumentsDialogOpen] = useState(false);
  const [isMergingPdfs, setIsMergingPdfs] = useState(false);
  const [isPdfOrderDialogOpen, setIsPdfOrderDialogOpen] = useState(false);
  const [pdfOrder, setPdfOrder] = useState<number[]>([]);
  const [mergeProgress, setMergeProgress] = useState<{
    stage: string;
    progress: number;
    message: string;
  } | null>(null);
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch templates",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblies = async () => {
    try {
      const response = await fetch("/api/assemblies");
      if (response.ok) {
        const data = await response.json();
        setAssemblies(data);
      }
    } catch (error) {
      console.error("Failed to fetch assemblies:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchAssemblies();
  }, []);



  const handleDelete = (id: number) => {
    setTemplateToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleteDialogOpen(false);

    try {
      const response = await fetch(`/api/templates/${templateToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        fetchTemplates();
      } else if (response.status === 409) {
        toast({
          title: "Cannot Delete Template",
          description: data.message || "This template is used in projects and cannot be deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setTemplateToDelete(null);
    }
  };



  const calculateEstimatedCost = (template: Template) => {
    let totalCost = 0;

    for (const templateAssembly of template.assemblies) {
      const assembly = templateAssembly.assembly;

      // Calculate cost per assembly
      let assemblyCost = 0;
      if (assembly.materials) {
        for (const material of assembly.materials) {
          assemblyCost += Number(material.material.price) * Number(material.quantity);
        }
      }

      // Multiply by template quantity
      totalCost += assemblyCost * Number(templateAssembly.quantity);
    }

    return totalCost;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // Filter and sort templates
  const processedTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const assembliesCount = template.assemblies.length;
      const matchesAssembliesCount = assembliesCountFilter === "all" ||
                                    (assembliesCountFilter === "low" && assembliesCount >= 1 && assembliesCount <= 2) ||
                                    (assembliesCountFilter === "medium" && assembliesCount >= 3 && assembliesCount <= 5) ||
                                    (assembliesCountFilter === "high" && assembliesCount >= 6);

      const estimatedCost = calculateEstimatedCost(template);
      const matchesCost = costFilter === "all" ||
                         (costFilter === "low" && estimatedCost >= 0 && estimatedCost <= 100000) ||
                         (costFilter === "medium" && estimatedCost > 100000 && estimatedCost <= 500000) ||
                         (costFilter === "high" && estimatedCost > 500000);

      const projectsCount = template.projects.length;
      const matchesProjectsCount = projectsCountFilter === "all" ||
                                  (projectsCountFilter === "low" && projectsCount >= 0 && projectsCount <= 1) ||
                                  (projectsCountFilter === "medium" && projectsCount >= 2 && projectsCount <= 5) ||
                                  (projectsCountFilter === "high" && projectsCount >= 6);

      const createdDate = new Date(template.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const matchesDate = dateFilter === "all" ||
                         (dateFilter === "recent" && daysDiff <= 7) ||
                         (dateFilter === "normal" && daysDiff > 7 && daysDiff <= 30) ||
                         (dateFilter === "old" && daysDiff > 30);

      return matchesSearch && matchesAssembliesCount && matchesCost && matchesProjectsCount && matchesDate;
    });

    // Sort templates
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
  }, [templates, searchTerm, assembliesCountFilter, costFilter, projectsCountFilter, dateFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(processedTemplates.map(t => t.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, id]);
    } else {
      setSelectedTemplates(prev => prev.filter(templateId => templateId !== id));
    }
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleteDialogOpen(false);

    let successCount = 0;
    let errorMessages: string[] = [];
    let constraintErrors: string[] = [];

    try {
      // Process deletions sequentially to avoid overwhelming the server
      for (const id of selectedTemplates) {
        try {
          const response = await fetch(`/api/templates/${id}`, { method: "DELETE" });
          const data = await response.json();

          if (response.ok) {
            successCount++;
          } else if (response.status === 409) {
            // Constraint violation - template is used in projects
            constraintErrors.push(`${id}: ${data.message}`);
          } else {
            // Other error
            errorMessages.push(`${id}: ${data.error || 'Unknown error'}`);
          }
        } catch (error) {
          errorMessages.push(`${id}: Network error`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `Successfully deleted ${successCount} out of ${selectedTemplates.length} templates`,
        });
      }

      // Show constraint errors as warnings
      if (constraintErrors.length > 0) {
        toast({
          title: "Some Templates Could Not Be Deleted",
          description: `${constraintErrors.length} templates are used in projects and cannot be deleted.`,
          variant: "destructive",
        });
        console.log('Constraint errors:', constraintErrors);
      }

      // Show other errors
      if (errorMessages.length > 0) {
        toast({
          title: "Some Deletions Failed",
          description: `${errorMessages.length} templates could not be deleted due to errors.`,
          variant: "destructive",
        });
        console.log('Delete errors:', errorMessages);
      }

      fetchTemplates();
      setSelectedTemplates([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk delete",
        variant: "destructive",
      });
      console.error('Bulk delete error:', error);
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

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const exportToCSV = () => {
    setIsExportDialogOpen(true);
  };

  const exportTemplatesBasic = () => {
    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Template Name", "Description"];
    const csvContent = [
      "TEMPLATES LIST",
      "",
      headers.join(","),
    ];

    let rowNumber = 1;
    processedTemplates.forEach(template => {
      csvContent.push([
        rowNumber++,
        "-",
        "-",
        `"${template.name}"`,
        1,
        "Template",
        calculateEstimatedCost(template),
        calculateEstimatedCost(template),
        `"${template.name}"`,
        `"${template.description || ""}"`
      ].join(","));
    });

    const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processedTemplates.length === 1
      ? `${processedTemplates[0].name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_basic.csv`
      : "all_templates_basic.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  };

  const exportTemplatesWithAssemblies = () => {
    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Template Name", "Description"];
    const csvContent = [
      "TEMPLATES WITH ASSEMBLIES",
      "",
      headers.join(","),
    ];

    let rowNumber = 1;

    processedTemplates.forEach(template => {
      // Template entry
      csvContent.push([
        rowNumber++,
        "-",
        "-",
        `"${template.name}"`,
        1,
        "Template",
        calculateEstimatedCost(template),
        calculateEstimatedCost(template),
        `"${template.name}"`,
        `"${template.description || ""}"`
      ].join(","));

      // Assembly entries for this template
      template.assemblies.forEach(assembly => {
        const quantity = Number(assembly.quantity);
        const unitCost = assembly.assembly.materials.reduce((total, am) => {
          return total + (Number(am.material.price) * Number(am.quantity));
        }, 0);
        const totalCost = unitCost * quantity;

        csvContent.push([
          rowNumber++,
          "-",
          "-",
          `"${assembly.assembly.name}"`,
          quantity,
          "Assembly",
          unitCost,
          totalCost,
          `"${template.name}"`,
          `"${assembly.assembly.description || ""}"`
        ].join(","));
      });
    });

    const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processedTemplates.length === 1
      ? `${processedTemplates[0].name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_with_assemblies.csv`
      : "all_templates_with_assemblies.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  };

  const exportTemplatesWithMaterials = () => {
    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Template Name", "Description"];
    const csvContent = [
      "TEMPLATES WITH COMPLETE MATERIALS BREAKDOWN",
      "",
      headers.join(","),
    ];

    let rowNumber = 1;

    processedTemplates.forEach(template => {
      // Template entry
      csvContent.push([
        rowNumber++,
        "-",
        "-",
        `"${template.name}"`,
        1,
        "Template",
        calculateEstimatedCost(template),
        calculateEstimatedCost(template),
        `"${template.name}"`,
        `"${template.description || ""}"`
      ].join(","));

      // Assembly entries for this template
      template.assemblies.forEach(assembly => {
        const assemblyQuantity = Number(assembly.quantity);
        const assemblyUnitCost = assembly.assembly.materials.reduce((total, am) => {
          return total + (Number(am.material.price) * Number(am.quantity));
        }, 0);
        const assemblyTotalCost = assemblyUnitCost * assemblyQuantity;

        // Assembly entry
        csvContent.push([
          rowNumber++,
          "-",
          "-",
          `"${assembly.assembly.name}"`,
          assemblyQuantity,
          "Assembly",
          assemblyUnitCost,
          assemblyTotalCost,
          `"${template.name}"`,
          `"${assembly.assembly.description || ""}"`
        ].join(","));

        // Material entries for this assembly
        assembly.assembly.materials.forEach(material => {
          const materialTotalCost = Number(material.material.price) * Number(material.quantity);

          csvContent.push([
            rowNumber++,
            `"${material.material.manufacturer || ""}"`,
            `"${material.material.partNumber || ""}"`,
            `"${material.material.name}"`,
            Number(material.quantity),
            material.material.unit,
            material.material.price,
            materialTotalCost,
            `"${template.name}"`,
            `"Material in ${assembly.assembly.name}"`
          ].join(","));
        });
      });
    });

    const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = processedTemplates.length === 1
      ? `${processedTemplates[0].name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_with_materials.csv`
      : "all_templates_with_materials.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  };

  const exportConsolidatedMaterials = () => {
    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Assembly Name", "Description"];

    console.log('🔍 Consolidated Materials Export - Processing Templates:');
    console.log('Templates to process:', processedTemplates.length);

    // Process each template separately
    processedTemplates.forEach((template, templateIndex) => {
      console.log(`📋 Processing Template: ${template.name}`);

      // Create a map to consolidate materials within THIS template only
      const materialMap = new Map();

      template.assemblies.forEach(templateAssembly => {
        const assembly = templateAssembly.assembly;
        const assemblyQuantity = Number(templateAssembly.quantity); // How many times this assembly is used in this template

        console.log(`   🏗️  Assembly: ${assembly.name} (Qty: ${assemblyQuantity})`);

        assembly.materials.forEach(assemblyMaterial => {
          const material = assemblyMaterial.material;
          // Create unique key based on material properties (name, part number, manufacturer, unit, price)
          const materialKey = `${material.name}_${material.partNumber || ''}_${material.manufacturer || ''}_${material.unit}_${material.price}`;

          // 🧮 CALCULATION LOGIC:
          // Material quantity needed = (material quantity per assembly) × (assembly quantity in template)
          const materialQuantityPerAssembly = Number(assemblyMaterial.quantity);
          const materialQuantity = materialQuantityPerAssembly * assemblyQuantity;
          const totalCost = materialQuantity * Number(material.price);

          console.log(`      📦 Material: ${material.name} | Qty per assembly: ${materialQuantityPerAssembly} | Assembly qty: ${assemblyQuantity} | Total qty: ${materialQuantity}`);

          // Check if this material already exists in our consolidation map for this template
          if (materialMap.has(materialKey)) {
            // ✅ MATERIAL EXISTS: Add to existing totals
            const existing = materialMap.get(materialKey);
            existing.totalQuantity += materialQuantity; // Sum quantities across all assemblies in this template
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

      console.log(`📊 Template "${template.name}" - Unique materials found:`, materialMap.size);

      // Create CSV content for this template
      const csvContent = [
        `CONSOLIDATED MATERIALS FOR TEMPLATE: ${template.name.toUpperCase()}`,
        `Generated on: ${new Date().toLocaleString()}`,
        `Template Description: ${template.description || "No description"}`,
        `Total Assemblies: ${template.assemblies.length}`,
        `Total Estimated Cost: ${formatCurrency(calculateEstimatedCost(template))}`,
        "",
        headers.join(","),
      ];

      let rowNumber = 1;
      materialMap.forEach((material: any) => {
        // Create detailed usage description within this template
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
          `"${template.name}"`,
          `"Usage: ${usageDetails}"`
        ].join(","));
      });

      // Add summary information for this template
      const totalMaterials = materialMap.size;
      const totalQuantity = Array.from(materialMap.values()).reduce((sum, mat) => sum + mat.totalQuantity, 0);
      const totalValue = Array.from(materialMap.values()).reduce((sum, mat) => sum + mat.totalCost, 0);

      csvContent.push(
        "",
        `"SUMMARY FOR TEMPLATE: ${template.name.toUpperCase()}"`,
        `"Total Unique Materials: ${totalMaterials}"`,
        `"Total Quantity in Template: ${totalQuantity}"`,
        `"Total Value: ${formatCurrency(totalValue)}"`
      );

      // Download file for this template with delay to avoid browser blocking
      setTimeout(() => {
        const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${template.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_consolidated_materials.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }, templateIndex * 500); // 500ms delay between downloads
    });

    setIsExportDialogOpen(false);
  };

  const handleDuplicate = async (template: Template) => {
    try {
      // Create duplicate data with new name
      const duplicateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        assemblies: template.assemblies.map(ta => ({
          assemblyId: ta.assemblyId,
          quantity: ta.quantity
        }))
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (response.ok) {
        toast({
          title: "Template Duplicated",
          description: `"${duplicateData.name}" has been created successfully`,
        });
        fetchTemplates();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to duplicate template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleMergePdfs = async (template: Template) => {
    if (!template || template.assemblies.length === 0) {
      toast({
        title: "Cannot Merge PDFs",
        description: "Template has no assemblies to merge PDFs from",
        variant: "destructive",
      });
      return;
    }

    // Check if template has assemblies with PDFs
    let totalPdfFiles = 0;
    const assembliesWithPdfs = template.assemblies.filter(assembly => {
      const docs = Array.isArray(assembly.assembly.docs) ? assembly.assembly.docs : [];
      const pdfCount = docs.filter((doc: any) =>
        doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf')
      ).length;
      totalPdfFiles += pdfCount;
      return pdfCount > 0;
    });

    if (totalPdfFiles < 2) {
      toast({
        title: "Cannot Merge PDFs",
        description: `Need at least 2 PDF files to merge. Found ${totalPdfFiles} PDF files.`,
        variant: "destructive",
      });
      return;
    }

    // Set up the order dialog
    setSelectedTemplate(template);
    setPdfOrder(assembliesWithPdfs.map(ta => ta.assemblyId));
    setIsPdfOrderDialogOpen(true);
  };

  const confirmMergePdfs = async () => {
    if (!selectedTemplate || pdfOrder.length === 0) return;

    setIsPdfOrderDialogOpen(false);
    setIsMergingPdfs(true);
    setMergeProgress({ stage: 'Preparing files...', progress: 10, message: 'Collecting PDF files from assemblies' });

    try {
      // Update progress
      setMergeProgress({ stage: 'Sending to server...', progress: 30, message: 'Uploading files to merge service' });

      const response = await fetch(`/api/templates/${selectedTemplate.id}/merge-pdfs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          pdfOrder: pdfOrder
        }),
      });

      setMergeProgress({ stage: 'Processing...', progress: 60, message: 'Merging PDF files' });

      const data = await response.json();

      if (response.ok) {
        setMergeProgress({ stage: 'Saving...', progress: 90, message: 'Saving merged PDF' });

        toast({
          title: "PDFs Merged Successfully",
          description: `Merged ${data.totalFilesMerged} PDF files into "${data.mergedFile.name}"`,
        });

        // Refresh template data to show new merged document
        await fetchTemplates();

        setMergeProgress({ stage: 'Complete!', progress: 100, message: 'PDF merge completed successfully' });

        // Close current dialog and reopen to show updated documents
        setIsDetailsDialogOpen(false);
        setTimeout(() => {
          setSelectedTemplate(selectedTemplate);
          setIsDetailsDialogOpen(true);
        }, 500);

      } else {
        toast({
          title: "Merge Failed",
          description: data.error || "Failed to merge PDFs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: "Network error occurred while merging PDFs",
        variant: "destructive",
      });
    } finally {
      setIsMergingPdfs(false);
      setMergeProgress(null);
    }
  };

  const exportTemplateDetailsToCSV = () => {
    if (!selectedTemplate) return;

    const headers = ["#", "Assembly Name", "Description", "Quantity", "Materials Count", "Unit Cost", "Total Cost", "Percentage"];
    const csvContent = [
      headers.join(","),
      ...selectedTemplate.assemblies.map((templateAssembly, index) => {
        const assembly = templateAssembly.assembly;
        const quantity = Number(templateAssembly.quantity);

        // Calculate assembly unit cost (cost of all materials in assembly)
        const assemblyUnitCost = assembly.materials.reduce((total, am) => {
          return total + (Number(am.material.price) * Number(am.quantity));
        }, 0);

        // Calculate total cost for this assembly in template
        const totalCost = assemblyUnitCost * quantity;

        // Calculate percentage of total template cost
        const templateTotalCost = calculateEstimatedCost(selectedTemplate);
        const percentage = templateTotalCost > 0 ? (totalCost / templateTotalCost) * 100 : 0;

        return [
          index + 1,
          `"${assembly.name}"`,
          `"${assembly.description || ""}"`,
          quantity,
          assembly.materials.length,
          assemblyUnitCost,
          totalCost,
          `${percentage.toFixed(1)}%`
        ].join(",");
      }),
      "", // Empty row
      `"Template: ${selectedTemplate.name}"`,
      `"Total Assemblies: ${selectedTemplate.assemblies.length}"`,
      `"Total Projects: ${selectedTemplate.projects.length}"`,
      `"Total Cost: ${calculateEstimatedCost(selectedTemplate)}"`,
      `"Description: ${selectedTemplate.description || "No description"}"`
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate.name.replace(/[^a-zA-Z0-9]/g, '_')}_details.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 relative">
      {/* Global Loading Overlay untuk PDF Merge */}
      {isMergingPdfs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Merging PDFs</h3>
                <p className="text-sm text-muted-foreground">
                  {mergeProgress?.stage || 'Processing...'}
                </p>
              </div>
            </div>

            {mergeProgress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{mergeProgress.message}</span>
                  <span className="font-medium">{mergeProgress.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${mergeProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Please wait, this may take a few moments...
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage construction templates and their assembly compositions
          </p>
        </div>

        <Button onClick={() => router.push("/templates/create")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Templates</CardTitle>
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              Construction packages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Active Projects</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">
              {templates.reduce((total, template) => total + template.projects.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Projects using templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Avg Assemblies</CardTitle>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">
              {templates.length > 0
                ? Math.round(templates.reduce((total, template) => total + template.assemblies.length, 0) / templates.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Assemblies per template
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search templates by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setAssembliesCountFilter("all");
                    setCostFilter("all");
                    setProjectsCountFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-48">
                <Select value={assembliesCountFilter} onValueChange={setAssembliesCountFilter}>
                  <SelectTrigger>
                    <Package className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by assemblies count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assemblies Count</SelectItem>
                    <SelectItem value="low">Low (1-2 assemblies)</SelectItem>
                    <SelectItem value="medium">Medium (3-5 assemblies)</SelectItem>
                    <SelectItem value="high">High (6+ assemblies)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={costFilter} onValueChange={setCostFilter}>
                  <SelectTrigger>
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by estimated cost" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Costs</SelectItem>
                    <SelectItem value="low">Low (≤100K)</SelectItem>
                    <SelectItem value="medium">Medium (100K-500K)</SelectItem>
                    <SelectItem value="high">High (&gt;500K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={projectsCountFilter} onValueChange={setProjectsCountFilter}>
                  <SelectTrigger>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by projects count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects Count</SelectItem>
                    <SelectItem value="low">Low (0-1 projects)</SelectItem>
                    <SelectItem value="medium">Medium (2-5 projects)</SelectItem>
                    <SelectItem value="high">High (6+ projects)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:w-48">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by creation date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="recent">Recent (≤7 days)</SelectItem>
                    <SelectItem value="normal">Normal (8-30 days)</SelectItem>
                    <SelectItem value="old">Old (&gt;30 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
              {selectedTemplates.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedTemplates.length})
                </Button>
              )}
            </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || assembliesCountFilter !== "all" || costFilter !== "all" || projectsCountFilter !== "all" || dateFilter !== "all") && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {assembliesCountFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Assemblies: {(() => {
                      switch (assembliesCountFilter) {
                        case "low": return "1-2";
                        case "medium": return "3-5";
                        case "high": return "6+";
                        default: return assembliesCountFilter;
                      }
                    })()}
                    <button
                      onClick={() => setAssembliesCountFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {costFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Cost: {(() => {
                      switch (costFilter) {
                        case "low": return "≤100K";
                        case "medium": return "100K-500K";
                        case "high": return ">500K";
                        default: return costFilter;
                      }
                    })()}
                    <button
                      onClick={() => setCostFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {projectsCountFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Projects: {(() => {
                      switch (projectsCountFilter) {
                        case "low": return "0-1";
                        case "medium": return "2-5";
                        case "high": return "6+";
                        default: return projectsCountFilter;
                      }
                    })()}
                    <button
                      onClick={() => setProjectsCountFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {dateFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Date: {(() => {
                      switch (dateFilter) {
                        case "recent": return "≤7 days";
                        case "normal": return "8-30 days";
                        case "old": return ">30 days";
                        default: return dateFilter;
                      }
                    })()}
                    <button
                      onClick={() => setDateFilter("all")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Templates List
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {processedTemplates.length} of {templates.length} templates
            </div>
          </CardTitle>
          <CardDescription>
            All construction templates and their assembly compositions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first template.
              </p>
            </div>
          ) : processedTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTemplates.length === processedTemplates.length && processedTemplates.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="min-w-[150px]">
                        <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                          Name
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="min-w-[150px]">Description</TableHead>
                      <TableHead className="min-w-[100px]">Documents</TableHead>
                      <TableHead className="min-w-[120px]">Assemblies</TableHead>
                      <TableHead className="min-w-[100px]">Projects</TableHead>
                      <TableHead className="min-w-[120px]">Est. Cost</TableHead>
                      <TableHead className="min-w-[100px]">
                        <Button variant="ghost" onClick={() => handleSort("createdAt")} className="h-auto p-0 font-semibold">
                          Created
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTemplates.includes(template.id)}
                            onCheckedChange={(checked) => handleSelectTemplate(template.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {template.description ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setIsDescriptionDialogOpen(true);
                                    }}
                                    className="text-left hover:text-primary transition-colors truncate block w-full"
                                  >
                                    {template.description}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p>Click for show details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {template.docs && template.docs.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsTemplateDocumentsDialogOpen(true);
                              }}
                              className="h-auto p-1 text-xs hover:bg-muted"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {template.docs.length} docs
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              0 docs
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {template.assemblies.length} assemblies
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.projects.length} projects
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(calculateEstimatedCost(template))}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="left" align="start">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setIsDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/templates/edit/${template.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => exportToCSV()}>
                                <Download className="mr-2 h-4 w-4" />
                                Export CSV
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(template.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {processedTemplates.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(processedTemplates.length / pageSize)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(processedTemplates.length / pageSize)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Export CSV Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto sm:w-[90vw] md:w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              Export Templates CSV
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Choose the export format for your template data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <Button
                onClick={exportTemplatesBasic}
                className="w-full justify-start h-auto p-3 sm:p-4 text-left"
                variant="outline"
              >
                <div>
                  <div className="font-medium text-sm sm:text-base">Basic Template List</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Export template names, descriptions, and basic statistics
                  </div>
                </div>
              </Button>

              <Button
                onClick={exportTemplatesWithAssemblies}
                className="w-full justify-start h-auto p-3 sm:p-4 text-left"
                variant="outline"
              >
                <div>
                  <div className="font-medium text-sm sm:text-base">Templates with Assembly Details</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Include assembly breakdown for each template
                  </div>
                </div>
              </Button>

              <Button
                onClick={exportTemplatesWithMaterials}
                className="w-full justify-start h-auto p-3 sm:p-4 text-left"
                variant="outline"
              >
                <div>
                  <div className="font-medium text-sm sm:text-base">Complete Breakdown (Templates + Materials)</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Full details including all assembly materials
                  </div>
                </div>
              </Button>

              <Button
                onClick={exportConsolidatedMaterials}
                className="w-full justify-start h-auto p-3 sm:p-4 text-left"
                variant="outline"
              >
                <div>
                  <div className="font-medium text-sm sm:text-base">Consolidated Materials per Template</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Export separate CSV files for each template with consolidated materials
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Details: "{selectedTemplate?.name}"
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Detailed breakdown of assemblies and materials in this template</span>
              <Button variant="outline" size="sm" onClick={exportTemplateDetailsToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedTemplate?.assemblies.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Assemblies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedTemplate ? formatCurrency(calculateEstimatedCost(selectedTemplate)) : formatCurrency(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedTemplate?.projects.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedTemplate?.description ? (
                    <button
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setIsDescriptionDialogOpen(true);
                      }}
                      className="hover:underline text-left"
                      title="Click to view full description"
                    >
                      {selectedTemplate.description.length > 20
                        ? `${selectedTemplate.description.substring(0, 20)}...`
                        : selectedTemplate.description
                      }
                    </button>
                  ) : (
                    "No description"
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTemplate?.description ? "Description (click to expand)" : "Description"}
                </div>
              </div>
            </div>

            {/* Assemblies Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8 text-xs font-medium">#</TableHead>
                      <TableHead className="text-xs font-medium">Assembly Name</TableHead>
                      <TableHead className="text-xs font-medium">Description</TableHead>
                      <TableHead className="text-xs font-medium">Quantity</TableHead>
                      <TableHead className="text-xs font-medium">Materials Count</TableHead>
                      <TableHead className="text-xs font-medium text-right">Unit Cost</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total Cost</TableHead>
                      <TableHead className="text-xs font-medium text-right">% of Template</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTemplate?.assemblies.map((templateAssembly, index) => {
                      const assembly = templateAssembly.assembly;
                      const quantity = Number(templateAssembly.quantity);

                      // Calculate assembly unit cost (cost of all materials in assembly)
                      const assemblyUnitCost = assembly.materials.reduce((total, am) => {
                        return total + (Number(am.material.price) * Number(am.quantity));
                      }, 0);

                      // Calculate total cost for this assembly in template
                      const totalCost = assemblyUnitCost * quantity;

                      // Calculate percentage of total template cost
                      const templateTotalCost = selectedTemplate ? calculateEstimatedCost(selectedTemplate) : 1;
                      const percentage = templateTotalCost > 0 ? (totalCost / templateTotalCost) * 100 : 0;

                      return (
                        <TableRow key={templateAssembly.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedAssembly(assembly);
                                setIsAssemblyDetailsDialogOpen(true);
                              }}
                              className="hover:text-primary hover:underline text-left"
                              title="Click to view assembly materials"
                            >
                              {assembly.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate">
                            {assembly.description || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge variant="outline" className="text-xs">
                              {quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Badge variant="secondary" className="text-xs">
                              {assembly.materials.length} materials
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right text-blue-600">
                            {formatCurrency(assemblyUnitCost)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium text-green-600">
                            {formatCurrency(totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-medium">
                                {percentage.toFixed(1)}%
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Documents Section */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="font-medium">Documents</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate?.docs?.length || 0} files
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedTemplate && handleMergePdfs(selectedTemplate)}
                      disabled={isMergingPdfs || !selectedTemplate?.assemblies?.length}
                    >
                      {isMergingPdfs ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Merging...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Merge PDFs
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      id={`file-upload-${selectedTemplate?.id}`}
                      className="hidden"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!selectedTemplate || files.length === 0) return;

                        for (const file of files) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('templateId', selectedTemplate.id.toString());

                          try {
                            const response = await fetch('/api/templates/upload', {
                              method: 'POST',
                              body: formData,
                            });

                            if (response.ok) {
                              toast({
                                title: "Document uploaded",
                                description: `"${file.name}" has been uploaded successfully`,
                              });
                              fetchTemplates();
                            } else {
                              const error = await response.json();
                              toast({
                                title: "Upload failed",
                                description: error.error || "Failed to upload document",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Upload failed",
                              description: "Network error occurred",
                              variant: "destructive",
                            });
                          }
                        }
                        // Reset input
                        e.target.value = '';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`file-upload-${selectedTemplate?.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              {selectedTemplate?.docs && selectedTemplate.docs.length > 0 ? (
                <div className="divide-y">
                  {selectedTemplate.docs.map((doc: DocumentFile, index: number) => {
                    const isMergedPdf = doc.name.startsWith('Merged PDFs -');

                    return (
                      <div key={doc.url} className="p-3 flex items-center justify-between hover:bg-muted/30 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <File className="h-8 w-8 text-muted-foreground" />
                            {isMergedPdf && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                ✓
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {doc.name}
                              {isMergedPdf && (
                                <Badge variant="secondary" className="text-xs">
                                  Merged PDF
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(doc.size / 1024).toFixed(1)} KB • {doc.type} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download {doc.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    window.open(doc.url, '_blank');
                                  }}
                                  className="hover:bg-green-50 hover:text-green-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View in browser</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

                                    try {
                                      const response = await fetch('/api/templates/upload', {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          templateId: selectedTemplate.id,
                                          fileUrl: doc.url,
                                        }),
                                      });

                                      if (response.ok) {
                                        toast({
                                          title: "Document deleted",
                                          description: `"${doc.name}" has been removed`,
                                        });
                                        fetchTemplates();
                                      } else {
                                        const error = await response.json();
                                        toast({
                                          title: "Delete failed",
                                          description: error.error || "Failed to delete document",
                                          variant: "destructive",
                                        });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Delete failed",
                                        description: "Network error occurred",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete document</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Upload" to add documents to this template</p>
                </div>
              )}
            </div>

            {/* Summary Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {selectedTemplate?.assemblies.length || 0} assemblies in this template
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Total Cost:</span>
                <span className="text-lg font-bold text-green-600">
                  {selectedTemplate ? formatCurrency(calculateEstimatedCost(selectedTemplate)) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="destructive"
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setTemplateToDelete(null);
        }}
        destructive
      />

      {/* Description Dialog */}
      <Dialog open={isDescriptionDialogOpen} onOpenChange={setIsDescriptionDialogOpen}>
        <DialogContent className="max-w-2xl w-full mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Template Description
            </DialogTitle>
            <DialogDescription className="text-sm">
              Full description for "{selectedTemplate?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 sm:p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm sm:text-base">
                {selectedTemplate?.description || "No description available."}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedTemplate?.description) {
                    navigator.clipboard.writeText(selectedTemplate.description).then(() => {
                      toast({
                        title: "Copied!",
                        description: "Description copied to clipboard",
                      });
                    }).catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to copy description",
                        variant: "destructive",
                      });
                    });
                  }
                }}
                disabled={!selectedTemplate?.description}
                className="w-full sm:w-auto"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Description
              </Button>
              <Button onClick={() => setIsDescriptionDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assembly Details Dialog */}
      <Dialog open={isAssemblyDetailsDialogOpen} onOpenChange={setIsAssemblyDetailsDialogOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Assembly Materials: "{selectedAssembly?.name}"
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>Detailed breakdown of materials in this assembly</span>
              <Button variant="outline" size="sm" onClick={() => {
                if (!selectedAssembly) return;

                const headers = ["Material Name", "Part Number", "Manufacturer", "Unit", "Quantity", "Unit Price", "Total Cost"];
                const csvContent = [
                  headers.join(","),
                  ...selectedAssembly.materials.map(material => [
                    `"${material.material.name}"`,
                    `"${material.material.partNumber || ""}"`,
                    `"${material.material.manufacturer || ""}"`,
                    material.material.unit,
                    Number(material.quantity),
                    material.material.price,
                    Number(material.material.price) * Number(material.quantity)
                  ].join(","))
                ].join("\n");

                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedAssembly.name.replace(/[^a-zA-Z0-9]/g, '_')}_materials.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assembly Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {selectedAssembly?.materials.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Materials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {selectedAssembly ? formatCurrency(
                    selectedAssembly.materials.reduce((total, am) => {
                      return total + (Number(am.material.price) * Number(am.quantity));
                    }, 0)
                  ) : formatCurrency(0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cost</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedAssembly ? Math.round(
                    selectedAssembly.materials.reduce((total, am) => {
                      return total + (Number(am.material.price) * Number(am.quantity));
                    }, 0) / (selectedAssembly.materials.length || 1)
                  ) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg per Material</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedAssembly?.description ? (
                    <button
                      onClick={() => {
                        setIsAssemblyDetailsDialogOpen(false);
                        setIsDescriptionDialogOpen(true);
                      }}
                      className="hover:underline text-left text-sm"
                      title="Click to view full description"
                    >
                      {selectedAssembly.description.length > 15
                        ? `${selectedAssembly.description.substring(0, 15)}...`
                        : selectedAssembly.description
                      }
                    </button>
                  ) : (
                    "No description"
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedAssembly?.description ? "Description (click)" : "Description"}
                </div>
              </div>
            </div>

            {/* Materials Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-8 text-xs font-medium">#</TableHead>
                      <TableHead className="text-xs font-medium">Material Name</TableHead>
                      <TableHead className="text-xs font-medium">Part Number</TableHead>
                      <TableHead className="text-xs font-medium">Manufacturer</TableHead>
                      <TableHead className="text-xs font-medium">Unit</TableHead>
                      <TableHead className="text-xs font-medium text-right">Quantity</TableHead>
                      <TableHead className="text-xs font-medium text-right">Unit Price</TableHead>
                      <TableHead className="text-xs font-medium text-right">Total Cost</TableHead>
                      <TableHead className="text-xs font-medium text-right">% of Assembly</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAssembly?.materials.map((assemblyMaterial, index) => {
                      const totalCost = Number(assemblyMaterial.material.price) * Number(assemblyMaterial.quantity);
                      const assemblyTotalCost = selectedAssembly ? selectedAssembly.materials.reduce((total, am) => {
                        return total + (Number(am.material.price) * Number(am.quantity));
                      }, 0) : 1;
                      const percentage = assemblyTotalCost > 0 ? (totalCost / assemblyTotalCost) * 100 : 0;

                      return (
                        <TableRow key={assemblyMaterial.id} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {assemblyMaterial.material.name}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {assemblyMaterial.material.partNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {assemblyMaterial.material.manufacturer || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {assemblyMaterial.material.unit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            {Number(assemblyMaterial.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-right text-blue-600">
                            {formatCurrency(assemblyMaterial.material.price)}
                          </TableCell>
                          <TableCell className="text-sm text-right font-medium text-green-600">
                            {formatCurrency(totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-medium">
                                {percentage.toFixed(1)}%
                              </span>
                              <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {selectedAssembly?.materials.length || 0} materials in this assembly
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Total Cost:</span>
                <span className="text-lg font-bold text-green-600">
                  {selectedAssembly ? formatCurrency(
                    selectedAssembly.materials.reduce((total, am) => {
                      return total + (Number(am.material.price) * Number(am.quantity));
                    }, 0)
                  ) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        type="destructive"
        title="Delete Multiple Templates"
        description={`Are you sure you want to delete ${selectedTemplates.length} selected templates? This action cannot be undone. Templates that are used in projects will not be deleted.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteDialogOpen(false)}
        destructive
      />

      {/* Template Documents Dialog */}
      <Dialog open={isTemplateDocumentsDialogOpen} onOpenChange={setIsTemplateDocumentsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden sm:w-[90vw] md:w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Template Documents: "{selectedTemplate?.name}"
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              All documents uploaded to this template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Documents List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Documents ({selectedTemplate?.docs?.length || 0})</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id={`template-doc-upload-${selectedTemplate?.id}`}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!selectedTemplate || files.length === 0) return;

                      for (const file of files) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('templateId', selectedTemplate.id.toString());

                        try {
                          const response = await fetch('/api/templates/upload', {
                            method: 'POST',
                            body: formData,
                          });

                          if (response.ok) {
                            toast({
                              title: "Document uploaded",
                              description: `"${file.name}" has been uploaded successfully`,
                            });
                            fetchTemplates();
                          } else {
                            const error = await response.json();
                            toast({
                              title: "Upload failed",
                              description: error.error || "Failed to upload document",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Upload failed",
                            description: "Network error occurred",
                            variant: "destructive",
                          });
                        }
                      }
                      // Reset input
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById(`template-doc-upload-${selectedTemplate?.id}`)?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {selectedTemplate?.docs && selectedTemplate.docs.length > 0 ? (
                  <div className="divide-y">
                    {selectedTemplate.docs.map((doc: DocumentFile, index: number) => {
                      const isMergedPdf = doc.name.startsWith('Merged PDFs -');

                      return (
                        <div key={doc.url} className="p-4 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
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
                                <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
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
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Download {doc.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        window.open(doc.url, '_blank');
                                      }}
                                      className="hover:bg-green-50 hover:text-green-600"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View in browser</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

                                        try {
                                          const response = await fetch('/api/templates/upload', {
                                            method: 'DELETE',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                              templateId: selectedTemplate.id,
                                              fileUrl: doc.url,
                                            }),
                                          });

                                          if (response.ok) {
                                            toast({
                                              title: "Document deleted",
                                              description: `"${doc.name}" has been removed`,
                                            });
                                            fetchTemplates();
                                            setIsTemplateDocumentsDialogOpen(false);
                                          } else {
                                            const error = await response.json();
                                            toast({
                                              title: "Delete failed",
                                              description: error.error || "Failed to delete document",
                                              variant: "destructive",
                                            });
                                          }
                                        } catch (error) {
                                          toast({
                                            title: "Delete failed",
                                            description: "Network error occurred",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete document</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <File className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents uploaded</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This template doesn't have any documents yet. Upload some documents to get started.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById(`template-doc-upload-${selectedTemplate?.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {selectedTemplate?.docs && selectedTemplate.docs.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{selectedTemplate.docs.length}</div>
                    <div className="text-muted-foreground">Total Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {selectedTemplate.docs.filter(doc => doc.name.startsWith('Merged PDFs -')).length}
                    </div>
                    <div className="text-muted-foreground">Merged PDFs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {(selectedTemplate.docs.reduce((sum, doc) => sum + doc.size, 0) / 1024).toFixed(1)} KB
                    </div>
                    <div className="text-muted-foreground">Total Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {new Date(Math.max(...selectedTemplate.docs.map(doc => new Date(doc.uploadedAt).getTime()))).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">Last Upload</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button onClick={() => setIsTemplateDocumentsDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Order Dialog */}
      <Dialog open={isPdfOrderDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsPdfOrderDialogOpen(false);
          setPdfOrder([]);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden sm:w-[90vw] md:w-[80vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Set PDF Merge Order
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Arrange the order of assemblies for PDF merging. The first assembly will appear first in the merged PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Progress Indicator */}
            {isMergingPdfs && mergeProgress && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {mergeProgress.stage}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300">{mergeProgress.message}</span>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">{mergeProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${mergeProgress.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Assembly Order List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Assembly Order for PDF Merge</h3>
                <span className="text-xs text-muted-foreground">
                  {pdfOrder.length} assemblies selected
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                {selectedTemplate && selectedTemplate.assemblies
                  .filter(ta => {
                    const docs = Array.isArray(ta.assembly.docs) ? ta.assembly.docs : [];
                    return docs.some((doc: any) =>
                      doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf')
                    );
                  })
                  .sort((a, b) => {
                    const aIndex = pdfOrder.indexOf(a.assemblyId);
                    const bIndex = pdfOrder.indexOf(b.assemblyId);
                    if (aIndex === -1 && bIndex === -1) return 0;
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                  })
                  .map((templateAssembly, index) => {
                    const assembly = templateAssembly.assembly;
                    const docs = Array.isArray(assembly.docs) ? assembly.docs : [];
                    const pdfCount = docs.filter((doc: any) =>
                      doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf')
                    ).length;

                    return (
                      <div
                        key={templateAssembly.assemblyId}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                      >
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentIndex = pdfOrder.indexOf(templateAssembly.assemblyId);
                              if (currentIndex > 0) {
                                const newOrder = [...pdfOrder];
                                [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
                                setPdfOrder(newOrder);
                              }
                            }}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const currentIndex = pdfOrder.indexOf(templateAssembly.assemblyId);
                              if (currentIndex < pdfOrder.length - 1) {
                                const newOrder = [...pdfOrder];
                                [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
                                setPdfOrder(newOrder);
                              }
                            }}
                            disabled={index === pdfOrder.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{assembly.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pdfCount} PDF file{pdfCount !== 1 ? 's' : ''} • {templateAssembly.quantity}x quantity
                          </div>
                        </div>

                        <Badge variant="secondary" className="text-xs">
                          {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    );
                  })}
              </div>

              {/* Summary */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Total assemblies to merge:</span>
                  <span className="font-medium">{pdfOrder.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span>Estimated total PDF files:</span>
                  <span className="font-medium">
                    {selectedTemplate ? selectedTemplate.assemblies
                      .filter(ta => pdfOrder.includes(ta.assemblyId))
                      .reduce((total, ta) => {
                        const docs = Array.isArray(ta.assembly.docs) ? ta.assembly.docs : [];
                        const pdfCount = docs.filter((doc: any) =>
                          doc.type === 'application/pdf' || doc.name?.toLowerCase().endsWith('.pdf')
                        ).length;
                        return total + pdfCount;
                      }, 0) : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPdfOrderDialogOpen(false);
                  setPdfOrder([]);
                }}
                disabled={isMergingPdfs}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmMergePdfs}
                disabled={isMergingPdfs || pdfOrder.length < 2}
                className="w-full sm:w-auto"
              >
                {isMergingPdfs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Merging PDFs...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Start PDF Merge
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
