"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  Database,
  Settings,
  BarChart3,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Search,
  Home,
  UserPlus,
  LogIn,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Archive,
  Activity,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Info,
  MousePointer,
  Monitor,
  Smartphone,
  Layers,
  GitBranch,
  Zap,
  FolderOpen
} from "lucide-react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContent = (content: string) => {
    if (!searchQuery) return true;
    return content.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-4 bg-primary/10 rounded-2xl">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">User Guide & Documentation</h1>
          <p className="text-xl text-muted-foreground mt-2 max-w-3xl mx-auto">
            Complete guide to using QuickBom - from initial setup to advanced features.
            Learn how to manage your bill of materials, assemblies, and backup systems effectively.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Home, label: "Getting Started", section: "overview" },
          { icon: Users, label: "User Management", section: "users" },
          { icon: Database, label: "Materials", section: "materials" },
          { icon: Settings, label: "Assemblies", section: "assemblies" },
          { icon: FileText, label: "Templates", section: "templates" },
          { icon: Shield, label: "Backup System", section: "backup" }
        ].map((item, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => document.getElementById(item.section)?.scrollIntoView({ behavior: 'smooth' })}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assemblies">Assemblies</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* Application Overview & Flow */}
        <TabsContent value="overview" id="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Application Overview & Process Flow
              </CardTitle>
              <CardDescription>
                Complete workflow from initial setup to production use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Application Purpose */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">What is QuickBom?</h3>
                <p className="text-muted-foreground">
                  QuickBom is a comprehensive Bill of Materials (BOM) management system designed for manufacturing and engineering teams.
                  It helps you organize, track, and manage all components, assemblies, and templates needed for your projects.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 border rounded-lg text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-medium">Materials Management</h4>
                    <p className="text-sm text-muted-foreground">Organize and track all your components</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-medium">Assembly Builder</h4>
                    <p className="text-sm text-muted-foreground">Create complex product configurations</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-medium">Template System</h4>
                    <p className="text-sm text-muted-foreground">Reuse configurations across projects</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Process Flow */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Complete Process Flow
                </h3>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Initial Setup & User Registration</h4>
                      <p className="text-muted-foreground">
                        Register as a new user or log in to existing account. The system will guide you through the initial setup process.
                      </p>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        → Navigate to /register or /login
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Build Your Materials Database</h4>
                      <p className="text-muted-foreground">
                        Start by adding all the components and materials you'll need. Include specifications, prices, manufacturers, and datasheets.
                      </p>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        Go to Materials section → Click "Add Material"
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Create Assemblies</h4>
                      <p className="text-muted-foreground">
                        Combine materials into assemblies. Define quantities, relationships, and documentation for each assembly.
                      </p>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        → Go to Assemblies section → Click "Create Assembly" → Add materials from your database
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Build Templates</h4>
                      <p className="text-muted-foreground">
                        Create reusable templates by combining multiple assemblies. This allows you to quickly replicate complex configurations.
                      </p>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        → Go to Templates section → Click "Create Template" → Add assemblies
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      5
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">Regular Maintenance & Backup</h4>
                      <p className="text-muted-foreground">
                        The system automatically backs up your data daily. Monitor backup status and create manual backups for important changes.
                      </p>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        → Go to Backup section → Monitor automated backups → Create manual backups as needed
                      </div>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      ✓
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-green-700 dark:text-green-300">Production Ready</h4>
                      <p className="text-muted-foreground">
                        Your BOM system is now fully configured and ready for production use. Continue adding materials, updating assemblies, and maintaining your templates as your needs evolve.
                      </p>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        → System is fully operational with automated backups and monitoring
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* UI Flow Diagram */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Application UI Flow Diagram
                </h3>

                <div className="space-y-6">
                  {/* Authentication Flow */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Authentication Flow</h4>
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <UserPlus className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-center">Register</span>
                        <span className="text-xs text-muted-foreground">/register</span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-blue-500" />

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <LogIn className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-center">Login</span>
                        <span className="text-xs text-muted-foreground">/login</span>
                      </div>

                      <ArrowRight className="h-4 w-4 text-green-500" />

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-medium text-center">Dashboard</span>
                        <span className="text-xs text-muted-foreground">/</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Application Flow */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Main Application Flow</h4>

                    <div className="relative">
                      {/* Flow Chart with Curved Lines */}
                      <div className="flex flex-col items-center space-y-8">
                        {/* Authentication Row */}
                        <div className="flex items-end gap-6">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                              <UserPlus className="h-8 w-8 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Register</span>
                            <span className="text-xs text-muted-foreground">/register</span>
                          </div>

                          {/* Curved arrow */}
                          <svg width="80" height="40" className="mb-8">
                            <path
                              d="M 0 20 Q 40 0 80 20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              className="text-blue-500"
                              strokeLinecap="round"
                            />
                            <polygon
                              points="75,15 85,20 75,25"
                              fill="currentColor"
                              className="text-blue-500"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3">
                              <LogIn className="h-8 w-8 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Login</span>
                            <span className="text-xs text-muted-foreground">/login</span>
                          </div>

                          {/* Curved arrow */}
                          <svg width="80" height="40" className="mb-8">
                            <path
                              d="M 0 20 Q 40 0 80 20"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              className="text-green-500"
                              strokeLinecap="round"
                            />
                            <polygon
                              points="75,15 85,20 75,25"
                              fill="currentColor"
                              className="text-green-500"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                              <Home className="h-8 w-8 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Dashboard</span>
                            <span className="text-xs text-muted-foreground">/</span>
                          </div>
                        </div>

                        {/* Downward arrow to main sections */}
                        <svg width="40" height="60">
                          <path
                            d="M 20 0 L 20 45"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="text-primary"
                          />
                          <polygon
                            points="15,40 20,50 25,40"
                            fill="currentColor"
                            className="text-primary"
                          />
                        </svg>

                        {/* Main Sections Row */}
                        <div className="flex items-end gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                              <Database className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Materials</span>
                            <span className="text-xs text-muted-foreground">/materials</span>
                            <span className="text-xs text-blue-600 mt-1">Add/Edit</span>
                          </div>

                          {/* Curved connection */}
                          <svg width="50" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 25 0 50 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="5,5"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-3">
                              <Settings className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Assemblies</span>
                            <span className="text-xs text-muted-foreground">/assemblies</span>
                            <span className="text-xs text-green-600 mt-1">Build Products</span>
                          </div>

                          {/* Curved connection */}
                          <svg width="50" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 25 0 50 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="5,5"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
                              <FolderOpen className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Projects</span>
                            <span className="text-xs text-muted-foreground">/projects</span>
                            <span className="text-xs text-indigo-600 mt-1">Manage Work</span>
                          </div>

                          {/* Curved connection */}
                          <svg width="50" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 25 0 50 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="5,5"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                              <FileText className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Templates</span>
                            <span className="text-xs text-muted-foreground">/templates</span>
                            <span className="text-xs text-purple-600 mt-1">Reuse Configs</span>
                          </div>

                          {/* Curved connection */}
                          <svg width="50" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 25 0 50 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="5,5"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mb-3">
                              <Shield className="h-7 w-7 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Backup</span>
                            <span className="text-xs text-muted-foreground">/backups</span>
                            <span className="text-xs text-orange-600 mt-1">Data Protection</span>
                          </div>
                        </div>

                        {/* Additional Features Row */}
                        <div className="flex items-center justify-center gap-8 mt-6">
                          {/* Downward arrow */}
                          <svg width="30" height="40" className="rotate-90">
                            <path
                              d="M 0 20 L 25 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="text-gray-400"
                            />
                            <polygon
                              points="20,15 30,20 20,25"
                              fill="currentColor"
                              className="text-gray-400"
                            />
                          </svg>

                          <span className="text-xs text-muted-foreground font-medium px-4 py-2 bg-muted/50 rounded-full">
                            Additional Features
                          </span>

                          <svg width="30" height="40" className="rotate-90">
                            <path
                              d="M 0 20 L 25 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="text-gray-400"
                            />
                            <polygon
                              points="20,15 30,20 20,25"
                              fill="currentColor"
                              className="text-gray-400"
                            />
                          </svg>
                        </div>

                        {/* Additional Features */}
                        <div className="flex items-end gap-6 mt-4">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mb-3">
                              <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Gantt Chart</span>
                            <span className="text-xs text-muted-foreground">/gantt</span>
                            <span className="text-xs text-cyan-600 mt-1">Timeline View</span>
                          </div>

                          <svg width="40" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 20 0 40 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="3,3"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-3">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">PDF Config</span>
                            <span className="text-xs text-muted-foreground">/pdf-config</span>
                            <span className="text-xs text-pink-600 mt-1">Export Tools</span>
                          </div>

                          <svg width="40" height="30" className="mb-6">
                            <path
                              d="M 0 20 Q 20 0 40 20"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-gray-400"
                              strokeLinecap="round"
                              strokeDasharray="3,3"
                            />
                          </svg>

                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-3">
                              <HelpCircle className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-center">Help & Docs</span>
                            <span className="text-xs text-muted-foreground">/help</span>
                            <span className="text-xs text-emerald-600 mt-1">User Guide</span>
                          </div>
                        </div>
                      </div>

                      {/* Cross-navigation indicator */}
                      <div className="flex justify-center mt-8">
                        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-full">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">
                            Bidirectional navigation between all sections
                          </span>
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Journey Summary */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Typical User Journey</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">1</span>
                          </div>
                          <h5 className="font-medium">Setup Phase</h5>
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Register/Login</li>
                          <li>• Explore Dashboard</li>
                          <li>• Add initial materials</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">2</span>
                          </div>
                          <h5 className="font-medium">Build Phase</h5>
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Create assemblies</li>
                          <li>• Build templates</li>
                          <li>• Organize components</li>
                        </ul>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">3</span>
                          </div>
                          <h5 className="font-medium">Maintain Phase</h5>
                        </div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• Monitor backups</li>
                          <li>• Update data regularly</li>
                          <li>• Use templates efficiently</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Tips */}
                  <Alert>
                    <MousePointer className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Navigation Tips:</strong> Use the sidebar menu to quickly jump between sections.
                      The breadcrumb navigation helps you understand your current location within the app.
                      Keyboard shortcuts are available for power users.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <Separator />

              {/* Key Features Overview */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Key Features at a Glance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Automated Backup System
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Daily automatic backups with manual backup options and data restoration capabilities.
                    </p>

                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Real-time Collaboration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Multi-user support with role-based access control and audit logging.
                    </p>

                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Comprehensive Reporting
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Detailed analytics and database analysis tools for capacity planning.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Flexible Templates
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Create reusable configurations that can be applied across multiple projects.
                    </p>

                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Price Management
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Track component costs and calculate assembly pricing automatically.
                    </p>

                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Documentation Support
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Attach datasheets, manuals, and specifications to materials and assemblies.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" id="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                User Management Guide
              </CardTitle>
              <CardDescription>
                Account registration, login, and user profile management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="registration">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-4 w-4" />
                      <span>Creating a New Account</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Step-by-Step Registration:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Navigate to the registration page (/register)</li>
                        <li>Fill in your full name, email address, and choose a secure password</li>
                        <li>Agree to the terms of service and privacy policy</li>
                        <li>Click "Create Account" to complete registration</li>
                        <li>Check your email for account verification (if required)</li>
                        <li>Log in with your new credentials</li>
                      </ol>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Password Requirements:</strong> Minimum 8 characters, including uppercase, lowercase, and numbers.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="login">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <LogIn className="h-4 w-4" />
                      <span>Logging In</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Login Process:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Go to the login page (/login)</li>
                        <li>Enter your email address and password</li>
                        <li>Click "Sign In" or press Enter</li>
                        <li>You will be redirected to the dashboard</li>
                      </ol>

                      <div className="space-y-2">
                        <h4 className="font-medium">Troubleshooting Login Issues:</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li><strong>Forgot Password:</strong> Click "Forgot Password" link and follow email instructions</li>
                          <li><strong>Account Locked:</strong> Contact administrator if account becomes locked after multiple failed attempts</li>
                          <li><strong>Email Not Verified:</strong> Check your email for verification link</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="profile">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span>Managing Your Profile</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Profile Management Options:</h4>

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-sm">Update Personal Information:</h5>
                          <ul className="list-disc list-inside text-sm ml-4 space-y-1">
                            <li>Change your name or display preferences</li>
                            <li>Update contact information</li>
                            <li>Modify notification settings</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-sm">Security Settings:</h5>
                          <ul className="list-disc list-inside text-sm ml-4 space-y-1">
                            <li>Change password regularly</li>
                            <li>Enable two-factor authentication (if available)</li>
                            <li>Review login history and active sessions</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-sm">Account Preferences:</h5>
                          <ul className="list-disc list-inside text-sm ml-4 space-y-1">
                            <li>Choose theme (light/dark mode)</li>
                            <li>Set language and timezone preferences</li>
                            <li>Configure dashboard layout</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Management */}
        <TabsContent value="materials" id="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                Materials Management Guide
              </CardTitle>
              <CardDescription>
                Complete guide to managing your component database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="adding-materials">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <span>Adding New Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Required Information:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Basic Information:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Name (required)</li>
                            <li>• Part Number (required)</li>
                            <li>• Manufacturer</li>
                            <li>• Unit of Measurement</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Additional Details:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Price per unit</li>
                            <li>• Purchase URL</li>
                            <li>• Datasheet file</li>
                            <li>• Description</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Step-by-Step Process:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Navigate to the Materials section from the sidebar</li>
                          <li>Click the "Add Material" button</li>
                          <li>Fill in all required fields (marked with *)</li>
                          <li>Upload datasheet if available (PDF, DOC, DOCX)</li>
                          <li>Add price information for cost tracking</li>
                          <li>Click "Save" to add the material to your database</li>
                        </ol>
                      </div>

                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pro Tip:</strong> Use consistent naming conventions and include manufacturer part numbers for easy identification.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="editing-materials">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Edit className="h-4 w-4" />
                      <span>Editing Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">How to Edit Materials:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Go to the Materials section</li>
                        <li>Find the material you want to edit in the table</li>
                        <li>Click the "Edit" button (pencil icon) in the Actions column</li>
                        <li>Update any information as needed</li>
                        <li>Click "Save Changes" to apply updates</li>
                        <li>Click "Cancel" to discard changes</li>
                      </ol>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> Be careful when changing part numbers or critical specifications, as this may affect existing assemblies.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="searching-materials">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4" />
                      <span>Searching and Filtering Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Search and Filter Options:</h4>

                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium">Text Search:</h5>
                          <p className="text-sm text-muted-foreground">
                            Use the search bar to find materials by name, part number, or manufacturer.
                          </p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Advanced Filters:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Filter by manufacturer</li>
                            <li>• Filter by unit type</li>
                            <li>• Filter by price range</li>
                            <li>• Filter by date added</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Sorting Options:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Sort by name (A-Z, Z-A)</li>
                            <li>• Sort by price (low to high, high to low)</li>
                            <li>• Sort by date added (newest first, oldest first)</li>
                            <li>• Sort by manufacturer</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assemblies Management */}
        <TabsContent value="assemblies" id="assemblies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                Assemblies Management Guide
              </CardTitle>
              <CardDescription>
                Building and managing product assemblies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="creating-assemblies">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <span>Creating New Assemblies</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Assembly Creation Process:</h4>
                      <ol className="list-decimal list-inside space-y-3 text-sm">
                        <li>
                          <strong>Navigate to Assemblies:</strong> Go to the Assemblies section from the sidebar menu.
                        </li>
                        <li>
                          <strong>Start New Assembly:</strong> Click the "Create Assembly" button to open the assembly builder.
                        </li>
                        <li>
                          <strong>Basic Information:</strong>
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>• Enter assembly name (required)</li>
                            <li>• Add description (recommended)</li>
                            <li>• Attach documentation if available</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Add Materials:</strong>
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>• Click "Add Material" button</li>
                            <li>• Search and select materials from your database</li>
                            <li>• Specify quantity needed for this assembly</li>
                            <li>• Add multiple materials as required</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Review and Save:</strong>
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>• Review the complete bill of materials</li>
                            <li>• Check total cost calculation</li>
                            <li>• Save the assembly to your database</li>
                          </ul>
                        </li>
                      </ol>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Cost Calculation:</strong> The system automatically calculates total assembly cost based on material quantities and prices.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="managing-materials">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4" />
                      <span>Managing Assembly Materials</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Material Management in Assemblies:</h4>

                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium">Adding Materials:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Use the material selector to search your database</li>
                            <li>• Specify exact quantities needed</li>
                            <li>• Add notes for special requirements</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Editing Quantities:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Click on quantity values to edit inline</li>
                            <li>• Use up/down arrows for precise adjustments</li>
                            <li>• Changes automatically update total costs</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Removing Materials:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Click the remove (X) button next to unwanted materials</li>
                            <li>• Confirm removal in the dialog</li>
                            <li>• System recalculates costs automatically</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="assembly-templates">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <span>Using Assembly Templates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Assembly Templates Overview:</h4>
                      <p className="text-sm text-muted-foreground">
                        Templates allow you to save and reuse assembly configurations across multiple projects.
                      </p>

                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium">Creating Templates:</h5>
                          <ol className="text-sm space-y-1 ml-4">
                            <li>Build your assembly as usual</li>
                            <li>Click "Save as Template" button</li>
                            <li>Give it a descriptive name and description</li>
                            <li>Choose visibility (private or shared)</li>
                          </ol>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Using Templates:</h5>
                          <ol className="text-sm space-y-1 ml-4">
                            <li>Go to Templates section</li>
                            <li>Select desired template</li>
                            <li>Click "Use Template" to create new assembly</li>
                            <li>Modify quantities as needed for specific project</li>
                          </ol>
                        </div>
                      </div>

                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Best Practice:</strong> Create templates for commonly used assemblies to speed up project setup.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Management */}
        <TabsContent value="templates" id="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                Templates Management Guide
              </CardTitle>
              <CardDescription>
                Creating and managing reusable project templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="template-creation">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Plus className="h-4 w-4" />
                      <span>Creating Project Templates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Template Creation Workflow:</h4>

                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium">Step 1: Plan Your Template</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Identify the type of project this template will serve</li>
                            <li>• List all assemblies that are typically needed</li>
                            <li>• Consider variations and customization options</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Step 2: Build the Template</h5>
                          <ol className="text-sm space-y-1 ml-4">
                            <li>Navigate to Templates section</li>
                            <li>Click "Create New Template"</li>
                            <li>Enter template name and detailed description</li>
                            <li>Add assemblies one by one</li>
                            <li>Specify default quantities for each assembly</li>
                            <li>Add template documentation or notes</li>
                          </ol>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Step 3: Configure Settings</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Set visibility (private/shared/team)</li>
                            <li>• Add tags for easy searching</li>
                            <li>• Set default project settings if applicable</li>
                            <li>• Add usage instructions for team members</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Step 4: Save and Test</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Save the template</li>
                            <li>• Test by creating a new project from the template</li>
                            <li>• Verify all assemblies and quantities are correct</li>
                            <li>• Make adjustments as needed</li>
                          </ul>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Template Types:</strong> Create templates for specific product lines, customer types, or project categories.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="template-usage">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-4 w-4" />
                      <span>Using Templates in Projects</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">How to Use Templates:</h4>
                      <ol className="list-decimal list-inside space-y-3 text-sm">
                        <li>
                          <strong>Find Template:</strong> Browse templates in the Templates section or use search filters.
                        </li>
                        <li>
                          <strong>Select Template:</strong> Click on the desired template to view details and contents.
                        </li>
                        <li>
                          <strong>Create Project:</strong> Click "Use Template" button to start a new project.
                        </li>
                        <li>
                          <strong>Customize:</strong>
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>• Adjust quantities based on specific requirements</li>
                            <li>• Add or remove assemblies as needed</li>
                            <li>• Modify material specifications if required</li>
                            <li>• Update pricing for current market rates</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Finalize:</strong> Save the customized project and begin production planning.
                        </li>
                      </ol>

                      <div className="space-y-2">
                        <h4 className="font-medium">Template Benefits:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>Consistency:</strong> Standardized configurations across similar projects</li>
                          <li>• <strong>Efficiency:</strong> Faster project setup and reduced errors</li>
                          <li>• <strong>Quality:</strong> Proven assemblies and material combinations</li>
                          <li>• <strong>Training:</strong> Easier onboarding for new team members</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="template-management">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span>Managing and Updating Templates</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Template Maintenance:</h4>

                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium">Regular Updates:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Review templates quarterly for outdated materials</li>
                            <li>• Update prices based on current supplier rates</li>
                            <li>• Add new assemblies as product lines evolve</li>
                            <li>• Update documentation and usage instructions</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Version Control:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Create new versions for significant changes</li>
                            <li>• Keep change logs for audit purposes</li>
                            <li>• Archive old versions for reference</li>
                            <li>• Communicate updates to team members</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium">Performance Monitoring:</h5>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Track which templates are most frequently used</li>
                            <li>• Monitor project success rates from template usage</li>
                            <li>• Gather feedback from team members</li>
                            <li>• Identify opportunities for improvement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup System */}
        <TabsContent value="backup" id="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                Backup System Guide
              </CardTitle>
              <CardDescription>
                Comprehensive data protection and recovery system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="backup-overview">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      <span>Backup System Overview</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">What Gets Backed Up:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 border rounded-lg text-center">
                          <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <div className="text-sm font-medium">Materials</div>
                          <div className="text-xs text-muted-foreground">All component data</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <Settings className="h-6 w-6 mx-auto mb-2 text-green-500" />
                          <div className="text-sm font-medium">Assemblies</div>
                          <div className="text-xs text-muted-foreground">Product configurations</div>
                        </div>
                        <div className="p-3 border rounded-lg text-center">
                          <FileText className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                          <div className="text-sm font-medium">Templates</div>
                          <div className="text-xs text-muted-foreground">Reusable configurations</div>
                        </div>
                      </div>

                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Note:</strong> User accounts and project data are managed separately for system stability.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="automatic-backups">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4" />
                      <span>Automatic Backup System</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Automated Backup Schedule:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Daily Backup</div>
                            <div className="text-xs text-muted-foreground">Complete database backup</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">02:00 AM WIB</div>
                            <Badge variant="secondary">Automatic</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">Cleanup Process</div>
                            <div className="text-xs text-muted-foreground">Remove backups &gt;7 days old</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">03:00 AM WIB</div>
                            <Badge variant="secondary">Automatic</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Backup File Format:</h4>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-mono text-sm">
                            daily_backup_YYYY-MM-DD.json
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Example: daily_backup_2025-12-07.json
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="manual-backups">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4" />
                      <span>Manual Backup Creation</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">When to Create Manual Backups:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Before major system updates or migrations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>After adding significant amounts of new data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Before implementing major configuration changes</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>When testing new features that might affect data</span>
                        </li>
                      </ul>

                      <div className="space-y-2">
                        <h4 className="font-medium">Manual Backup Process:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Navigate to the Backup section</li>
                          <li>Click "Create Manual Backup" button</li>
                          <li>Enter a descriptive backup name</li>
                          <li>Click "Create Backup" to start the process</li>
                          <li>Monitor progress in the backup history</li>
                        </ol>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Manual Backup Format:</h4>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-mono text-sm">
                            manual_CustomName_YYYY-MM-DD_HH-mm-ss-sss.json
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Example: manual_Before Major Update_2025-12-07_14-30-15-123.json
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="data-restoration">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4" />
                      <span>Data Restoration Process</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Warning:</strong> Data restoration will replace all current materials, assemblies, and templates. This action cannot be undone.
                        </AlertDescription>
                      </Alert>

                      <h4 className="font-medium">Restoration Steps:</h4>
                      <ol className="list-decimal list-inside space-y-3 text-sm">
                        <li>
                          <strong>Assess Situation:</strong> Determine which backup point to restore from based on the issue.
                        </li>
                        <li>
                          <strong>Review Backup:</strong> Check backup details and contents before restoration.
                        </li>
                        <li>
                          <strong>Create Safety Backup:</strong> Create a manual backup of current state (if possible).
                        </li>
                        <li>
                          <strong>Initiate Restore:</strong>
                          <ul className="ml-6 mt-2 space-y-1">
                            <li>• Go to Backup History</li>
                            <li>• Find the desired backup</li>
                            <li>• Click "Restore" button</li>
                            <li>• Confirm the restoration in the dialog</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Verify Results:</strong> Check that data has been restored correctly.
                        </li>
                        <li>
                          <strong>Update Dependencies:</strong> Review and update any affected projects or configurations.
                        </li>
                      </ol>

                      <div className="space-y-2">
                        <h4 className="font-medium">What Gets Restored:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• All materials with specifications and pricing</li>
                          <li>• All assemblies with their material relationships</li>
                          <li>• All templates and their configurations</li>
                          <li>• Material-assembly associations and quantities</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">What Doesn't Get Restored:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• User accounts and permissions</li>
                          <li>• Project-specific data and timelines</li>
                          <li>• System configuration and settings</li>
                          <li>• Uploaded files and documents</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="backup-monitoring">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4" />
                      <span>Monitoring Backup Health</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Key Metrics to Monitor:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Backup Success Rate:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Should be 100% for automated backups</li>
                            <li>• Monitor for failed backup attempts</li>
                            <li>• Check error logs for issues</li>
                          </ul>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Storage Usage:</h5>
                          <ul className="text-sm space-y-1">
                            <li>• Monitor total backup size</li>
                            <li>• Ensure adequate storage space</li>
                            <li>• Check cleanup process effectiveness</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Regular Maintenance Tasks:</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Review backup history weekly</li>
                          <li>• Test restoration process monthly</li>
                          <li>• Monitor storage capacity quarterly</li>
                          <li>• Update backup procedures as needed</li>
                        </ul>
                      </div>

                      <Alert>
                        <HelpCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pro Tip:</strong> Set up automated alerts for backup failures and low storage space to ensure continuous data protection.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Need additional help? Contact your system administrator or refer to the technical documentation.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline">QuickBom v1.0</Badge>
          <Badge variant="outline">Last Updated: December 2025</Badge>
        </div>
      </div>
    </div>
  );
}
