"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, formatDateForCSV, formatCurrencyForCSV } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  Building2,
  MapPin,
  DollarSign,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Globe,
  CreditCard,
  Briefcase,
  User as UserIcon,
  Download
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Types for Client Management
interface Client {
  id: string;
  clientType: string;
  category: string;
  status: string;
  companyName: string | null;
  companyType: string | null;
  businessLicense: string | null;
  taxId: string | null;
  contactPerson: string;
  contactTitle: string | null;
  contactEmail: string;
  contactPhone: string;
  contactPhone2: string | null;
  address: string;
  city: string;
  province: string;
  postalCode: string | null;
  country: string;
  industry: string | null;
  companySize: string | null;
  annualRevenue: number | null;
  creditLimit: number | null;
  paymentTerms: string | null;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalContractValue: number;
  outstandingBalance: number;
  website: string | null;
  specialNotes: string | null;
  createdAt: string;
}

export default function ClientManagementPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    clientType: "INDIVIDUAL",
    category: "RESIDENTIAL",
    status: "ACTIVE",
    companyName: "",
    companyType: "",
    businessLicense: "",
    taxId: "",
    contactPerson: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    contactPhone2: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Indonesia",
    industry: "",
    companySize: "",
    annualRevenue: "",
    creditLimit: "",
    paymentTerms: "",
    website: "",
    specialNotes: ""
  });

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchTerm ||
        client.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || client.clientType === typeFilter;
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || client.category === categoryFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [clients, searchTerm, typeFilter, statusFilter, categoryFilter]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = selectedClient ? `/api/clients/${selectedClient.id}` : "/api/clients";
      const method = selectedClient ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          annualRevenue: formData.annualRevenue ? parseFloat(formData.annualRevenue) : null,
          creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Client ${selectedClient ? "updated" : "created"} successfully`,
        });
        fetchClients();
        setShowCreateDialog(false);
        setShowEditDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save client",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client deleted successfully",
        });
        fetchClients();
        setShowDeleteDialog(false);
        setSelectedClient(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete client",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      clientType: "INDIVIDUAL",
      category: "RESIDENTIAL",
      status: "ACTIVE",
      companyName: "",
      companyType: "",
      businessLicense: "",
      taxId: "",
      contactPerson: "",
      contactTitle: "",
      contactEmail: "",
      contactPhone: "",
      contactPhone2: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Indonesia",
      industry: "",
      companySize: "",
      annualRevenue: "",
      creditLimit: "",
      paymentTerms: "",
      website: "",
      specialNotes: ""
    });
    setSelectedClient(null);
  };

  // Open edit dialog
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      clientType: client.clientType,
      category: client.category,
      status: client.status,
      companyName: client.companyName || "",
      companyType: client.companyType || "",
      businessLicense: client.businessLicense || "",
      taxId: client.taxId || "",
      contactPerson: client.contactPerson,
      contactTitle: client.contactTitle || "",
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      contactPhone2: client.contactPhone2 || "",
      address: client.address,
      city: client.city,
      province: client.province,
      postalCode: client.postalCode || "",
      country: client.country,
      industry: client.industry || "",
      companySize: client.companySize || "",
      annualRevenue: client.annualRevenue?.toString() || "",
      creditLimit: client.creditLimit?.toString() || "",
      paymentTerms: client.paymentTerms || "",
      website: client.website || "",
      specialNotes: client.specialNotes || ""
    });
    setShowEditDialog(true);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      BLACKLISTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    };
    return colors[status as keyof typeof colors] || colors.ACTIVE;
  };

  // Get client type badge color
  const getClientTypeBadgeColor = (type: string) => {
    const colors = {
      INDIVIDUAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      COMPANY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      GOVERNMENT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      CONTRACTOR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      PARTNERSHIP: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      NON_PROFIT: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
    };
    return colors[type as keyof typeof colors] || colors.INDIVIDUAL;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format client type display name
  const formatClientTypeName = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format category display name
  const formatCategoryName = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (filteredClients.length === 0) {
      toast({
        title: "No Data",
        description: "No clients to export",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for CSV export - use database column names for Supabase compatibility
    const csvData = filteredClients.map(client => ({
      clientType: client.clientType,
      category: client.category,
      status: client.status,
      companyName: client.companyName || '',
      companyType: client.companyType || '',
      businessLicense: client.businessLicense || '',
      taxId: client.taxId || '',
      contactPerson: client.contactPerson,
      contactTitle: client.contactTitle || '',
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      contactPhone2: client.contactPhone2 || '',
      address: client.address,
      city: client.city,
      province: client.province,
      postalCode: client.postalCode || '',
      country: client.country,
      industry: client.industry || '',
      companySize: client.companySize || '',
      annualRevenue: client.annualRevenue ? client.annualRevenue.toString() : '',
      creditLimit: client.creditLimit ? client.creditLimit.toString() : '',
      paymentTerms: client.paymentTerms || '',
      website: client.website || '',
      totalProjects: client.totalProjects,
      activeProjects: client.activeProjects,
      completedProjects: client.completedProjects,
      totalContractValue: client.totalContractValue,
      outstandingBalance: client.outstandingBalance,
      specialNotes: client.specialNotes || ''
    }));

    // Define CSV headers - use database column names for Supabase import
    const headers = [
      'clientType',
      'category',
      'status',
      'companyName',
      'companyType',
      'businessLicense',
      'taxId',
      'contactPerson',
      'contactTitle',
      'contactEmail',
      'contactPhone',
      'contactPhone2',
      'address',
      'city',
      'province',
      'postalCode',
      'country',
      'industry',
      'companySize',
      'annualRevenue',
      'creditLimit',
      'paymentTerms',
      'website',
      'totalProjects',
      'activeProjects',
      'completedProjects',
      'totalContractValue',
      'outstandingBalance',
      'specialNotes'
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `clients_export_${timestamp}`;

    // Export to CSV
    exportToCSV(csvData, filename, headers);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredClients.length} clients to CSV (Supabase-compatible format)`,
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">Manage clients and business relationships</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === 'ACTIVE').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contract Value</p>
                <p className="text-lg font-bold">{formatCurrency(clients.reduce((sum, c) => sum + c.totalContractValue, 0))}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold">{clients.filter(c => c.clientType === 'COMPANY').length}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by company name, contact person, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COMPANY">Company</SelectItem>
                  <SelectItem value="GOVERNMENT">Government</SelectItem>
                  <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                  <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                  <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                  <SelectItem value="RENOVATION">Renovation</SelectItem>
                  <SelectItem value="LAND_DEVELOPMENT">Land Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
          <CardDescription>Manage client information and business relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contract Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                          {client.clientType === 'COMPANY' ?
                            <Building className="h-4 w-4 text-primary" /> :
                            <UserIcon className="h-4 w-4 text-primary" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {client.clientType === 'COMPANY' ? client.companyName : client.contactPerson}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.clientType === 'COMPANY' ? client.contactPerson : client.contactEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getClientTypeBadgeColor(client.clientType)}>
                      {formatClientTypeName(client.clientType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatCategoryName(client.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(client.status)}>
                      {client.status === 'PENDING_APPROVAL' ? 'Pending' :
                       client.status === 'UNDER_REVIEW' ? 'Review' :
                       client.status === 'ACTIVE' ? 'Active' :
                       client.status === 'INACTIVE' ? 'Inactive' : 'Blacklisted'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.contactEmail}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.contactPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.city}, {client.province}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {formatCurrency(client.totalContractValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.totalProjects} projects
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No clients found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Client Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a comprehensive client profile with business information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientType">Client Type *</Label>
                  <Select value={formData.clientType} onValueChange={(value) => setFormData({...formData, clientType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="GOVERNMENT">Government</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                      <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                      <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                      <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                      <SelectItem value="INFRASTRUCTURE">Infrastructure</SelectItem>
                      <SelectItem value="RENOVATION">Renovation</SelectItem>
                      <SelectItem value="LAND_DEVELOPMENT">Land Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Company Information */}
            {formData.clientType !== 'INDIVIDUAL' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyType">Company Type</Label>
                    <Select value={formData.companyType} onValueChange={(value) => setFormData({...formData, companyType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                        <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                        <SelectItem value="UD">UD (Usaha Dagang)</SelectItem>
                        <SelectItem value="Koperasi">Koperasi</SelectItem>
                        <SelectItem value="Yayasan">Yayasan</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessLicense">Business License (SIUP/TDP)</Label>
                    <Input
                      id="businessLicense"
                      value={formData.businessLicense}
                      onChange={(e) => setFormData({...formData, businessLicense: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID (NPWP)</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Construction, Real Estate"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select value={formData.companySize} onValueChange={(value) => setFormData({...formData, companySize: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Micro">Micro (1-9 employees)</SelectItem>
                        <SelectItem value="Small">Small (10-49 employees)</SelectItem>
                        <SelectItem value="Medium">Medium (50-249 employees)</SelectItem>
                        <SelectItem value="Large">Large (250+ employees)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="annualRevenue">Annual Revenue (IDR)</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      placeholder="e.g., 1000000000"
                      value={formData.annualRevenue}
                      onChange={(e) => setFormData({...formData, annualRevenue: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="contactTitle">Job Title</Label>
                  <Input
                    id="contactTitle"
                    placeholder="e.g., CEO, Project Manager"
                    value={formData.contactTitle}
                    onChange={(e) => setFormData({...formData, contactTitle: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone *</Label>
                  <Input
                    id="contactPhone"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactPhone2">Secondary Phone</Label>
                <Input
                  id="contactPhone2"
                  value={formData.contactPhone2}
                  onChange={(e) => setFormData({...formData, contactPhone2: e.target.value})}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditLimit">Credit Limit (IDR)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    placeholder="e.g., 50000000"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(value) => setFormData({...formData, paymentTerms: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Net 15">Net 15 days</SelectItem>
                      <SelectItem value="Net 30">Net 30 days</SelectItem>
                      <SelectItem value="Net 45">Net 45 days</SelectItem>
                      <SelectItem value="Net 60">Net 60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialNotes">Special Notes</Label>
                <Textarea
                  id="specialNotes"
                  rows={3}
                  placeholder="Any special requirements, preferences, or important notes about this client"
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({...formData, specialNotes: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information and business details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Same form fields as create dialog - abbreviated for space */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-clientType">Client Type *</Label>
                  <Select value={formData.clientType} onValueChange={(value) => setFormData({...formData, clientType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPANY">Company</SelectItem>
                      <SelectItem value="GOVERNMENT">Government</SelectItem>
                      <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                      <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                      <SelectItem value="NON_PROFIT">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                      <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                  <Input
                    id="edit-contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactEmail">Email *</Label>
                  <Input
                    id="edit-contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        type="destructive"
        title="Delete Client"
        description={`Are you sure you want to delete client "${selectedClient?.companyName || selectedClient?.contactPerson}"? This action cannot be undone.`}
        confirmText="Delete Client"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        destructive={true}
      />
    </div>
  );
}
