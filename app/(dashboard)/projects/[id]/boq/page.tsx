"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Download,
  FileText,
  Calculator,
  Package,
  Building,
  DollarSign,
  BarChart3,
  Settings,
  Eye,
  Copy,
  CheckCircle,
  FolderOpen,
  Users,
  MapPin,
  Calendar,
  Edit,
  History
} from "lucide-react";


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
  module: 'ELECTRONIC' | 'ELECTRICAL' | 'ASSEMBLY' | 'INSTALLATION' | 'MECHANICAL';
}

interface TemplateAssembly {
  id?: number;
  assemblyId: number;
  quantity: number;
  assembly: Assembly;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  assemblies: TemplateAssembly[];
  createdAt: string;
  updatedAt: string;
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

interface BOQItem {
  no: string;
  manufacturer: string;
  partNumber: string;
  item: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  assemblyName: string;
  isModuleHeader?: boolean;
  isAssemblyHeader?: boolean;
  assemblyId?: number;
  materialId?: number;
}

export default function ProjectBOQPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const projectId = params.id as string;

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch project data",
          variant: "destructive",
        });
        router.push("/projects");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project data",
        variant: "destructive",
      });
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  };



  // Use useMemo to generate BOQ data - prevents infinite re-renders
  const boqData = useMemo(() => {
    if (!project) return [];

    // Check if project has a template
    if (!project.template) {
      return [];
    }

    // Check if template has assemblies
    if (!project.template.assemblies || !Array.isArray(project.template.assemblies)) {
      return [];
    }

    const boqItems: BOQItem[] = [];

    // Define module order as requested
    const moduleOrder: Array<'ELECTRONIC' | 'ELECTRICAL' | 'INSTALLATION' | 'MECHANICAL' | 'ASSEMBLY'> =
      ['ELECTRONIC', 'ELECTRICAL', 'INSTALLATION', 'MECHANICAL', 'ASSEMBLY'];

    // Group assemblies by module
    const assembliesByModule: Record<string, TemplateAssembly[]> = {};
    project.template.assemblies.forEach((templateAssembly) => {
      if (!templateAssembly || !templateAssembly.assembly) return;

      const module = templateAssembly.assembly.module;
      if (!assembliesByModule[module]) {
        assembliesByModule[module] = [];
      }
      assembliesByModule[module].push(templateAssembly);
    });

    let moduleNumber = 1;

    // Process modules in the specified order
    moduleOrder.forEach((moduleName) => {
      const assemblies = assembliesByModule[moduleName];
      if (!assemblies || assemblies.length === 0) return;

      // Add module header
      boqItems.push({
        no: moduleNumber.toString(),
        manufacturer: "",
        partNumber: "",
        item: `${moduleName} MODULE`,
        qty: 0,
        unit: "",
        unitPrice: 0,
        totalPrice: 0,
        assemblyName: "",
        isModuleHeader: true
      });

      let assemblyNumber = 1;

      // Process assemblies in this module
      assemblies.forEach((templateAssembly) => {
        if (!templateAssembly || !templateAssembly.assembly) return;

        const assembly = templateAssembly.assembly;
        const assemblyQuantity = Number(templateAssembly.quantity);

        // Add assembly header row
        boqItems.push({
          no: `${moduleNumber}.${assemblyNumber}`,
          manufacturer: "-",
          partNumber: "-",
          item: assembly.name,
          qty: assemblyQuantity,
          unit: "Assembly",
          unitPrice: assembly.materials && Array.isArray(assembly.materials) ? assembly.materials.reduce((total, am) => {
            return total + (Number(am.material?.price || 0) * Number(am.quantity || 0));
          }, 0) : 0,
          totalPrice: assembly.materials && Array.isArray(assembly.materials) ? assembly.materials.reduce((total, am) => {
            return total + (Number(am.material?.price || 0) * Number(am.quantity || 0));
          }, 0) * assemblyQuantity : 0,
          assemblyName: assembly.name,
          isAssemblyHeader: true,
          assemblyId: templateAssembly.assemblyId
        });

        // Add material rows for this assembly
        if (assembly.materials && Array.isArray(assembly.materials)) {
          assembly.materials.forEach((assemblyMaterial, materialIndex) => {
            if (!assemblyMaterial || !assemblyMaterial.material) return;

            const material = assemblyMaterial.material;
            const materialQuantity = Number(assemblyMaterial.quantity || 0) * assemblyQuantity;
            const materialPrice = Number(material.price || 0);

            boqItems.push({
              no: `${moduleNumber}.${assemblyNumber}.${materialIndex + 1}`,
              manufacturer: material.manufacturer || "",
              partNumber: material.partNumber || "",
              item: material.name || "",
              qty: materialQuantity,
              unit: material.unit || "",
              unitPrice: materialPrice,
              totalPrice: materialQuantity * materialPrice,
              assemblyName: assembly.name,
              materialId: material.id
            });
          });
        }

        assemblyNumber++;
      });

      moduleNumber++;
    });

    return boqItems;
  }, [project]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const exportToCSV = () => {
    if (!project || boqData.length === 0) return;

    const headers = ["No", "Manufactur", "PN", "Item", "Qty", "Unit", "Unit Price", "Total Price", "Assembly Name"];

    const csvContent = [
      `BILL OF QUANTITY - ${project.name.toUpperCase()}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Project Description: ${project.description || "No description"}`,
      `Client: ${project.client ? (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson) : 'No client'}`,
      `Location: ${project.location || 'Not specified'}`,
      `Template: ${project.template?.name || 'No template'}`,
      `Total Assemblies: ${project.template?.assemblies?.length || 0}`,
      `Total Estimated Cost: ${formatCurrency(Number(project.totalPrice))}`,
      "",
      headers.join(","),
      ...boqData.map(item => [
        item.no,
        `"${item.manufacturer}"`,
        `"${item.partNumber}"`,
        `"${item.item}"`,
        item.qty,
        item.unit,
        item.unitPrice,
        item.totalPrice,
        `"${item.assemblyName}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_BOQ.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "BOQ Exported",
      description: "Bill of Quantity has been exported to CSV",
    });
  };

  const copyToClipboard = async () => {
    if (!project || boqData.length === 0) return;

    const text = [
      `BILL OF QUANTITY - ${project.name}`,
      `Generated on: ${new Date().toLocaleString()}`,
      "",
      "No\tManufactur\tPN\tItem\tQty\tUnit\tUnit Price\tTotal Price\tAssembly Name",
      ...boqData.map(item =>
        `${item.no}\t${item.manufacturer}\t${item.partNumber}\t${item.item}\t${item.qty}\t${item.unit}\t${item.unitPrice}\t${item.totalPrice}\t${item.assemblyName}`
      )
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "BOQ data has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportCombinedCSV = () => {
    if (!project || !project.template) return;

    // Create a map to consolidate materials
    const materialMap = new Map<string, {
      name: string;
      partNumber: string;
      manufacturer: string;
      unit: string;
      unitPrice: number;
      totalQuantity: number;
      totalCost: number;
      assemblies: string[];
    }>();

    // Process all assemblies and their materials
    project.template.assemblies.forEach((templateAssembly) => {
      if (!templateAssembly || !templateAssembly.assembly) return;

      const assembly = templateAssembly.assembly;
      const assemblyQuantity = Number(templateAssembly.quantity);

      if (assembly.materials && Array.isArray(assembly.materials)) {
        assembly.materials.forEach((assemblyMaterial) => {
          if (!assemblyMaterial || !assemblyMaterial.material) return;

          const material = assemblyMaterial.material;
          const materialQuantity = Number(assemblyMaterial.quantity || 0) * assemblyQuantity;

          // Create unique key for material consolidation
          const materialKey = `${material.name}_${material.partNumber || ''}_${material.manufacturer || ''}_${material.unit}`;

          if (materialMap.has(materialKey)) {
            // Update existing material
            const existing = materialMap.get(materialKey)!;
            existing.totalQuantity += materialQuantity;
            existing.totalCost += materialQuantity * Number(material.price || 0);
            if (!existing.assemblies.includes(assembly.name)) {
              existing.assemblies.push(assembly.name);
            }
          } else {
            // Add new material
            materialMap.set(materialKey, {
              name: material.name || '',
              partNumber: material.partNumber || '',
              manufacturer: material.manufacturer || '',
              unit: material.unit || '',
              unitPrice: Number(material.price || 0),
              totalQuantity: materialQuantity,
              totalCost: materialQuantity * Number(material.price || 0),
              assemblies: [assembly.name]
            });
          }
        });
      }
    });

    // Convert map to array for CSV export
    const consolidatedMaterials = Array.from(materialMap.values());

    const headers = ["No", "Manufacturer", "Part Number", "Item", "Total Qty", "Unit", "Unit Price", "Total Cost", "Used in Assemblies"];

    const csvContent = [
      `CONSOLIDATED BILL OF QUANTITY - ${project.name.toUpperCase()}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `Project Description: ${project.description || "No description"}`,
      `Client: ${project.client ? (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson) : 'No client'}`,
      `Location: ${project.location || 'Not specified'}`,
      `Template: ${project.template?.name || 'No template'}`,
      `Unique Materials: ${consolidatedMaterials.length}`,
      `Total Estimated Cost: ${formatCurrency(Number(project.totalPrice))}`,
      "",
      headers.join(","),
      ...consolidatedMaterials.map((material, index) => [
        index + 1,
        `"${material.manufacturer}"`,
        `"${material.partNumber}"`,
        `"${material.name}"`,
        material.totalQuantity,
        material.unit,
        material.unitPrice,
        material.totalCost,
        `"${material.assemblies.join('; ')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_Combined_BOQ.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Combined BOQ Exported",
      description: "Consolidated Bill of Quantity has been exported to CSV",
    });
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

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          <p className="text-gray-500 mt-2">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!project.template) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Template Available</h2>
          <p className="text-gray-500 mt-2">This project doesn't have a template. BOQ can only be generated for projects based on templates.</p>
          <Button onClick={() => router.push(`/projects/${project.id}`)} className="mt-4">
            Back to Project Details
          </Button>
        </div>
      </div>
    );
  }

  const totalCost = boqData.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalMaterials = boqData.filter(item => !item.item.startsWith('ASSEMBLY:')).length;
  const totalAssemblies = project.template?.assemblies?.length || 0;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/projects")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="truncate">Bill of Quantity</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {project.name} - Complete material breakdown
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download BOQ
          </Button>
          <Button
            onClick={exportCombinedCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Combined BOQ
          </Button>
        </div>
      </div>

      {/* Project Information Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Project Name</CardTitle>
            <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-base font-bold truncate">{project.name}</div>
            <p className="text-xs text-muted-foreground truncate">
              {project.projectType || 'No type specified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Client</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-base font-bold truncate">
              {project.client ?
                (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson)
                : 'No client'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {project.client?.contactEmail || ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Location</CardTitle>
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-base font-bold truncate">
              {project.location || 'Not specified'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {project.area ? `${project.area} m²` : 'No area specified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Template</CardTitle>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-sm sm:text-base font-bold truncate">
              {project.template.name}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {totalAssemblies} assemblies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Assemblies</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{totalAssemblies}</div>
            <p className="text-xs text-muted-foreground truncate">
              Work packages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Materials</CardTitle>
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{totalMaterials}</div>
            <p className="text-xs text-muted-foreground truncate">
              Individual items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Items</CardTitle>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold">{boqData.length}</div>
            <p className="text-xs text-muted-foreground truncate">
              Rows in BOQ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate">Total Cost</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground truncate">
              Estimated total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BOQ Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complete Bill of Quantity
          </CardTitle>
          <CardDescription>
            Detailed breakdown of all materials required for project "{project.name}" based on template "{project.template.name}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-12 text-xs font-medium">#</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-medium">Manufacturer</TableHead>
                    <TableHead className="min-w-[100px] text-xs font-medium">Part Number</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-medium">Item</TableHead>
                    <TableHead className="min-w-[80px] text-xs font-medium text-right">Qty</TableHead>
                    <TableHead className="min-w-[60px] text-xs font-medium">Unit</TableHead>
                    <TableHead className="min-w-[100px] text-xs font-medium text-right">Unit Price</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-medium text-right">Total Price</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-medium">Assembly Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boqData.map((item, index) => {
                    const isModuleHeader = item.isModuleHeader;
                    const isAssemblyHeader = item.isAssemblyHeader;

                    return (
                      <TableRow
                        key={`${item.no}-${index}`}
                        className={`${
                          isModuleHeader
                            ? 'bg-purple-50 dark:bg-purple-950/20 border-t-4 border-purple-200 dark:border-purple-800 font-semibold'
                            : isAssemblyHeader
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-t-2 border-blue-200 dark:border-blue-800'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <TableCell className={`text-xs font-mono ${
                          isModuleHeader ? 'text-purple-900 dark:text-purple-100 font-bold' :
                          isAssemblyHeader ? 'text-blue-900 dark:text-blue-100 font-semibold' :
                          'text-muted-foreground'
                        }`}>
                          {item.no}
                        </TableCell>
                        <TableCell className="text-xs">
                          {item.manufacturer === "-" || isModuleHeader ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            item.manufacturer || <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {item.partNumber === "-" || isModuleHeader ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            item.partNumber || <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm ${
                          isModuleHeader ? 'font-bold text-purple-900 dark:text-purple-100' :
                          isAssemblyHeader ? 'font-semibold text-blue-900 dark:text-blue-100' : ''
                        }`}>
                          {isModuleHeader ? (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              {item.item}
                            </div>
                          ) : isAssemblyHeader ? (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-blue-600" />
                              {item.item}
                            </div>
                          ) : (
                            item.item
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono">
                          {isModuleHeader ? '-' : (
                            <span>{item.qty.toLocaleString()}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isModuleHeader ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {item.unit}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-blue-600">
                          {isModuleHeader || item.unitPrice === 0 ? '-' : (
                            <span>{formatCurrency(item.unitPrice)}</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-sm text-right font-medium ${
                          isModuleHeader ? 'text-purple-700 dark:text-purple-300 font-bold' :
                          isAssemblyHeader ? 'text-blue-700 dark:text-blue-300' :
                          'text-green-600'
                        }`}>
                          {isModuleHeader ? '-' : formatCurrency(item.totalPrice)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isModuleHeader ? '-' : item.assemblyName}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {boqData.length} items in the Bill of Quantity
            </div>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="font-medium">Total Materials:</span> {totalMaterials}
              </div>
              <div className="text-sm">
                <span className="font-medium">Total Assemblies:</span> {totalAssemblies}
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(totalCost)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Name:</span>
                  <span className="font-medium">{project.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Type:</span>
                  <span>{project.projectType || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {project.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress:</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Client & Location</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">
                    {project.client ?
                      (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson)
                      : 'No client'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{project.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area:</span>
                  <span>{project.area ? `${project.area} m²` : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span>{project.budget ? formatCurrency(Number(project.budget)) : 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
