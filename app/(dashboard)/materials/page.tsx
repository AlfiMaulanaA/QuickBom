"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Loader2, ChevronLeft, ChevronRight, RefreshCw, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel";

interface CrmMaterial {
  id: number;
  mfr: string | null;
  partNumber: string | null;
  partName: string;
  partDesc: string | null;
  unitMeasure: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<CrmMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMfr, setSelectedMfr] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof CrmMaterial; direction: "asc" | "desc" } | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  const { toast } = useToast();

  const fetchMaterials = async (pageIndex: number, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageIndex.toString(),
        size: pageSize.toString(),
        search: search
      });

      const response = await fetch(`/api/materials?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setMaterials(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error",
        description: "Failed to load materials from external system",
        variant: "destructive",
      });
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchMaterials(0, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && (totalPages === 0 || newPage < totalPages)) {
      setPage(newPage);
      fetchMaterials(newPage, searchTerm);
    }
  };

  const handleSort = (key: keyof CrmMaterial) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Local filtering and sorting for the current page data
  const processedMaterials = [...materials]
    .filter(m => {
      const matchMfr = selectedMfr === "all" || m.mfr === selectedMfr;
      const matchUnit = selectedUnit === "all" || m.unitMeasure === selectedUnit;
      return matchMfr && matchUnit;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;

      const aValue = a[key] ?? "";
      const bValue = b[key] ?? "";

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

  // Get unique lists for filters
  const manufacturers = Array.from(new Set(materials.filter(m => m.mfr).map(m => m.mfr as string))).sort();
  const units = Array.from(new Set(materials.map(m => m.unitMeasure))).sort();

  const exportToExcelHandler = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all materials from the catalog...",
      });

      let allMaterials: CrmMaterial[] = [];
      const batchSize = 100; // Increased size for standard fetching

      // First call to get total pages
      const initialParams = new URLSearchParams({
        page: "0",
        size: batchSize.toString(),
        search: searchTerm
      });

      const initialResponse = await fetch(`/api/materials?${initialParams.toString()}`);
      if (!initialResponse.ok) throw new Error("Failed to fetch initial materials for export");

      const initialData = await initialResponse.json();
      allMaterials = [...(initialData.content || [])];

      const totalPagesFromApi = initialData.totalPages || 1;

      if (totalPagesFromApi > 1) {
        toast({
          title: "Fetching more data",
          description: `Downloading ${totalPagesFromApi} pages of materials...`,
        });

        // Parallel fetch for remaining pages
        const fetchPromises = [];
        for (let i = 1; i < totalPagesFromApi; i++) {
          const params = new URLSearchParams({
            page: i.toString(),
            size: batchSize.toString(),
            search: searchTerm
          });
          fetchPromises.push(
            fetch(`/api/materials?${params.toString()}`).then(res => {
              if (!res.ok) throw new Error(`Failed to fetch page ${i}`);
              return res.json();
            })
          );
        }

        const remainingPagesData = await Promise.all(fetchPromises);
        remainingPagesData.forEach(data => {
          allMaterials = [...allMaterials, ...(data.content || [])];
        });
      }

      const headers = ["Manufacturer", "Part Number", "Name", "Description", "Unit"];
      const excelData = [
        headers,
        ...allMaterials.map(m => [
          m.mfr || "-",
          m.partNumber || "-",
          m.partName,
          m.partDesc || "-",
          m.unitMeasure
        ])
      ];

      exportToExcel(excelData, `materials_catalog_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`, "Materials");

      toast({
        title: "Export Success",
        description: `Successfully exported ${allMaterials.length} materials.`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Export Failed",
        description: "Could not fetch all materials for export. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">External Materials</h1>
            <p className="text-sm text-muted-foreground">Source: Real-time External CRM Catalog</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcelHandler} className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchMaterials(page, searchTerm)} disabled={loading} className="rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <Card className="md:col-span-2 border-none shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search name, part number, or specs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filter Mfr */}
        <Card className="border-none shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-4">
            <select
              className="w-full h-10 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl px-3 text-sm focus:ring-0 outline-none"
              value={selectedMfr}
              onChange={(e) => setSelectedMfr(e.target.value)}
            >
              <option value="all">All Manufacturers</option>
              {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </CardContent>
        </Card>

        {/* Filter Unit */}
        <Card className="border-none shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-4">
            <select
              className="w-full h-10 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl px-3 text-sm focus:ring-0 outline-none"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
            >
              <option value="all">All Units</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Materials Catalog</CardTitle>
              <CardDescription>
                Found {totalElements} materials in external system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
                  <TableHead onClick={() => handleSort("mfr")} className="cursor-pointer hover:text-primary transition-colors">
                    Manufacturer {sortConfig?.key === "mfr" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("partNumber")} className="cursor-pointer hover:text-primary transition-colors">
                    Part Number {sortConfig?.key === "partNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("partName")} className="cursor-pointer hover:text-primary transition-colors">
                    Name {sortConfig?.key === "partName" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead onClick={() => handleSort("unitMeasure")} className="cursor-pointer hover:text-primary transition-colors text-center">
                    Unit {sortConfig?.key === "unitMeasure" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col justify-center items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <span className="text-sm text-muted-foreground animate-pulse">Communicating with CRM API...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : processedMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Package className="h-12 w-12 opacity-20 mb-4" />
                        <p>No materials found matching your criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  processedMaterials.map((material) => (
                    <TableRow key={material.id} className="group border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">{material.mfr || "-"}</TableCell>
                      <TableCell>
                        <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono">
                          {material.partNumber || "-"}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{material.partName}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={material.partDesc || ""}>
                        {material.partDesc || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal border-gray-200 dark:border-gray-700">
                          {material.unitMeasure}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-100 font-normal">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing <span className="font-medium text-gray-900 dark:text-white">{page * pageSize + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min((page + 1) * pageSize, totalElements)}</span> of {totalElements} materials
            </div>
            <div className="flex gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || loading}
                className="rounded-xl h-9"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <div className="flex items-center px-3 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-xl">
                {page + 1} / {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="rounded-xl h-9"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}

