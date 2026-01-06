"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Save,
  Settings,
  Package,
  Calculator,
  Upload,
  File,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Eye,
  FileText,
  X,
  Layers,
  Plus,
  Minus,
  Check,
  Clock,
  DollarSign,
  Search,
  Trash2,
  FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import CategoryBasedSelector from "@/components/category-based-selector";
import type { AssemblyGroup, ValidationResult } from "@/lib/types/assembly";

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

interface DocumentFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface Assembly {
  id: number;
  name: string;
  description: string | null;
  category?: {
    id: number;
    name: string;
    description?: string | null;
  };
  materials: AssemblyMaterial[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateAssembly {
  assemblyId: number;
  quantity: number;
  assembly: Assembly;
  estimatedCost: number;
}

interface Template {
  id: number;
  name: string;
  description: string | null;
  docs: DocumentFile[] | null;
  assemblies: Array<{
    id?: number;
    assemblyId: number;
    quantity: number;
    assembly: Assembly;
  }>;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = parseInt(params.id as string);
  const { toast } = useToast();

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateDocs, setTemplateDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Assembly Group Selection state
  const [assemblyGroups, setAssemblyGroups] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<number, Record<string, number[]>>>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("category");

  // Category selection state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filteredAssemblyGroups, setFilteredAssemblyGroups] = useState<any[]>([]);

  // Configure Quantities state (for tab "manage")
  const [selectedAssemblies, setSelectedAssemblies] = useState<any[]>([]);
  const [assemblySearchTerm, setAssemblySearchTerm] = useState("");
  const [assemblySortBy, setAssemblySortBy] = useState<"name" | "cost">("name");
  const [assemblySortOrder, setAssemblySortOrder] = useState<"asc" | "desc">("asc");

  // Data state
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [assemblyCategories, setAssemblyCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTemplate();
    fetchAssemblies();
    fetchAssemblyCategories();
  }, [templateId]);

  const fetchAssemblyCategories = async () => {
    try {
      const response = await fetch("/api/assembly-categories");
      if (response.ok) {
        const data = await response.json();
        setAssemblyCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch assembly categories:", error);
    }
  };

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setTemplateName(data.name);
        setTemplateDescription(data.description || "");

        // Convert template assemblies to the format we need
        const templateAssemblies: TemplateAssembly[] = data.assemblies.map((ta: any) => ({
          assemblyId: ta.assemblyId,
          quantity: Number(ta.quantity),
          assembly: ta.assembly,
          estimatedCost: calculateAssemblyCost(ta.assembly) * Number(ta.quantity)
        }));

        setSelectedAssemblies(templateAssemblies);

        // Load existing selections if available
        if (data.assemblySelections) {
          setSelections(data.assemblySelections);
        }

        // Load existing documents
        setTemplateDocs(data.docs || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch template",
          variant: "destructive",
        });
        router.push("/templates");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch template",
        variant: "destructive",
      });
      router.push("/templates");
    } finally {
      setIsLoading(false);
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
      toast({
        title: "Error",
        description: "Failed to load assemblies",
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

  // Calculate cost for an assembly
  const calculateAssemblyCost = (assembly: Assembly) => {
    return assembly.materials.reduce((total, am) => {
      return total + (Number(am.material.price) * Number(am.quantity));
    }, 0);
  };

  // Filter assemblies based on category and search
  const filteredAssemblies = useMemo(() => {
    return assemblies.filter(assembly => {
      // Filter by category if selected
      if (selectedCategoryId && assembly.category?.id !== selectedCategoryId) {
        return false;
      }

      // Filter by search term
      return assembly.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (assembly.description && assembly.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [assemblies, selectedCategoryId, searchTerm]);

  // Add assembly to template
  const addAssemblyToTemplate = (assembly: Assembly) => {
    const existingIndex = selectedAssemblies.findIndex(sa => sa.assemblyId === assembly.id);

    if (existingIndex >= 0) {
      // Increase quantity if already exists
      const updated = [...selectedAssemblies];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].estimatedCost = calculateAssemblyCost(assembly) * updated[existingIndex].quantity;
      setSelectedAssemblies(updated);
    } else {
      // Add new assembly
      setSelectedAssemblies([...selectedAssemblies, {
        assemblyId: assembly.id,
        quantity: 1,
        assembly: assembly,
        estimatedCost: calculateAssemblyCost(assembly)
      }]);
    }

    toast({
      title: "Assembly Added",
      description: `${assembly.name} added to template`,
    });
  };

  // Update assembly quantity
  const updateAssemblyQuantity = (assemblyId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeAssemblyFromTemplate(assemblyId);
      return;
    }

    const updated = selectedAssemblies.map(sa => {
      if (sa.assemblyId === assemblyId) {
        const cost = calculateAssemblyCost(sa.assembly);
        return {
          ...sa,
          quantity: newQuantity,
          estimatedCost: cost * newQuantity
        };
      }
      return sa;
    });

    setSelectedAssemblies(updated);
  };

  // Remove assembly from template
  const removeAssemblyFromTemplate = (assemblyId: number) => {
    const assembly = selectedAssemblies.find(sa => sa.assemblyId === assemblyId);
    setSelectedAssemblies(selectedAssemblies.filter(sa => sa.assemblyId !== assemblyId));

    if (assembly) {
      toast({
        title: "Assembly Removed",
        description: `${assembly.assembly.name} removed from template`,
      });
    }
  };

  // Calculate total template cost
  const totalTemplateCost = useMemo(() => {
    return selectedAssemblies.reduce((total, sa) => total + sa.estimatedCost, 0);
  }, [selectedAssemblies]);

  // Calculate template statistics
  const templateStats = useMemo(() => {
    const totalAssemblies = selectedAssemblies.length;
    const totalMaterials = selectedAssemblies.reduce((total, sa) => {
      return total + sa.assembly.materials.length;
    }, 0);
    const avgAssemblyCost = totalAssemblies > 0 ? totalTemplateCost / totalAssemblies : 0;

    return {
      totalAssemblies,
      totalMaterials,
      avgAssemblyCost,
      totalCost: totalTemplateCost
    };
  }, [selectedAssemblies, totalTemplateCost]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Validation Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedAssemblies.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one assembly to the template",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        docs: templateDocs.length > 0 ? templateDocs : null,
        assemblies: selectedAssemblies.map(sa => ({
          assemblyId: sa.assemblyId,
          quantity: sa.quantity
        })),
        assemblySelections: selections // Store selections as JSON
      };

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        toast({
          title: "Success",
          description: `Template "${templateName}" updated successfully`,
        });
        router.push("/templates");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/templates")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
            <p className="text-muted-foreground">
              Update template information and assembly composition
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeTab === "select" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                1
              </div>
              <span className={`font-medium ${activeTab === "select" ? "text-primary" : "text-muted-foreground"}`}>
                Select Assemblies
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeTab === "configure" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                2
              </div>
              <span className={`font-medium ${activeTab === "configure" ? "text-primary" : "text-muted-foreground"}`}>
                Configure Quantities
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                activeTab === "review" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                3
              </div>
              <span className={`font-medium ${activeTab === "review" ? "text-primary" : "text-muted-foreground"}`}>
                Review & Save
              </span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: activeTab === "select" ? "33%" : activeTab === "configure" ? "66%" : "100%"
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Select Assemblies
            </TabsTrigger>
            <TabsTrigger value="configure" disabled={selectedAssemblies.length === 0} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configure Quantities
            </TabsTrigger>
            <TabsTrigger value="review" disabled={selectedAssemblies.length === 0} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Review & Save
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Select Assemblies */}
          <TabsContent value="select" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Available Assemblies
                    </CardTitle>
                    <CardDescription>
                      Choose assemblies to include in your template. Click on any assembly to add it to your template.
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(totalTemplateCost)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Category Filter and Search */}
                <div className="mb-6 space-y-4">
                  {/* Category Filter - Clean & Simple */}
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Filter by Assembly Category</Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">Choose a category to narrow down available assemblies</p>
                      </div>
                    </div>

                    <Select
                      value={selectedCategoryId?.toString() || "all"}
                      onValueChange={(value) => setSelectedCategoryId(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger className="w-full h-12">
                        <SelectValue placeholder={
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-medium">All Categories</span>
                            <Badge variant="secondary">
                              {assemblies.length} assemblies
                            </Badge>
                          </div>
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="all" className="cursor-pointer">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-medium">All Categories</span>
                            </div>
                            <Badge variant="secondary">
                              {assemblies.length}
                            </Badge>
                          </div>
                        </SelectItem>
                        {assemblyCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()} className="cursor-pointer">
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <Badge variant="outline">
                                {category._count?.assemblies || 0}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search assemblies by name or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Assemblies Grid - Menu Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssemblies.map((assembly) => {
                    const isSelected = selectedAssemblies.some(sa => sa.assemblyId === assembly.id);
                    const selectedQuantity = selectedAssemblies.find(sa => sa.assemblyId === assembly.id)?.quantity || 0;
                    const assemblyCost = calculateAssemblyCost(assembly);

                    return (
                      <Card
                        key={assembly.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                        }`}
                        onClick={() => addAssemblyToTemplate(assembly)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold line-clamp-1">
                                {assembly.name}
                              </CardTitle>
                              {assembly.description && (
                                <CardDescription className="mt-1 line-clamp-2">
                                  {assembly.description}
                                </CardDescription>
                              )}
                            </div>
                            {isSelected && (
                              <Badge variant="default" className="ml-2">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {selectedQuantity}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Materials:</span>
                              <Badge variant="secondary">
                                {assembly.materials.length} items
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Cost per unit:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(assemblyCost)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredAssemblies.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No assemblies found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search criteria or create new assemblies first.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Assemblies Summary */}
            {selectedAssemblies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Selected Assemblies ({selectedAssemblies.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssemblies.map((sa) => (
                      <Badge key={sa.assemblyId} variant="default" className="flex items-center gap-1">
                        {sa.assembly.name}
                        <span className="bg-primary-foreground text-primary px-1 rounded text-xs">
                          {sa.quantity}
                        </span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tip: Click assemblies again to increase quantity. You can adjust quantities in the next step.
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Total Cost:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalTemplateCost)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setActiveTab("configure")}
                disabled={selectedAssemblies.length === 0}
                className="px-8"
              >
                Next: Configure Quantities
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Configure Quantities */}
          <TabsContent value="configure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure Assembly Quantities
                </CardTitle>
                <CardDescription>
                  Adjust the quantity of each assembly in your template.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Sort Controls */}
                {selectedAssemblies.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search assemblies by name..."
                          value={assemblySearchTerm}
                          onChange={(e) => setAssemblySearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={`${assemblySortBy}-${assemblySortOrder}`}
                        onChange={(e) => {
                          const [sortBy, sortOrder] = e.target.value.split('-') as [typeof assemblySortBy, typeof assemblySortOrder];
                          setAssemblySortBy(sortBy);
                          setAssemblySortOrder(sortOrder);
                        }}
                        className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-[140px]"
                      >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="cost-asc">Cost (Low-High)</option>
                        <option value="cost-desc">Cost (High-Low)</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAssemblySearchTerm("");
                          setAssemblySortBy("name");
                          setAssemblySortOrder("asc");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {(() => {
                    // Filter and sort selected assemblies
                    const filteredAndSortedAssemblies = selectedAssemblies
                      .filter(sa =>
                        sa.assembly.name.toLowerCase().includes(assemblySearchTerm.toLowerCase())
                      )
                      .sort((a, b) => {
                        let aValue: any, bValue: any;

                        switch (assemblySortBy) {
                          case "name":
                            aValue = a.assembly.name.toLowerCase();
                            bValue = b.assembly.name.toLowerCase();
                            break;
                          case "cost":
                            aValue = a.estimatedCost;
                            bValue = b.estimatedCost;
                            break;
                          default:
                            return 0;
                        }

                        if (assemblySortOrder === "asc") {
                          return aValue > bValue ? 1 : -1;
                        } else {
                          return aValue < bValue ? 1 : -1;
                        }
                      });

                    return filteredAndSortedAssemblies.map((sa) => {
                      const assembly = sa.assembly;
                      const unitCost = calculateAssemblyCost(assembly);

                      return (
                        <Card key={sa.assemblyId} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{assembly.name}</h4>
                              {assembly.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {assembly.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span>Unit Cost: {formatCurrency(unitCost)}</span>
                                <span>Materials: {assembly.materials.length}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAssemblyQuantity(sa.assemblyId, sa.quantity - 1)}
                                  disabled={sa.quantity <= 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>

                                <div className="w-16 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={sa.quantity}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1;
                                      updateAssemblyQuantity(sa.assemblyId, value);
                                    }}
                                    className="text-center"
                                  />
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAssemblyQuantity(sa.assemblyId, sa.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="text-right min-w-[120px]">
                                <div className="font-semibold text-green-600">
                                  {formatCurrency(sa.estimatedCost)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total
                                </div>
                              </div>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeAssemblyFromTemplate(sa.assemblyId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("select")}>
                Back to Selection
              </Button>
              <Button onClick={() => setActiveTab("review")} className="px-8">
                Next: Review Template
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Review & Save */}
          <TabsContent value="review" className="space-y-6">
            {/* Template Information and Documents - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Information - Enhanced */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Template Information</CardTitle>
                      <CardDescription className="text-base text-muted-foreground dark:text-gray-400">
                        Basic details and description for your template
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="template-name" className="text-base font-medium flex items-center gap-2">
                      Template Name
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Premium Bathroom Renovation Package"
                      className="h-12 text-base"
                      required
                    />
                    {templateName.trim().length === 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Template name is required
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="template-description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe this template, its intended use, and any special features..."
                      rows={4}
                      className="resize-none text-base"
                    />
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Optional description to help users understand this template
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Upload - Enhanced */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Supporting Documents</CardTitle>
                      <CardDescription className="text-base text-muted-foreground dark:text-gray-400">
                        Upload specifications, drawings, or reference materials
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Area */}
                  <div className="space-y-4">
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;

                        files.forEach(file => {
                          const docObject = {
                            name: file.name,
                            url: `#temp-${Date.now()}-${file.name}`,
                            size: file.size,
                            type: file.type || 'application/octet-stream',
                            uploadedAt: new Date().toISOString(),
                            file: file
                          };
                          setTemplateDocs(prev => [...prev, docObject]);
                        });

                        e.target.value = '';
                      }}
                    />

                    {/* Upload Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={() => document.getElementById('document-upload')?.click()}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-gray-100">Upload Documents</p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">
                            PDF, Word, Excel, Images
                          </p>
                        </div>
                      </div>
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Supported formats: PDF, Word, Excel, Images (JPG, PNG)
                      </p>
                    </div>
                  </div>

                  {/* Documents List - Enhanced */}
                  {templateDocs.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Uploaded Documents ({templateDocs.length})</Label>
                        <Badge variant="secondary" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          {templateDocs.length} files
                        </Badge>
                      </div>

                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {templateDocs.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                              <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <File className="h-4 w-4 text-primary" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {doc.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-gray-400">
                                  <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                  <span>•</span>
                                  <span>{doc.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTemplateDocs(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template Statistics - Clean & Simple */}
            {selectedAssemblies.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Template Statistics</CardTitle>
                      <CardDescription className="text-base text-muted-foreground dark:text-gray-400">
                        Overview of your template composition and estimated costs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-6 bg-muted/50 rounded-lg border">
                      <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 border">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {templateStats.totalAssemblies}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Assemblies</div>
                    </div>

                    <div className="text-center p-6 bg-muted/50 rounded-lg border">
                      <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 border">
                        <FolderOpen className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {templateStats.totalMaterials}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Materials</div>
                    </div>

                    <div className="text-center p-6 bg-muted/50 rounded-lg border">
                      <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 border">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {formatCurrency(templateStats.avgAssemblyCost)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Assembly Cost</div>
                    </div>

                    <div className="text-center p-6 bg-muted/50 rounded-lg border">
                      <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-3 border">
                        <Calculator className="h-6 w-6" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {formatCurrency(templateStats.totalCost)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assembly Selection Breakdown - Clean & Improved */}
            {selectedAssemblies.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Assembly Selection Breakdown</CardTitle>
                      <CardDescription className="text-base text-muted-foreground dark:text-gray-400">
                        Detailed breakdown of selected assemblies organized by category and group
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-6">
                      {/* We'll show a simple list since we don't have group breakdown in edit mode */}
                      {selectedAssemblies.map((sa, index) => {
                        const assembly = sa.assembly;

                        return (
                          <div key={sa.assemblyId} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border hover:bg-muted/40 transition-colors">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-primary">{index + 1}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {assembly.name}
                                </h5>
                                <Badge variant="secondary" className="text-xs px-2 py-0">
                                  ×{sa.quantity}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>Unit: {formatCurrency(sa.estimatedCost / sa.quantity)}</span>
                                <span>•</span>
                                <span>Materials: {assembly.materials?.length || 0}</span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(sa.estimatedCost)}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Cost</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Validation Messages */}
            {(!templateName.trim() || selectedAssemblies.length === 0) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {!templateName.trim() && "Template name is required. "}
                  {selectedAssemblies.length === 0 && "At least one assembly must be selected."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("configure")}>
                Back to Configuration
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!templateName.trim() || selectedAssemblies.length === 0 || loading}
                className="px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Updating Template...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Template
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
