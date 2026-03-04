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
  FileSpreadsheet
} from "lucide-react";
import { exportToExcel } from "@/lib/excel";

interface AssemblyMaterial {
  id?: string;
  name: string;
  partNumber: string | null;
  partDesc: string | null;
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
  projects: any[];
  createdAt: string;
  updatedAt: string;
}

interface BOQItem {
  no: string;
  manufacturer: string;
  partNumber: string;
  partDesc: string; // Added partDesc
  item: string;
  qty: number;
  unit: string;
  assemblyName: string;
  categoryName: string;
  isModuleHeader?: boolean;
  isAssemblyHeader?: boolean;
  isInstallation?: boolean; // Track if it's installation
}

export default function TemplateBOQPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'breakdown' | 'consolidated'>('breakdown');
  const { toast } = useToast();

  const templateId = params.id as string;

  useEffect(() => {
    fetchTemplateData();
  }, [templateId]);

  const fetchTemplateData = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch template data",
          variant: "destructive",
        });
        router.push("/templates");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch template data",
        variant: "destructive",
      });
      router.push("/templates");
    } finally {
      setLoading(false);
    }
  };

  // Use useMemo to generate BOQ data - prevents infinite re-renders
  const boqData = useMemo(() => {
    if (!template) return [];

    // Check if template has assemblies
    if (!template.assemblies || !Array.isArray(template.assemblies)) {
      return [];
    }

    const boqItems: BOQItem[] = [];

    // Define module order as requested
    const moduleOrder: Array<'ELECTRONIC' | 'ELECTRICAL' | 'INSTALLATION' | 'MECHANICAL' | 'ASSEMBLY'> =
      ['ELECTRONIC', 'ELECTRICAL', 'INSTALLATION', 'MECHANICAL', 'ASSEMBLY'];

    // Group assemblies by module
    const assembliesByModule: Record<string, TemplateAssembly[]> = {};
    template.assemblies.forEach((templateAssembly) => {
      if (!templateAssembly || !templateAssembly.assembly) return;

      const assemblyModule = templateAssembly.assembly.module;
      if (!assembliesByModule[assemblyModule]) {
        assembliesByModule[assemblyModule] = [];
      }
      assembliesByModule[assemblyModule].push(templateAssembly);
    });

    let moduleNumber = 1;

    // Process modules in the specified order
    moduleOrder.forEach((moduleName) => {
      const assemblies = assembliesByModule[moduleName];
      if (!assemblies || assemblies.length === 0) return;

      const isInstallationModule = moduleName === 'INSTALLATION';

      // Add module header
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
        isModuleHeader: true,
        isInstallation: isInstallationModule
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
          partDesc: assembly.description || "",
          item: assembly.name,
          qty: assemblyQuantity,
          unit: "Assembly",
          assemblyName: assembly.name,
          categoryName: assembly.category?.name || "",
          isAssemblyHeader: true,
          isInstallation: isInstallationModule
        });

        // Add material rows for this assembly
        if (assembly.materials && Array.isArray(assembly.materials)) {
          assembly.materials.forEach((assemblyMaterial, materialIndex) => {
            if (!assemblyMaterial) return;

            const materialQuantity = Number(assemblyMaterial.quantity || 0) * assemblyQuantity;

            boqItems.push({
              no: `${moduleNumber}.${assemblyNumber}.${materialIndex + 1}`,
              manufacturer: assemblyMaterial.manufacturer || "",
              partNumber: assemblyMaterial.partNumber || "",
              partDesc: assemblyMaterial.partDesc || "",
              item: assemblyMaterial.name || "",
              qty: materialQuantity,
              unit: assemblyMaterial.unit || "",
              assemblyName: assembly.name,
              categoryName: assembly.category?.name || "",
              isInstallation: isInstallationModule
            });
          });
        }

        assemblyNumber++;
      });

      moduleNumber++;
    });

    return boqItems;
  }, [template]);

  const consolidatedData = useMemo(() => {
    if (!template) return { typical: [], installation: [] };

    const typicalMap = new Map<string, {
      name: string;
      partNumber: string;
      partDesc: string;
      manufacturer: string;
      unit: string;
      totalQuantity: number;
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

    template.assemblies.forEach((ta) => {
      const assembly = ta.assembly;
      const assemblyQty = Number(ta.quantity);
      const isInst = assembly.module === 'INSTALLATION';

      assembly.materials.forEach((am) => {
        const totalQty = Number(am.quantity) * assemblyQty;
        if (isInst) {
          installation.push({
            name: am.name,
            partNumber: am.partNumber || "",
            partDesc: am.partDesc || "",
            manufacturer: am.manufacturer || "",
            unit: am.unit,
            quantity: totalQty,
            assemblyName: assembly.name
          });
        } else {
          const key = `${am.name}_${am.partNumber || ''}_${am.manufacturer || ''}_${am.unit}`;
          if (typicalMap.has(key)) {
            typicalMap.get(key)!.totalQuantity += totalQty;
          } else {
            typicalMap.set(key, {
              name: am.name,
              partNumber: am.partNumber || "",
              partDesc: am.partDesc || "",
              manufacturer: am.manufacturer || "",
              unit: am.unit,
              totalQuantity: totalQty
            });
          }
        }
      });
    });

    return {
      typical: Array.from(typicalMap.values()),
      installation
    };
  }, [template]);



  const exportToExcelHandler = () => {
    if (!template || boqData.length === 0) return;

    const headers = ["No", "Manufacturer", "PN", "Item", "Description", "Qty", "Unit", "Category", "Assembly Name"];

    const data = [
      [`BILL OF QUANTITY - ${template.name.toUpperCase()}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Template Description: ${template.description || "No description"}`],
      [`Total Assemblies: ${template.assemblies.length}`],
      [`Total Items: ${boqData.filter(item => !item.isModuleHeader && !item.isAssemblyHeader).length}`],
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

    exportToExcel(data, `${template.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_Full_Breakdown`, "Full Breakdown");

    toast({
      title: "Detailed BOQ Exported",
      description: "Complete Bill of Quantity has been exported to Excel",
    });
  };

  const copyToClipboard = async () => {
    if (!template || boqData.length === 0) return;

    const text = [
      `BILL OF QUANTITY - ${template.name}`,
      `Generated on: ${new Date().toLocaleString()}`,
      "",
      "No\tManufacturer\tPN\tItem\tDescription\tQty\tUnit\tCategory\tAssembly Name",
      ...boqData.map(item =>
        `${item.no}\t${item.manufacturer}\t${item.partNumber}\t${item.item}\t${item.partDesc}\t${item.qty}\t${item.unit}\t${item.categoryName}\t${item.assemblyName}`
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

  const exportCombinedExcel = () => {
    if (!template) return;

    // Create a map to consolidate typical materials
    const typicalMaterialMap = new Map<string, {
      name: string;
      partNumber: string;
      partDesc: string;
      manufacturer: string;
      unit: string;
      totalQuantity: number;
      assemblies: Set<string>;
    }>();

    // List for installation materials (listed separately)
    const installationMaterials: Array<{
      no: string;
      name: string;
      partNumber: string;
      partDesc: string;
      manufacturer: string;
      unit: string;
      quantity: number;
      assemblyName: string;
    }> = [];

    let instIndex = 1;

    // Process all assemblies and their materials
    template.assemblies.forEach((templateAssembly) => {
      if (!templateAssembly || !templateAssembly.assembly) return;

      const assembly = templateAssembly.assembly;
      const assemblyQuantity = Number(templateAssembly.quantity);
      const isInstallation = assembly.module === 'INSTALLATION';

      if (assembly.materials && Array.isArray(assembly.materials)) {
        assembly.materials.forEach((assemblyMaterial) => {
          if (!assemblyMaterial) return;

          const materialQuantity = Number(assemblyMaterial.quantity || 0) * assemblyQuantity;

          if (isInstallation) {
            // Add to installation list (KEEP SEPARATE)
            installationMaterials.push({
              no: `INST-${instIndex++}`,
              name: assemblyMaterial.name,
              partNumber: assemblyMaterial.partNumber || "",
              partDesc: assemblyMaterial.partDesc || "",
              manufacturer: assemblyMaterial.manufacturer || "",
              unit: assemblyMaterial.unit,
              quantity: materialQuantity,
              assemblyName: assembly.name
            });
          } else {
            // Group by Material Properties (TYPICAL)
            const materialKey = `${assemblyMaterial.name}_${assemblyMaterial.partNumber || ''}_${assemblyMaterial.manufacturer || ''}_${assemblyMaterial.unit}`;

            if (typicalMaterialMap.has(materialKey)) {
              const existing = typicalMaterialMap.get(materialKey)!;
              existing.totalQuantity += materialQuantity;
              existing.assemblies.add(assembly.name);
            } else {
              typicalMaterialMap.set(materialKey, {
                name: assemblyMaterial.name,
                partNumber: assemblyMaterial.partNumber || "",
                partDesc: assemblyMaterial.partDesc || "",
                manufacturer: assemblyMaterial.manufacturer || "",
                unit: assemblyMaterial.unit,
                totalQuantity: materialQuantity,
                assemblies: new Set([assembly.name])
              });
            }
          }
        });
      }
    });

    // Convert typical materials map to array
    const typicalMaterials = Array.from(typicalMaterialMap.values());

    const headers = ["No", "Manufacturer", "Part Number", "Item", "Description", "Total Qty", "Unit", "Used in Assemblies"];

    const data = [
      [`CONSOLIDATED BILL OF QUANTITY - ${template.name.toUpperCase()}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Project Description: ${template.description || "No description"}`],
      [],
      [`----- TYPICAL MATERIALS (SUMMARIZED) -----`],
      headers,
      ...typicalMaterials.map((material, index) => [
        index + 1,
        material.manufacturer,
        material.partNumber,
        material.name,
        material.partDesc,
        material.totalQuantity,
        material.unit,
        Array.from(material.assemblies).join('; ')
      ]),
      [],
      [`----- INSTALLATION MATERIALS (SEPARATED) -----`],
      ["No", "Manufacturer", "Part Number", "Item", "Description", "Qty", "Unit", "From Assembly"],
      ...installationMaterials.map((material) => [
        material.no,
        material.manufacturer,
        material.partNumber,
        material.name,
        material.partDesc,
        material.quantity,
        material.unit,
        material.assemblyName
      ])
    ];

    exportToExcel(data, `${template.name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').replace(/-+/g, '_').substring(0, 50)}_Consolidated_BOQ`, "BOQ");

    toast({
      title: "Consolidated BOQ Exported",
      description: "Typical materials summarized and installation materials separated.",
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

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Template not found</h2>
          <p className="text-gray-500 mt-2">The template you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/templates")} className="mt-4">
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  const totalMaterials = boqData.filter(item => !item.isModuleHeader && !item.isAssemblyHeader).length;
  const totalAssemblies = template.assemblies.length;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/templates")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <span className="truncate">Bill of Quantity</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {template.name} - Complete material breakdown
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <div className="bg-muted p-1 rounded-lg flex mr-4">
            <Button
              variant={viewMode === 'breakdown' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('breakdown')}
              className="text-xs h-8"
            >
              Breakdown
            </Button>
            <Button
              variant={viewMode === 'consolidated' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('consolidated')}
              className="text-xs h-8"
            >
              Consolidated
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={copyToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            onClick={exportCombinedExcel}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Download BOQ
          </Button>
        </div>
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
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
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
      </div>

      {/* BOQ Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complete Bill of Quantity
          </CardTitle>
          <CardDescription>
            Detailed breakdown of all materials required for &quot;{template.name}&quot; template
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
                    <TableHead className="min-w-[200px] text-xs font-medium">Item Description</TableHead>
                    <TableHead className="min-w-[200px] text-xs font-medium">Part Desc</TableHead>
                    <TableHead className="min-w-[80px] text-xs font-medium text-right">Qty</TableHead>
                    <TableHead className="min-w-[60px] text-xs font-medium">Unit</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-medium">Category</TableHead>
                    <TableHead className="min-w-[120px] text-xs font-medium">Assembly Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === 'breakdown' ? (
                    boqData.map((item, index) => {
                      const isModuleHeader = item.isModuleHeader;
                      const isAssemblyHeader = item.isAssemblyHeader;

                      if (isModuleHeader) {
                        return (
                          <TableRow key={`${item.no}-${index}`} className="bg-purple-50 dark:bg-purple-950/20 border-t-4 border-purple-200 dark:border-purple-800 font-semibold">
                            <TableCell colSpan={9} className="text-sm font-bold text-purple-900 dark:text-purple-100 py-3 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-purple-600" />
                                {item.no}. {item.item}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      if (isAssemblyHeader) {
                        return (
                          <TableRow key={`${item.no}-${index}`} className="bg-blue-50/50 dark:bg-blue-950/20 border-t-2 border-blue-200 dark:border-blue-800">
                            <TableCell className="text-xs font-mono text-blue-900 dark:text-blue-100 font-bold pl-4">
                              {item.no}
                            </TableCell>
                            <TableCell colSpan={4} className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-blue-600" />
                                {item.item}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-right font-bold text-blue-900 dark:text-blue-100">
                              {item.qty}
                            </TableCell>
                            <TableCell className="text-xs text-blue-900 dark:text-blue-100">
                              Assm
                            </TableCell>
                            <TableCell colSpan={2} className="text-xs text-blue-900 dark:text-blue-100 italic">
                              {item.categoryName || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow key={`${item.no}-${index}`} className={`hover:bg-muted/30 ${item.isInstallation ? 'bg-orange-50/20' : ''}`}>
                          <TableCell className="text-xs font-mono text-muted-foreground pl-8">
                            {item.no}
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.manufacturer || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {item.partNumber || "-"}
                          </TableCell>
                          <TableCell className="text-xs font-medium pl-6 border-l-2 border-blue-100 dark:border-blue-900">
                            {item.item}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={item.partDesc}>
                            {item.partDesc || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold">
                            {item.qty.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              {item.unit}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.categoryName || "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.assemblyName}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <>
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={9} className="text-sm py-2 px-4 border-l-4 border-blue-500">
                          TYPICAL MATERIALS (CONSOLIDATED)
                        </TableCell>
                      </TableRow>
                      {consolidatedData.typical.map((item, idx) => (
                        <TableRow key={`typ-${idx}`} className="hover:bg-muted/30">
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="text-xs">{item.manufacturer}</TableCell>
                          <TableCell className="text-xs font-mono">{item.partNumber}</TableCell>
                          <TableCell className="text-xs font-medium">{item.name}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={item.partDesc}>{item.partDesc}</TableCell>
                          <TableCell className="text-xs text-right font-bold">{item.totalQuantity.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{item.unit}</TableCell>
                          <TableCell colSpan={2} className="text-xs text-muted-foreground italic">Summarized Typical</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={9} className="text-sm py-2 px-4 border-l-4 border-orange-500">
                          INSTALLATION MATERIALS (SEPARATED)
                        </TableCell>
                      </TableRow>
                      {consolidatedData.installation.map((item, idx) => (
                        <TableRow key={`inst-${idx}`} className="hover:bg-muted/30 bg-orange-50/10">
                          <TableCell className="text-xs text-muted-foreground">INST-{idx + 1}</TableCell>
                          <TableCell className="text-xs">{item.manufacturer}</TableCell>
                          <TableCell className="text-xs font-mono">{item.partNumber}</TableCell>
                          <TableCell className="text-xs font-medium">{item.name}</TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={item.partDesc}>{item.partDesc}</TableCell>
                          <TableCell className="text-xs text-right font-bold">{item.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{item.unit}</TableCell>
                          <TableCell colSpan={2} className="text-xs text-muted-foreground italic">{item.assemblyName}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template Name:</span>
                  <span className="font-medium">{template.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Projects:</span>
                  <span>{template.projects.length}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {template.description || "No description provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
