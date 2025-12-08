"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, FileText, Download, Eye, Edit, Save, RefreshCw, Building2, User, Calendar, DollarSign, Package, File, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: number;
  name: string;
  description: string | null;
  clientId: string | null;
  client: {
    id: string;
    companyName: string | null;
    contactPerson: string;
    contactEmail: string;
    clientType: string;
  } | null;
  template: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  totalPrice: number;
  createdAt: string;
  status: string;
}

interface PDFConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  documentTitle: string;
  requesterTitle: string;
  approverTitle: string;
  showProjectDescription: boolean;
  showClientInfo: boolean;
  showMaterialDetails: boolean;
  showSignatureSection: boolean;
  includeAssemblyBreakdown: boolean;
  customFooter: string;
}

export default function PDFConfigPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedProjectForPreview, setSelectedProjectForPreview] = useState<Project | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // PDF Configuration State
  const [pdfConfig, setPdfConfig] = useState<PDFConfig>({
    companyName: "PT. QUICKBOM INDONESIA",
    companyAddress: "Jl. Raya Industri No. 123, Jakarta Pusat",
    companyPhone: "(021) 1234-5678",
    companyEmail: "procurement@quickbom.id",
    documentTitle: "SURAT SERAH TERIMA MATERIAL",
    requesterTitle: "Requester",
    approverTitle: "Approved By",
    showProjectDescription: true,
    showClientInfo: true,
    showMaterialDetails: true,
    showSignatureSection: true,
    includeAssemblyBreakdown: false,
    customFooter: "Dokumen ini dibuat secara otomatis oleh sistem QuickBom"
  });

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        // Filter only projects with templates
        const projectsWithTemplates = data.filter((project: Project) => project.template);
        setProjects(projectsWithTemplates);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProjects(projects.map(p => p.id));
    } else {
      setSelectedProjects([]);
    }
  };

  const handleSelectProject = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProjects(prev => [...prev, id]);
    } else {
      setSelectedProjects(prev => prev.filter(projectId => projectId !== id));
    }
  };

  const exportSelectedProjectsPDF = async () => {
    if (selectedProjects.length === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    let successCount = 0;

    try {
      // Export each selected project with configuration
      for (let i = 0; i < selectedProjects.length; i++) {
        const projectId = selectedProjects[i];

        try {
          const response = await fetch(`/api/projects/${projectId}/export-pdf`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pdfConfig),
          });

          if (response.ok) {
            // Get the blob from the response and trigger download
            const blob = await response.blob();

            // Create a download link and trigger the download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `Material_Handover_${projectId}.pdf`;

            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="(.+)"/);
              if (filenameMatch) {
                filename = filenameMatch[1];
              }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            successCount++;

            // Small delay between downloads to avoid browser blocking
            if (i < selectedProjects.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          } else {
            console.error(`Failed to export project ${projectId}`);
          }
        } catch (projectError) {
          console.error(`Error exporting project ${projectId}:`, projectError);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Bulk PDF Export Completed",
          description: `Successfully exported ${successCount} out of ${selectedProjects.length} material handover PDFs.`,
        });

        if (successCount < selectedProjects.length) {
          toast({
            title: "Some exports failed",
            description: `${selectedProjects.length - successCount} projects failed to export. Check console for details.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Export Failed",
          description: "None of the selected projects could be exported.",
          variant: "destructive",
        });
      }

      setSelectedProjects([]);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Network error occurred during bulk export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSingleProjectPDF = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfConfig),
      });

      if (response.ok) {
        // Get the blob from the response
        const blob = await response.blob();

        // Create a download link and trigger the download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Material_Handover_${projectId}.pdf`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "PDF Export Successful",
          description: `Material handover PDF "${filename}" has been downloaded.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Export Failed",
          description: error.error || "Failed to generate PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Network error occurred during PDF export",
        variant: "destructive",
      });
    }
  };

  const saveConfiguration = () => {
    localStorage.setItem('pdfConfig', JSON.stringify(pdfConfig));
    toast({
      title: "Configuration Saved",
      description: "PDF configuration has been saved successfully.",
    });
  };

  const loadConfiguration = () => {
    const saved = localStorage.getItem('pdfConfig');
    if (saved) {
      setPdfConfig(JSON.parse(saved));
      toast({
        title: "Configuration Loaded",
        description: "PDF configuration has been loaded from saved settings.",
      });
    } else {
      toast({
        title: "No Saved Configuration",
        description: "No saved configuration found. Using default settings.",
        variant: "destructive",
      });
    }
  };

  const resetConfiguration = () => {
    setPdfConfig({
      companyName: "PT. QUICKBOM INDONESIA",
      companyAddress: "Jl. Raya Industri No. 123, Jakarta Pusat",
      companyPhone: "(021) 1234-5678",
      companyEmail: "procurement@quickbom.id",
      documentTitle: "SURAT SERAH TERIMA MATERIAL",
      requesterTitle: "Requester",
      approverTitle: "Approved By",
      showProjectDescription: true,
      showClientInfo: true,
      showMaterialDetails: true,
      showSignatureSection: true,
      includeAssemblyBreakdown: false,
      customFooter: "Dokumen ini dibuat secara otomatis oleh sistem QuickBom"
    });
    toast({
      title: "Configuration Reset",
      description: "PDF configuration has been reset to default settings.",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PDF Configuration</h1>
          <p className="text-muted-foreground">
            Configure and export material handover PDFs for projects
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* PDF Configuration Panel */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                PDF Configuration
              </CardTitle>
              <CardDescription>
                Customize the appearance and content of material handover PDFs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Company Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={pdfConfig.companyName}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={pdfConfig.companyAddress}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, companyAddress: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={pdfConfig.companyPhone}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, companyPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    value={pdfConfig.companyEmail}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, companyEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Document Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Document Settings</h4>
                <div className="space-y-2">
                  <Label htmlFor="documentTitle">Document Title</Label>
                  <Input
                    id="documentTitle"
                    value={pdfConfig.documentTitle}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, documentTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterTitle">Requester Title</Label>
                  <Input
                    id="requesterTitle"
                    value={pdfConfig.requesterTitle}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, requesterTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approverTitle">Approver Title</Label>
                  <Input
                    id="approverTitle"
                    value={pdfConfig.approverTitle}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, approverTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customFooter">Footer Text</Label>
                  <Textarea
                    id="customFooter"
                    value={pdfConfig.customFooter}
                    onChange={(e) => setPdfConfig({ ...pdfConfig, customFooter: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Content Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Content Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showProjectDescription"
                      checked={pdfConfig.showProjectDescription}
                      onCheckedChange={(checked) =>
                        setPdfConfig({ ...pdfConfig, showProjectDescription: checked as boolean })
                      }
                    />
                    <Label htmlFor="showProjectDescription">Show Project Description</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showClientInfo"
                      checked={pdfConfig.showClientInfo}
                      onCheckedChange={(checked) =>
                        setPdfConfig({ ...pdfConfig, showClientInfo: checked as boolean })
                      }
                    />
                    <Label htmlFor="showClientInfo">Show Client Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showMaterialDetails"
                      checked={pdfConfig.showMaterialDetails}
                      onCheckedChange={(checked) =>
                        setPdfConfig({ ...pdfConfig, showMaterialDetails: checked as boolean })
                      }
                    />
                    <Label htmlFor="showMaterialDetails">Show Material Details</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showSignatureSection"
                      checked={pdfConfig.showSignatureSection}
                      onCheckedChange={(checked) =>
                        setPdfConfig({ ...pdfConfig, showSignatureSection: checked as boolean })
                      }
                    />
                    <Label htmlFor="showSignatureSection">Show Signature Section</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAssemblyBreakdown"
                      checked={pdfConfig.includeAssemblyBreakdown}
                      onCheckedChange={(checked) =>
                        setPdfConfig({ ...pdfConfig, includeAssemblyBreakdown: checked as boolean })
                      }
                    />
                    <Label htmlFor="includeAssemblyBreakdown">Include Assembly Breakdown</Label>
                  </div>
                </div>
              </div>

              {/* Configuration Actions */}
              <div className="space-y-2 pt-4 border-t">
                <Button onClick={saveConfiguration} className="w-full" variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
                <Button onClick={loadConfiguration} className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Configuration
                </Button>
                <Button onClick={resetConfiguration} className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Projects with Templates
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedProjects.length} of {projects.length} selected
                </div>
              </CardTitle>
              <CardDescription>
                Select projects to export material handover PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects with templates</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create projects with templates to generate material handover PDFs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bulk Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedProjects.length === projects.length && projects.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label>Select All</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={exportSelectedProjectsPDF}
                        disabled={selectedProjects.length === 0 || isExporting}
                      >
                        {isExporting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Export Selected ({selectedProjects.length})
                      </Button>
                    </div>
                  </div>

                  {/* Projects Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedProjects.length === projects.length && projects.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProjects.includes(project.id)}
                              onCheckedChange={(checked) => handleSelectProject(project.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {project.template?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {project.client ?
                              (project.client.clientType === 'COMPANY' ? project.client.companyName : project.client.contactPerson)
                              : "-"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(Number(project.totalPrice))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportSingleProjectPDF(project.id)}
                                title="Export PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedProjectForPreview(project)}
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>PDF Preview - {project.name}</DialogTitle>
                                    <DialogDescription>
                                      Preview of the material handover PDF configuration
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                      <h4 className="font-semibold mb-2">Company Header</h4>
                                      <p className="text-sm">{pdfConfig.companyName}</p>
                                      <p className="text-sm text-muted-foreground">{pdfConfig.companyAddress}</p>
                                      <p className="text-sm text-muted-foreground">{pdfConfig.companyPhone} | {pdfConfig.companyEmail}</p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                      <h4 className="font-semibold mb-2">Document Title</h4>
                                      <p className="text-lg font-bold">{pdfConfig.documentTitle}</p>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                      <h4 className="font-semibold mb-2">Project Information</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><strong>Project:</strong> {project.name}</div>
                                        <div><strong>Template:</strong> {project.template?.name}</div>
                                        <div><strong>Client:</strong> {project.client?.contactPerson}</div>
                                        <div><strong>Value:</strong> {formatCurrency(Number(project.totalPrice))}</div>
                                      </div>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                      <h4 className="font-semibold mb-2">Signature Section</h4>
                                      <div className="flex justify-between text-sm">
                                        <div>
                                          <strong>{pdfConfig.requesterTitle}</strong><br/>
                                          ____________________<br/>
                                          Nama: ____________________<br/>
                                          Jabatan: ____________________
                                        </div>
                                        <div>
                                          <strong>{pdfConfig.approverTitle}</strong><br/>
                                          ____________________<br/>
                                          Nama: ____________________<br/>
                                          Jabatan: ____________________
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
