"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  FolderOpen,
  Edit,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import CategoryBasedSelector from "@/components/category-based-selector";
import type { AssemblyGroup, ValidationResult } from "@/lib/types/assembly";

interface TemplateAssembly {
  assemblyId: number;
  quantity: number;
  assembly: {
    id: number;
    name: string;
    description?: string | null;
    materials: {
      id?: number;
      materialId: number;
      quantity: number;
      material: {
        id: number;
        name: string;
        price: number;
      };
    }[];
  };
  estimatedCost: number;
}

interface DocumentFile {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const { toast } = useToast();

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateDocs, setTemplateDocs] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Assembly Group Selection state
  const [assemblyGroups, setAssemblyGroups] = useState<AssemblyGroup[]>([]);
  const [selections, setSelections] = useState<Record<number, Record<string, number[]>>>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState("category");

  // Category selection state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filteredAssemblyGroups, setFilteredAssemblyGroups] = useState<AssemblyGroup[]>([]);

  // Configure Quantities state (for tab "manage")
  const [selectedAssemblies, setSelectedAssemblies] = useState<any[]>([]);
  const [assemblySearchTerm, setAssemblySearchTerm] = useState("");
  const [assemblySortBy, setAssemblySortBy] = useState<"name" | "cost">("name");
  const [assemblySortOrder, setAssemblySortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchCategories();
    fetchTemplateData();
  }, [templateId]);

  // Fetch categories when component mounts
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/assembly-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Reconstruct selections from existing assemblies (for legacy templates or direct mapping)
  const reconstructSelectionsFromAssemblies = (
    assemblies: any[],
    groups: AssemblyGroup[]
  ): Record<number, Record<string, number[]>> => {
    const newSelections: Record<number, Record<string, number[]>> = {};

    // Map existing assembly IDs for quick lookup
    const existingAssemblyIds = new Set(assemblies.map(a => a.assemblyId));

    groups.forEach(group => {
      // Find which items in this group are present in the template
      const selectedItemsInGroup = group.items.filter(item =>
        existingAssemblyIds.has(item.assemblyId)
      );

      if (selectedItemsInGroup.length > 0) {
        if (!newSelections[group.categoryId]) {
          newSelections[group.categoryId] = {};
        }

        // Add to selections
        // Note: The selector component expects an array of assembly IDs for the group ID key
        // BUT the key structure in selections state is Record<number (CategoryId), Record<string (GroupId), number[] (AssemblyIds)>>
        newSelections[group.categoryId][group.id] = selectedItemsInGroup.map(item => item.assemblyId);
      }
    });

    return newSelections;
  };

  // Fetch template data
  const fetchTemplateData = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const template = await response.json();

        // Set basic template info
        setTemplateName(template.name || "");
        setTemplateDescription(template.description || "");
        setTemplateDocs(template.docs || []);

        // Fetch groups first to allow reconstruction
        let currentGroups: AssemblyGroup[] = [];

        // Set category if available
        if (template.assemblies && template.assemblies.length > 0) {
          const categoryId = template.assemblies[0].assembly.categoryId;
          setSelectedCategoryId(categoryId);

          // Fetch groups for this category
          try {
            const groupsResponse = await fetch(`/api/assembly-groups?categoryId=${categoryId}`);
            if (groupsResponse.ok) {
              currentGroups = await groupsResponse.json();
              setFilteredAssemblyGroups(currentGroups);
              setAssemblyGroups(currentGroups);
            }
          } catch (error) {
            console.error('Failed to fetch groups:', error);
          }
        }

        // Convert template assemblies to selected assemblies format
        const selectedAssembliesData = template.assemblies.map((ta: any) => ({
          assemblyId: ta.assemblyId,
          quantity: ta.quantity,
          assembly: ta.assembly,
          estimatedCost: calculateAssemblyCost(ta.assembly) * ta.quantity
        }));

        setSelectedAssemblies(selectedAssembliesData);

        // Initialize selections based on existing assemblies
        let initialSelections: Record<number, Record<string, number[]>> = {};

        if (template.assemblySelections && Object.keys(template.assemblySelections).length > 0) {
          // Use saved selections if available
          Object.assign(initialSelections, template.assemblySelections);
        } else if (currentGroups.length > 0) {
          // Reconstruct from groups if possible
          initialSelections = reconstructSelectionsFromAssemblies(template.assemblies, currentGroups);
        }

        setSelections(initialSelections);

      } else {
        toast({
          title: "Error",
          description: "Failed to load template data",
          variant: "destructive",
        });
        router.push("/templates");
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      toast({
        title: "Error",
        description: "Failed to load template data",
        variant: "destructive",
      });
      router.push("/templates");
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch assembly groups when category is selected
  const fetchAssemblyGroupsForCategory = async (categoryId: number) => {
    try {
      const response = await fetch(`/api/assembly-groups?categoryId=${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredAssemblyGroups(data);
        setAssemblyGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch assembly groups for category:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // Calculate total cost from validation result
  const totalTemplateCost = validationResult?.totalCost ||
    selectedAssemblies.reduce((sum, sa) => sum + sa.estimatedCost, 0);

  // Calculate template statistics
  const templateStats = useMemo(() => {
    if (validationResult) {
      const totalAssemblies = validationResult.breakdown.reduce((sum, cat) =>
        sum + cat.groups.reduce((gSum, g) => gSum + g.assemblies.length, 0), 0
      );

      const totalMaterials = validationResult.breakdown.reduce((sum, cat) =>
        sum + cat.groups.reduce((gSum, g) =>
          gSum + g.assemblies.reduce((aSum, a) => aSum + (a.cost / a.quantity), 0), 0
        ), 0
      );

      const avgAssemblyCost = totalAssemblies > 0 ? totalTemplateCost / totalAssemblies : 0;

      return {
        totalAssemblies,
        totalMaterials,
        avgAssemblyCost,
        totalCost: totalTemplateCost
      };
    } else {
      // Fallback to selected assemblies
      const totalAssemblies = selectedAssemblies.length;
      const avgAssemblyCost = totalAssemblies > 0 ? totalTemplateCost / totalAssemblies : 0;

      return {
        totalAssemblies,
        totalMaterials: selectedAssemblies.reduce((sum, sa) => sum + sa.assembly.materials.length, 0),
        avgAssemblyCost,
        totalCost: totalTemplateCost
      };
    }
  }, [validationResult, selectedAssemblies, totalTemplateCost]);

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
        description: "At least one assembly must be selected",
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
        assemblySelections: selections
      };

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
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

  // Handle group changes from manager
  const handleGroupsChange = (updatedGroups: AssemblyGroup[]) => {
    setAssemblyGroups(updatedGroups);
  };

  // Handle selections from selector
  const handleSelectionChange = (newSelections: Record<number, Record<string, number[]>>) => {
    setSelections(newSelections);
  };

  // Handle validation changes
  const handleValidationChange = async (result: ValidationResult | null) => {
    setValidationResult(result);

    // Extract selected assemblies from validation result for step 2
    if (result?.isValid && result.breakdown) {
      try {
        // Get all assembly IDs from validation result
        const assemblyIds: number[] = [];
        result.breakdown.forEach(category => {
          category.groups.forEach(group => {
            group.assemblies.forEach(assembly => {
              if (!assemblyIds.includes(assembly.assemblyId)) {
                assemblyIds.push(assembly.assemblyId);
              }
            });
          });
        });

        // Fetch full assembly data from API
        const assemblyPromises = assemblyIds.map(id =>
          fetch(`/api/assemblies/${id}`).then(res => res.ok ? res.json() : null)
        );

        const assemblies = await Promise.all(assemblyPromises);
        const validAssemblies = assemblies.filter(a => a !== null);

        // Create selected assemblies with full data
        const selectedAssembliesFromGroups: any[] = [];

        result.breakdown.forEach(category => {
          category.groups.forEach(group => {
            group.assemblies.forEach(assembly => {
              const fullAssembly = validAssemblies.find(a => a.id === assembly.assemblyId);
              if (fullAssembly) {
                // Check if we already have this assembly selected to preserve its manual quantity
                const existingSelection = selectedAssemblies.find(sa => sa.assemblyId === assembly.assemblyId);
                const quantity = existingSelection ? existingSelection.quantity : assembly.quantity;
                const cost = calculateAssemblyCost(fullAssembly) * quantity;

                selectedAssembliesFromGroups.push({
                  assemblyId: assembly.assemblyId,
                  quantity: quantity,
                  assembly: fullAssembly,
                  estimatedCost: cost
                });
              }
            });
          });
        });

        setSelectedAssemblies(selectedAssembliesFromGroups);
      } catch (error) {
        console.error('Failed to load assembly details:', error);
        toast({
          title: "Warning",
          description: "Assembly details could not be loaded. Some features may be limited.",
          variant: "destructive",
        });
      }
    }
  };

  // Check if we have any groups to work with
  const hasAssemblyGroups = assemblyGroups.length > 0;

  // Calculate cost for an assembly
  const calculateAssemblyCost = (assembly: any) => {
    return assembly.materials?.reduce((total: number, am: any) => {
      return total + (Number(am.material?.price || 0) * Number(am.quantity || 1));
    }, 0) || 0;
  };

  // Update assembly quantity
  const updateAssemblyQuantity = (assemblyId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeAssemblyFromTemplate(assemblyId);
      return;
    }

    const updated = selectedAssemblies.map((sa: any) => {
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
    const assembly = selectedAssemblies.find((sa: any) => sa.assemblyId === assemblyId);
    setSelectedAssemblies(selectedAssemblies.filter((sa: any) => sa.assemblyId !== assemblyId));

    if (assembly) {
      toast({
        title: "Assembly Removed",
        description: `${assembly.assembly.name} removed from template`,
      });
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="w-full px-4 py-8 mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading template data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full px-4 py-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/templates")}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <Edit className="h-8 w-8 text-primary" />
              Edit Template
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-1">
              Modify template configuration and settings
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === "category" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                1
              </div>
              <span className={`font-medium ${activeTab === "category" ? "text-primary" : "text-muted-foreground"}`}>
                Select Category
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === "select" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                2
              </div>
              <span className={`font-medium ${activeTab === "select" ? "text-primary" : "text-muted-foreground"}`}>
                Select from Groups
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === "manage" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                3
              </div>
              <span className={`font-medium ${activeTab === "manage" ? "text-primary" : "text-muted-foreground"}`}>
                Manage Quantity
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${activeTab === "review" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                4
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
                width: activeTab === "category" ? "25%" : activeTab === "select" ? "50%" : activeTab === "manage" ? "75%" : "100%"
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50 dark:bg-muted/20">
            <TabsTrigger
              value="category"
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Select Category</span>
              <span className="sm:hidden">Category</span>
            </TabsTrigger>
            <TabsTrigger
              value="select"
              disabled={!selectedCategoryId}
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Group Selection</span>
              <span className="sm:hidden">Select</span>
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              disabled={!selectedCategoryId}
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Quantity</span>
              <span className="sm:hidden">Quantity</span>
            </TabsTrigger>
            <TabsTrigger
              value="review"
              disabled={!hasAssemblyGroups}
              className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Review & Save</span>
              <span className="sm:hidden">Review</span>
            </TabsTrigger>
          </TabsList>

          {/* Step 0: Select Category */}
          <TabsContent value="category" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Select Assembly Category
                </CardTitle>
                <CardDescription>
                  Choose the category of assemblies you want to work with for this template.
                  This will determine which assembly groups are available for selection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No categories available</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedCategoryId === category.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                          }`}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          fetchAssemblyGroupsForCategory(category.id);
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                              style={{ backgroundColor: category.color || '#3b82f6' }}>
                              {category.icon ? category.icon.charAt(0).toUpperCase() : category.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                              {category.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {selectedCategoryId === category.id && (
                            <div className="mt-4 pt-4 border-t">
                              <Badge variant="default" className="w-full justify-center">
                                <Check className="h-4 w-4 mr-2" />
                                Selected
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {selectedCategoryId && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Category Selected: {categories.find(c => c.id === selectedCategoryId)?.name}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Ready to proceed to group selection
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("category")}>
                Back to Categories
              </Button>
              <Button
                onClick={() => setActiveTab("select")}
                disabled={!selectedCategoryId}
                className="px-8"
              >
                Next: Select Groups
              </Button>
            </div>
          </TabsContent>

          {/* Step 1: Assembly Group Selection */}
          <TabsContent value="select" className="space-y-6">
            {!hasAssemblyGroups ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">No Assembly Groups Available</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                    You need to create assembly groups first before you can edit templates.
                    Assembly groups define the selection rules for different assembly categories.
                  </p>
                  <Button
                    onClick={() => setActiveTab("manage")}
                    className="mt-4"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Create Assembly Groups
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Assembly Group Selector */}
                <CategoryBasedSelector
                  groups={assemblyGroups}
                  initialSelections={selections}
                  onSelectionChange={handleSelectionChange}
                  onValidationChange={handleValidationChange}
                />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab("category")}>
                    Back to Category
                  </Button>
                  <Button
                    onClick={() => setActiveTab("manage")}
                    className="px-8"
                  >
                    Next: Manage Quantity
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Step 2: Configure Quantities */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configure Assembly Quantities
                </CardTitle>
                <CardDescription>
                  Adjust the quantity of each assembly in your template. Use the controls to increase or decrease quantities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Sort Controls */}
                {selectedAssemblies.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
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

                {/* Quantity Configuration Cards */}
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
                        <Card key={sa.assemblyId} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{assembly.name}</h4>
                              {assembly.description && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                  {assembly.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-3 text-sm">
                                <span className="text-muted-foreground">Unit Cost:</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {formatCurrency(unitCost)}
                                </span>
                                <span className="text-muted-foreground">Materials:</span>
                                <Badge variant="secondary">
                                  {assembly.materials?.length || 0} items
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAssemblyQuantity(sa.assemblyId, sa.quantity - 1)}
                                  disabled={sa.quantity <= 1}
                                  className="h-10 w-10 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>

                                <div className="w-20 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={sa.quantity}
                                    onChange={(e) => {
                                      const value = Math.max(1, parseInt(e.target.value) || 1);
                                      updateAssemblyQuantity(sa.assemblyId, value);
                                    }}
                                    className="text-center h-10 text-lg font-semibold"
                                  />
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateAssemblyQuantity(sa.assemblyId, sa.quantity + 1)}
                                  className="h-10 w-10 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Cost Display */}
                              <div className="text-right min-w-[140px]">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(sa.estimatedCost)}
                                </div>
                                <div className="text-xs text-muted-foreground dark:text-gray-400">
                                  Total Cost
                                </div>
                              </div>

                              {/* Remove Button */}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeAssemblyFromTemplate(sa.assemblyId)}
                                className="h-10 px-3"
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

                {selectedAssemblies.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Assemblies Selected</h3>
                    <p className="text-muted-foreground dark:text-gray-400 mb-4">
                      Go back to the selection step to add assemblies to your template.
                    </p>
                    <Button onClick={() => setActiveTab("select")}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            {selectedAssemblies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Configuration Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {selectedAssemblies.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Assemblies</div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedAssemblies.reduce((total, sa) => total + sa.quantity, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Quantity</div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalTemplateCost)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Assembly Selection Breakdown - Clean & Improved */}
            {selectedAssemblies.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Assembly Selection Breakdown</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">
                        Detailed breakdown of selected assemblies organized by category and group
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {(() => {
                        // Group selectedAssemblies by category and group
                        const groupedAssemblies: Record<number, {
                          categoryName: string;
                          categoryColor?: string;
                          groups: Record<number, {
                            groupName: string;
                            assemblies: any[];
                            totalCost: number;
                          }>;
                          totalCost: number;
                        }> = {};

                        selectedAssemblies.forEach((sa) => {
                          const category = categories.find(c => c.id === sa.assembly.categoryId);
                          if (!category) return;

                          if (!groupedAssemblies[category.id]) {
                            groupedAssemblies[category.id] = {
                              categoryName: category.name,
                              categoryColor: category.color,
                              groups: {},
                              totalCost: 0
                            };
                          }

                          // For now, we'll put all assemblies in a single "Configured" group
                          const groupKey = 0;
                          const groupName = "Configured Assemblies";

                          if (!groupedAssemblies[category.id].groups[groupKey]) {
                            groupedAssemblies[category.id].groups[groupKey] = {
                              groupName,
                              assemblies: [],
                              totalCost: 0
                            };
                          }

                          groupedAssemblies[category.id].groups[groupKey].assemblies.push(sa);
                          groupedAssemblies[category.id].groups[groupKey].totalCost += sa.estimatedCost;
                          groupedAssemblies[category.id].totalCost += sa.estimatedCost;
                        });

                        return Object.entries(groupedAssemblies).map(([categoryId, categoryData], categoryIndex) => (
                          <div key={categoryId} className="space-y-4">
                            {/* Category Header - Clean */}
                            <div className="bg-muted/30 rounded-lg border p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{categoryData.categoryName}</h3>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span>{Object.keys(categoryData.groups).length} groups</span>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span>{Object.values(categoryData.groups).reduce((sum, g) => sum + g.assemblies.length, 0)} assemblies</span>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                      {formatCurrency(categoryData.totalCost)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Groups within Category - Clean Layout */}
                            <div className="space-y-4">
                              {Object.entries(categoryData.groups).map(([groupId, group]) => (
                                <div key={groupId} className="border border-border rounded-lg overflow-hidden">
                                  {/* Group Header - Clean */}
                                  <div className="bg-muted/20 px-4 py-3 border-b border-border">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                          <Settings className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{group.groupName}</h4>
                                          <p className="text-xs text-muted-foreground">
                                            {group.assemblies.length} assemblies
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right mr-4">
                                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                          {formatCurrency(group.totalCost)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Assemblies within Group - Numbered List */}
                                  <div className="divide-y divide-border">
                                    {group.assemblies.map((assembly, assemblyIndex) => (
                                      <div key={assembly.assemblyId} className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors">
                                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs font-medium text-primary">
                                            {assemblyIndex + 1}
                                          </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                              {assembly.assembly.name}
                                            </h5>
                                            <Badge variant="secondary" className="text-xs px-2 py-0">
                                              ×{assembly.quantity}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>Unit: {formatCurrency(calculateAssemblyCost(assembly.assembly))}</span>
                                          </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 mr-4">
                                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                                            {formatCurrency(assembly.estimatedCost)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Template Statistics - Clean & Simple - Moved Below */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Calculator className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Template Statistics</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground dark:text-gray-400">
                      Overview of your template composition and estimated costs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {templateStats.totalAssemblies}
                    </div>
                    <div className="text-xs text-muted-foreground">Assemblies</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg border">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {validationResult?.breakdown.length || 1}
                    </div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg border">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {formatCurrency(templateStats.avgAssemblyCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Cost</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg border">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {formatCurrency(templateStats.totalCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              <Button variant="outline" onClick={() => setActiveTab("manage")}>
                Back to Quantity Management
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