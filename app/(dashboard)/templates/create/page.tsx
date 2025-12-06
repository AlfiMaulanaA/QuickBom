"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Minus,
  Trash2,
  FileText,
  Settings,
  DollarSign,
  Package,
  Calculator,
  ArrowLeft,
  Save,
  Eye,
  Info,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  Search,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  createdAt: string;
  updatedAt: string;
}

interface TemplateAssembly {
  assemblyId: number;
  quantity: number;
  assembly: Assembly;
  estimatedCost: number;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedAssemblies, setSelectedAssemblies] = useState<TemplateAssembly[]>([]);
  const [loading, setLoading] = useState(false);

  // Data state
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("select");

  useEffect(() => {
    fetchAssemblies();
  }, []);

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

  // Filter assemblies based on search
  const filteredAssemblies = useMemo(() => {
    return assemblies.filter(assembly =>
      assembly.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assembly.description && assembly.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [assemblies, searchTerm]);

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
        assemblies: selectedAssemblies.map(sa => ({
          assemblyId: sa.assemblyId,
          quantity: sa.quantity
        }))
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const createdTemplate = await response.json();
        toast({
          title: "Success",
          description: `Template "${templateName}" created successfully`,
        });
        router.push("/templates");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create template",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
            <p className="text-muted-foreground">
              Build a comprehensive construction template with assemblies
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
                Configure Template
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
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Available Assemblies
                </CardTitle>
                <CardDescription>
                  Choose assemblies to include in your template. Click on any assembly to add it to your template.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAssemblyFromTemplate(sa.assemblyId);
                          }}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
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
                <div className="space-y-4">
                  {selectedAssemblies.map((sa) => {
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
                  })}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Template Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Template Name *</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Paket Renovasi Kamar Mandi Standard"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Describe this template..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Template Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Template Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {templateStats.totalAssemblies}
                      </div>
                      <div className="text-sm text-muted-foreground">Assemblies</div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {templateStats.totalMaterials}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Materials</div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(templateStats.avgAssemblyCost)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Assembly Cost</div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(templateStats.totalCost)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assemblies Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Assemblies Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of all assemblies in this template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {selectedAssemblies.map((sa, index) => {
                      const assembly = sa.assembly;
                      const percentage = (sa.estimatedCost / totalTemplateCost) * 100;

                      return (
                        <div key={sa.assemblyId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold">{assembly.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {assembly.materials.length} materials × {sa.quantity} qty
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(sa.estimatedCost)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {percentage.toFixed(1)}% of total
                              </div>
                            </div>

                            <div className="w-24">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
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
                    Creating Template...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Template
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
