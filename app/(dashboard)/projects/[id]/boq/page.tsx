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
  Package,
  Building,
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
  History,
  FileSpreadsheet
} from "lucide-react";
import { exportToExcel } from "@/lib/excel";


interface Material {
  id: number;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
}

interface AssemblyMaterial {
  id?: string;
  externalId: string;
  name: string;
  partNumber: string | null;
  manufacturer: string | null;
  unit: string;
  quantity: number;
}

interface Assembly {
  id: number;
  name: string;
  description: string | null;
  materials: AssemblyMaterial[];
  category: { id: number; name: string; color: string | null };
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
  partDesc?: string;
  item: string;
  qty: number;
  unit: string;
  assemblyName: string;
  categoryName: string;
  isModuleHeader?: boolean;
  isAssemblyHeader?: boolean;
  assemblyId?: number;
  externalId?: string;
}

export default function ProjectBOQPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'breakdown' | 'consolidated'>('breakdown');
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
    if (!project || !project.template || !project.template.assemblies) return [];

    const boqItems: BOQItem[] = [];
    const moduleOrder: Array<'ELECTRONIC' | 'ELECTRICAL' | 'INSTALLATION' | 'MECHANICAL' | 'ASSEMBLY'> =
      ['ELECTRONIC', 'ELECTRICAL', 'INSTALLATION', 'MECHANICAL', 'ASSEMBLY'];

    const assembliesByModule: Record<string, TemplateAssembly[]> = {};
    project.template.assemblies.forEach((ta) => {
      const module = ta.assembly.module;
      if (!assembliesByModule[module]) assembliesByModule[module] = [];
      assembliesByModule[module].push(ta);
    });

    let moduleNumber = 1;
    moduleOrder.forEach((moduleName) => {
      const assemblies = assembliesByModule[moduleName];
      if (!assemblies || assemblies.length === 0) return;

      boqItems.push({
        no: moduleNumber.toString(),
        manufacturer: "",
        partNumber: "",
        partDesc: "",
        item: `${moduleName} MODULE`,
        qty: 0,
        unit: "",
        assemblyName: "",
        categoryName: "",
        isModuleHeader: true
      });

      let assemblyNumber = 1;
      assemblies.forEach((ta) => {
        const assembly = ta.assembly;
        const assemblyQty = Number(ta.quantity);

        boqItems.push({
          no: `${moduleNumber}.${assemblyNumber}`,
          manufacturer: "-",
          partNumber: "-",
          partDesc: assembly.description || "-",
          item: assembly.name,
          qty: assemblyQty,
          unit: "Assembly",
          assemblyName: assembly.name,
          categoryName: assembly.category?.name || "",
          isAssemblyHeader: true,
          assemblyId: ta.assemblyId
        });

        if (assembly.materials && Array.isArray(assembly.materials)) {
          assembly.materials.forEach((am, mIdx) => {
            const totalQty = Number(am.quantity || 0) * assemblyQty;
            boqItems.push({
              no: `${moduleNumber}.${assemblyNumber}.${mIdx + 1}`,
              manufacturer: am.manufacturer || "",
              partNumber: am.partNumber || "",
              partDesc: (am as any).partDesc || "",
              item: am.name || "",
              qty: totalQty,
              unit: am.unit || "",
              assemblyName: assembly.name,
              categoryName: assembly.category?.name || "",
              externalId: am.externalId
            });
          });
        }
        assemblyNumber++;
      });
      moduleNumber++;
    });

    return boqItems;
  }, [project]);

  const consolidatedData = useMemo(() => {
    if (!project || !project.template) return { typical: [], installation: [] };

    const typicalMap = new Map<string, {
      name: string;
      partNumber: string;
      partDesc: string;
      manufacturer: string;
      unit: string;
      totalQuantity: number;
      assemblies: string[];
    }>();

    const installation: Array<{
      name: string;
      partNumber: string;
      partDesc: string;
      manufacturer: string;
      unit: string;
      quantity: number;
      assemblyName: string;
    }> = [];

    project.template.assemblies.forEach((ta) => {
      const assembly = ta.assembly;
      const assemblyQty = Number(ta.quantity);
      const isInst = assembly.module === 'INSTALLATION';

      assembly.materials.forEach((am) => {
        const totalQty = Number(am.quantity) * assemblyQty;
        if (isInst) {
          installation.push({
            name: am.name,
            partNumber: am.partNumber || "",
            partDesc: (am as any).partDesc || "",
            manufacturer: am.manufacturer || "",
            unit: am.unit,
            quantity: totalQty,
            assemblyName: assembly.name
          });
        } else {
          const key = `${am.name}_${am.partNumber || ''}_${am.manufacturer || ''}_${am.unit}`;
          if (typicalMap.has(key)) {
            const existing = typicalMap.get(key)!;
            existing.totalQuantity += totalQty;
            if (!existing.assemblies.includes(assembly.name)) {
              existing.assemblies.push(assembly.name);
            }
          } else {
            typicalMap.set(key, {
              name: am.name,
              partNumber: am.partNumber || "",
              partDesc: (am as any).partDesc || "",
              manufacturer: am.manufacturer || "",
              unit: am.unit,
              totalQuantity: totalQty,
              assemblies: [assembly.name]
            });
          }
        }
      });
    });

    return {
      typical: Array.from(typicalMap.values()),
      installation
    };
  }, [project]);

  const exportToExcelHandler = () => {
    if (!project) return;

    if (viewMode === 'breakdown') {
      const headers = ["No", "Manufacturer", "Part Number", "Item", "Part Desc", "Qty", "Unit", "Category", "Assembly"];
      const data = [
        [`BILL OF QUANTITY - ${project.name.toUpperCase()}`],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        headers,
        ...boqData.map(item => [
          item.no,
          item.manufacturer,
          item.partNumber,
          item.item,
          item.partDesc,
          item.qty,
          item.unit,
          item.categoryName,
          item.assemblyName
        ])
      ];
      exportToExcel(data, `${project.name.replace(/\s+/g, '_')}_BOQ_Breakdown`);
    } else {
      const headers = ["No", "Manufacturer", "Part Number", "Item", "Part Desc", "Total Qty", "Unit", "Usage"];
      const data = [
        [`CONSOLIDATED BOQ - ${project.name.toUpperCase()}`],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        ["TYPICAL MATERIALS"],
        headers,
        ...consolidatedData.typical.map((m, i) => [
          i + 1, m.manufacturer, m.partNumber, m.name, m.partDesc, m.totalQuantity, m.unit, m.assemblies.join(', ')
        ]),
        [],
        ["INSTALLATION MATERIALS"],
        headers,
        ...consolidatedData.installation.map((m, i) => [
          `INST-${i + 1}`, m.manufacturer, m.partNumber, m.name, m.partDesc, m.quantity, m.unit, m.assemblyName
        ])
      ];
      exportToExcel(data, `${project.name.replace(/\s+/g, '_')}_BOQ_Consolidated`);
    }

    toast({
      title: "Export Success",
      description: "BOQ has been exported to Excel",
    });
  };

  const copyToClipboard = async () => {
    if (!project) return;
    const items = viewMode === 'breakdown' ? boqData : [...consolidatedData.typical, ...consolidatedData.installation];
    const text = JSON.stringify(items, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "BOQ data copied to clipboard" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
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
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Button onClick={() => router.push("/projects")} className="mt-4">Back to Projects</Button>
        </div>
      </div>
    );
  }

  if (!project.template) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold">No Template Available</h2>
          <Button onClick={() => router.push(`/projects/${project.id}`)} className="mt-4">Back to Project</Button>
        </div>
      </div>
    );
  }

  const totalMaterials = boqData.filter(item => !item.isAssemblyHeader && !item.isModuleHeader).length;
  const totalAssemblies = project.template?.assemblies?.length || 0;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" /> Bill of Quantity
            </h1>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted p-1 rounded-lg flex mr-2">
            <Button
              variant={viewMode === 'breakdown' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('breakdown')}
              className="text-xs h-8 px-4"
            >
              Breakdown
            </Button>
            <Button
              variant={viewMode === 'consolidated' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('consolidated')}
              className="text-xs h-8 px-4"
            >
              Consolidated
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
          <Button size="sm" onClick={exportToExcelHandler}><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">Project</CardTitle></CardHeader><CardContent><div className="text-lg font-bold truncate">{project.name}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">Client</CardTitle></CardHeader><CardContent><div className="text-lg font-bold truncate">{project.client?.companyName || project.client?.contactPerson || '-'}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">Assemblies</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalAssemblies}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase text-muted-foreground">Materials</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalMaterials}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            {viewMode === 'breakdown' ? 'Hierarchical Breakdown' : 'Consolidated Materials'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">Manufacturer</TableHead>
                    <TableHead className="text-xs">Part Number</TableHead>
                    <TableHead className="min-w-[200px] text-xs">Item Description</TableHead>
                    <TableHead className="min-w-[200px] text-xs">Part Desc</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Unit</TableHead>
                    <TableHead className="text-xs">{viewMode === 'breakdown' ? 'Assembly' : 'Usage'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'breakdown' ? (
                    boqData.map((item, idx) => {
                      if (item.isModuleHeader) return (
                        <TableRow key={idx} className="bg-slate-100 dark:bg-slate-800/50 font-bold">
                          <TableCell colSpan={8} className="text-[10px] py-2 uppercase tracking-widest">{item.item}</TableCell>
                        </TableRow>
                      );
                      if (item.isAssemblyHeader) return (
                        <TableRow key={idx} className="bg-blue-50/50 dark:bg-blue-900/10 border-t">
                          <TableCell className="text-xs font-bold text-blue-600">{item.no}</TableCell>
                          <TableCell colSpan={4} className="text-sm font-semibold">{item.item}</TableCell>
                          <TableCell className="text-right text-xs font-bold">{item.qty}</TableCell>
                          <TableCell className="text-xs">Assy</TableCell>
                          <TableCell className="text-[10px] italic text-muted-foreground">{item.categoryName}</TableCell>
                        </TableRow>
                      );
                      return (
                        <TableRow key={idx} className="hover:bg-muted/30">
                          <TableCell className="text-[10px] text-muted-foreground pl-6">{item.no.split('.').pop()}</TableCell>
                          <TableCell className="text-xs">{item.manufacturer || '-'}</TableCell>
                          <TableCell className="text-[10px] font-mono">{item.partNumber || '-'}</TableCell>
                          <TableCell className="text-xs">{item.item}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={item.partDesc}>{item.partDesc || '-'}</TableCell>
                          <TableCell className="text-right text-xs font-bold">{item.qty.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{item.unit}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.assemblyName}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <>
                      <TableRow className="bg-blue-50/50 font-bold border-l-4 border-l-blue-500">
                        <TableCell colSpan={8} className="text-xs py-2 uppercase tracking-wider text-blue-800">Typical Materials</TableCell>
                      </TableRow>
                      {consolidatedData.typical.map((m, i) => (
                        <TableRow key={`typ-${i}`} className="hover:bg-muted/30">
                          <TableCell className="text-[10px] text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-xs">{m.manufacturer || '-'}</TableCell>
                          <TableCell className="text-[10px] font-mono">{m.partNumber || '-'}</TableCell>
                          <TableCell className="text-xs font-medium">{m.name}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={m.partDesc}>{m.partDesc || '-'}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-blue-600">{m.totalQuantity.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{m.unit}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground italic">In: {m.assemblies.slice(0, 2).join(', ')}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-orange-50/50 font-bold border-l-4 border-l-orange-500 mt-4">
                        <TableCell colSpan={8} className="text-xs py-2 uppercase tracking-wider text-orange-800">Installation Materials</TableCell>
                      </TableRow>
                      {consolidatedData.installation.map((m, i) => (
                        <TableRow key={`inst-${i}`} className="hover:bg-muted/30">
                          <TableCell className="text-[10px] text-muted-foreground">INST-{i + 1}</TableCell>
                          <TableCell className="text-xs">{m.manufacturer || '-'}</TableCell>
                          <TableCell className="text-[10px] font-mono">{m.partNumber || '-'}</TableCell>
                          <TableCell className="text-xs font-medium">{m.name}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={m.partDesc}>{m.partDesc || '-'}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-orange-600">{m.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{m.unit}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground italic">{m.assemblyName}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
