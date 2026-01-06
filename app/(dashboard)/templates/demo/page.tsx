"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Package, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AssemblyGroupManager from "@/components/assembly-group-manager";
import CategoryBasedSelector from "@/components/category-based-selector";

interface AssemblyGroup {
  id: string;
  name: string;
  description: string | null;
  groupType: 'REQUIRED' | 'CHOOSE_ONE' | 'OPTIONAL' | 'CONFLICT';
  categoryId: number;
  category: {
    id: number;
    name: string;
    description?: string | null;
  };
  items: any[];
  sortOrder: number;
}

export default function TemplateDemoPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<AssemblyGroup[]>([]);
  const [activeTab, setActiveTab] = useState("manager");

  const handleGroupsChange = (updatedGroups: AssemblyGroup[]) => {
    setGroups(updatedGroups);
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
            <h1 className="text-3xl font-bold tracking-tight">🎯 Advanced Grouping Demo</h1>
            <p className="text-muted-foreground">
              Interactive demo of the new nested assembly grouping system
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Group Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Admin interface untuk membuat dan mengelola assembly groups berdasarkan category
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>REQUIRED - Semua item wajib dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>CHOOSE_ONE - Pilih salah satu item</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>OPTIONAL - Pilih item opsional</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>CONFLICT - Item yang tidak bisa dipilih bersamaan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Category-Based Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Setiap assembly category dapat memiliki multiple groups dengan rules berbeda
              </p>
              <div className="space-y-1 text-xs">
                <div className="font-medium">Contoh: Sanitary & Plumbing</div>
                <div>• Closet Options (CHOOSE_ONE)</div>
                <div>• Door Types (CHOOSE_ONE)</div>
                <div>• Shower Accessories (OPTIONAL)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🍽️ Menu-Style Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                User interface yang intuitif seperti memilih menu makanan dengan berbagai opsi
              </p>
              <div className="space-y-1 text-xs">
                <div>• Real-time validation</div>
                <div>• Cost calculation</div>
                <div>• Conflict resolution</div>
                <div>• Progressive disclosure</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Group Manager (Admin)
            </TabsTrigger>
            <TabsTrigger value="selector" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              User Selection (Demo)
            </TabsTrigger>
          </TabsList>

          {/* Group Manager Tab */}
          <TabsContent value="manager" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🛠️ Template Group Manager</CardTitle>
                <CardDescription>
                  Interface admin untuk mengatur assembly groups. Buat groups berdasarkan category dengan berbagai tipe selection rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssemblyGroupManager
                  onGroupsChange={handleGroupsChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Selection Tab */}
          <TabsContent value="selector" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🍽️ Assembly Selection Interface</CardTitle>
                <CardDescription>
                  Interface user untuk memilih assemblies berdasarkan groups yang telah dibuat. Sistem ini memberikan pengalaman seperti memilih menu makanan dengan berbagai opsi dan rules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryBasedSelector
                  groups={groups}
                  onSelectionChange={(selections) => {
                    console.log('User selections:', selections);
                  }}
                  onValidationChange={(result) => {
                    console.log('Validation result:', result);
                  }}
                />
              </CardContent>
            </Card>

            {/* Demo Instructions */}
            <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">📋 Cara Menggunakan Demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">1. Setup Groups (Admin Tab)</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Klik "Create Group" untuk membuat group baru</li>
                      <li>• Pilih category (Sanitary, Wall, Electrical, dll)</li>
                      <li>• Pilih group type (REQUIRED, CHOOSE_ONE, OPTIONAL, CONFLICT)</li>
                      <li>• Pilih assemblies yang akan dimasukkan ke group</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Test Selection (User Tab)</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Klik assemblies untuk memilih</li>
                      <li>• Lihat real-time validation</li>
                      <li>• Cek conflict resolution</li>
                      <li>• Monitor cost calculation</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Group Types Explanation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Badge variant="default" className="mb-1">REQUIRED</Badge>
                      <p className="text-blue-800 dark:text-blue-200">Semua item dalam group harus dipilih. Contoh: Base items yang essential.</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1">CHOOSE_ONE</Badge>
                      <p className="text-blue-800 dark:text-blue-200">Hanya satu item yang bisa dipilih dari group. Contoh: Closet Standard/Premium/Luxury.</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-1">OPTIONAL</Badge>
                      <p className="text-blue-800 dark:text-blue-200">Item bisa dipilih atau tidak dipilih. Contoh: Add-on accessories.</p>
                    </div>
                    <div>
                      <Badge variant="destructive" className="mb-1">CONFLICT</Badge>
                      <p className="text-blue-800 dark:text-blue-200">Item yang tidak bisa dipilih bersamaan. Contoh: Shower vs Bath Tub.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">🚀 Advanced Nested Grouping System</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sistem grouping assemblies yang fleksibel dimana setiap category dapat memiliki multiple groups
                dengan berbagai tipe selection rules. Memberikan pengalaman user seperti memilih menu makanan
                dengan opsi-opsi yang kompleks namun tetap intuitif.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge variant="secondary">Category-Based Groups</Badge>
                <Badge variant="secondary">Dynamic Selection Rules</Badge>
                <Badge variant="secondary">Real-time Validation</Badge>
                <Badge variant="secondary">Conflict Resolution</Badge>
                <Badge variant="secondary">Cost Calculation</Badge>
                <Badge variant="secondary">Menu-Style UX</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
