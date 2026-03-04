"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, FolderOpen, FileText, Search, Loader2, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type ItemType = "project" | "template";

interface UnifiedMaterial {
    name: string;
    partNumber: string;
    partDesc: string;
    manufacturer: string;
    unit: string;
    qtyA: number;
    qtyB: number;
}

export default function BOMComparePage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Setup options
    const [typeA, setTypeA] = useState<ItemType>("project");
    const [idA, setIdA] = useState<string>("");

    const [typeB, setTypeB] = useState<ItemType>("project");
    const [idB, setIdB] = useState<string>("");

    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projRes, templRes] = await Promise.all([
                    fetch("/api/projects"),
                    fetch("/api/templates"),
                ]);

                if (projRes.ok) {
                    const p = await projRes.json();
                    setProjects(p);
                }
                if (templRes.ok) {
                    const t = await templRes.json();
                    setTemplates(t);
                }
            } catch (err) {
                toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const sourceA = useMemo(() => {
        if (!idA) return null;
        return typeA === "project" ? projects.find((p) => String(p.id) === idA) : templates.find((t) => String(t.id) === idA);
    }, [idA, typeA, projects, templates]);

    const sourceB = useMemo(() => {
        if (!idB) return null;
        return typeB === "project" ? projects.find((p) => String(p.id) === idB) : templates.find((t) => String(t.id) === idB);
    }, [idB, typeB, projects, templates]);

    const comparisonData = useMemo(() => {
        if (!sourceA || !sourceB) return [];

        const getMaterials = (sourceItem: any, type: ItemType) => {
            let assemblies = [];
            if (type === "project") {
                assemblies = sourceItem?.template?.assemblies || [];
            } else {
                assemblies = sourceItem?.assemblies || [];
            }

            const map = new Map<string, UnifiedMaterial>();
            assemblies.forEach((ta: any) => {
                const assemblyQty = Number(ta.quantity || 1);
                const materials = ta.assembly?.materials || [];

                materials.forEach((am: any) => {
                    const key = `${am.name}_${am.partNumber || ""}`.toLowerCase();
                    const totalQty = Number(am.quantity || 0) * assemblyQty;

                    if (map.has(key)) {
                        const existing = map.get(key)!;
                        existing.qtyA += totalQty;
                    } else {
                        map.set(key, {
                            name: am.name,
                            partNumber: am.partNumber || "-",
                            partDesc: am.partDesc || am.name || "-",
                            manufacturer: am.manufacturer || "-",
                            unit: am.unit || "-",
                            qtyA: totalQty,
                            qtyB: 0,
                        });
                    }
                });
            });
            return map;
        };

        const mapA = getMaterials(sourceA, typeA);
        const mapB = getMaterials(sourceB, typeB);

        const mergedMap = new Map<string, UnifiedMaterial>();

        // Put A items in merged
        mapA.forEach((val, key) => {
            mergedMap.set(key, { ...val, qtyB: 0 }); // Init qtyB as 0
        });

        // Merge B items
        mapB.forEach((val, key) => {
            if (mergedMap.has(key)) {
                const existing = mergedMap.get(key)!;
                existing.qtyB = val.qtyA; // Because getMaterials assigns it to qtyA by default
            } else {
                mergedMap.set(key, {
                    name: val.name,
                    partNumber: val.partNumber,
                    partDesc: val.partDesc,
                    manufacturer: val.manufacturer,
                    unit: val.unit,
                    qtyA: 0,
                    qtyB: val.qtyA, // getMaterials defaults to qtyA
                });
            }
        });

        return Array.from(mergedMap.values()).sort((a, b) => a.partDesc.localeCompare(b.partDesc));
    }, [sourceA, sourceB, typeA, typeB]);

    const filteredData = comparisonData.filter((item) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return item.partDesc.toLowerCase().includes(s) || item.partNumber.toLowerCase().includes(s);
    });

    const stats = useMemo(() => {
        let onlyA = 0, onlyB = 0, matching = 0, diffQty = 0;
        comparisonData.forEach((d) => {
            if (d.qtyA > 0 && d.qtyB === 0) onlyA++;
            else if (d.qtyB > 0 && d.qtyA === 0) onlyB++;
            else {
                matching++;
                if (d.qtyA !== d.qtyB) diffQty++;
            }
        });
        return { onlyA, onlyB, matching, diffQty, total: comparisonData.length };
    }, [comparisonData]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                        BOM Comparison
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Compare Bill of Quantities (BOQ) between two projects or templates
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source A Selector */}
                <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-indigo-50/50 dark:bg-indigo-950/20">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-xs">A</span>
                            Source A
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Entity Type</label>
                            <Select value={typeA} onValueChange={(val: ItemType) => { setTypeA(val); setIdA(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="project"><div className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Project</div></SelectItem>
                                    <SelectItem value="template"><div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Template</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">{typeA === "project" ? "Select Project" : "Select Template"}</label>
                            <Select value={idA} onValueChange={setIdA}>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select ${typeA}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(typeA === "project" ? projects : templates).map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Source B Selector */}
                <Card className="border-emerald-100 dark:border-emerald-900 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-emerald-50/50 dark:bg-emerald-950/20">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-xs">B</span>
                            Source B
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Entity Type</label>
                            <Select value={typeB} onValueChange={(val: ItemType) => { setTypeB(val); setIdB(""); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="project"><div className="flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Project</div></SelectItem>
                                    <SelectItem value="template"><div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Template</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">{typeB === "project" ? "Select Project" : "Select Template"}</label>
                            <Select value={idB} onValueChange={setIdB}>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select ${typeB}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(typeB === "project" ? projects : templates).map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {sourceA && sourceB && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-white dark:bg-gray-900">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</span>
                                <span className="text-xs font-medium text-muted-foreground mt-1">Total Unique Items</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">{stats.diffQty}</span>
                                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1">Quantity Mismatch</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-500">{stats.onlyA}</span>
                                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mt-1">Only in Source A</span>
                            </CardContent>
                        </Card>
                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{stats.onlyB}</span>
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1">Only in Source B</span>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="space-y-1">
                                <CardTitle>Comparison Result</CardTitle>
                                <CardDescription>
                                    Detailed material breakdown and differences
                                </CardDescription>
                            </div>
                            <div className="w-64">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search material..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-md border-t">
                                <Table>
                                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                                        <TableRow>
                                            <TableHead className="w-[180px]">Part No</TableHead>
                                            <TableHead className="w-[300px]">Material</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead className="text-right whitespace-nowrap"><span className="text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 pb-0.5">Qty A</span></TableHead>
                                            <TableHead className="text-right whitespace-nowrap"><span className="text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 pb-0.5">Qty B</span></TableHead>
                                            <TableHead className="text-center">Status / Variance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                                    No materials found to compare.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredData.map((row, idx) => {
                                                const inBoth = row.qtyA > 0 && row.qtyB > 0;
                                                const onlyA = row.qtyA > 0 && row.qtyB === 0;
                                                const onlyB = row.qtyB > 0 && row.qtyA === 0;
                                                const isDiff = inBoth && row.qtyA !== row.qtyB;
                                                const diffVal = row.qtyB - row.qtyA;

                                                return (
                                                    <TableRow key={idx} className={`
                            ${onlyA ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""}
                            ${onlyB ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}
                            ${isDiff ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}
                          `}>
                                                        <TableCell className="font-medium text-xs text-muted-foreground">
                                                            {row.partNumber}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{row.partDesc}</div>
                                                            {row.manufacturer && row.manufacturer !== "-" && (
                                                                <div className="text-[10px] text-muted-foreground">{row.manufacturer}</div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-xs">{row.unit}</TableCell>
                                                        <TableCell className={`text-right ${onlyB ? "text-gray-300 dark:text-gray-700" : ""}`}>
                                                            {row.qtyA > 0 ? row.qtyA.toLocaleString() : "-"}
                                                        </TableCell>
                                                        <TableCell className={`text-right ${onlyA ? "text-gray-300 dark:text-gray-700" : ""}`}>
                                                            {row.qtyB > 0 ? row.qtyB.toLocaleString() : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {onlyA && <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30">Only in A</Badge>}
                                                            {onlyB && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">Only in B</Badge>}
                                                            {isDiff && (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">Qty Differs</Badge>
                                                                    <span className={`text-xs font-bold ${diffVal > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                                        {diffVal > 0 ? "+" : ""}{diffVal}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {inBoth && !isDiff && <Badge variant="outline" className="text-gray-500">Perfect Match</Badge>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {(!sourceA || !sourceB) && (
                <Card className="bg-gray-50/50 dark:bg-gray-950/50 border-dashed">
                    <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <ArrowRightLeft className="h-10 w-10 text-gray-300 mb-4" />
                        <p className="font-medium">Select both sources to see comparison</p>
                        <p className="text-sm mt-1 text-center max-w-sm">Choose Project vs Project, Template vs Template, or Project vs Template to analyze differences in required materials.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
