"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FolderOpen, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateAssemblyCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "FolderOpen"
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/assembly-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Assembly category created successfully",
        });
        router.push("/assembly-categories");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create assembly category",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assembly category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const commonColors = [
    "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
    "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
    "#6366f1", "#14b8a6", "#f97316", "#a855f7"
  ];

  const commonIcons = [
    "FolderOpen", "Building", "Home", "Wall",
    "Grid3X3", "Door", "Zap", "Droplets",
    "Palette", "Sprout", "Settings", "Package"
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">Create Assembly Category</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Add a new assembly category for organization</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Information</CardTitle>
            <CardDescription>
              Define the basic information for this assembly category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter category name (e.g., Structural Elements, Electrical Work)"
                required
              />
              <p className="text-sm text-muted-foreground">
                Choose a descriptive name for this category
              </p>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe what types of assemblies belong to this category"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Optional description to help users understand this category
              </p>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label>Color Theme</Label>
              <div className="grid grid-cols-6 gap-3">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange("color", color)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? "border-primary scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Select color ${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-3">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 gap-3">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange("icon", icon)}
                    className={`p-3 border rounded-lg transition-all ${
                      formData.icon === icon
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    title={`Select icon ${icon}`}
                  >
                    <span className="text-sm font-medium">{icon}</span>
                  </button>
                ))}
              </div>
              <Input
                value={formData.icon}
                onChange={(e) => handleInputChange("icon", e.target.value)}
                placeholder="Enter icon name"
                className="font-mono text-sm"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">{formData.name || "Category Name"}</div>
                    <div className="text-sm text-muted-foreground">
                      {formData.description || "Category description"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Create Category
          </Button>
        </div>
      </form>
    </div>
  );
}
