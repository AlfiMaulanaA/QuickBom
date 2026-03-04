"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Code2,
    BookOpen,
    Terminal,
    Globe,
    Lock,
    Database,
    FileJson,
    Link as LinkIcon,
    CheckCircle2,
    Info,
    Layers,
    Search,
    Package,
    Calculator
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ApiDocsPage() {
    const [activeEndpoint, setActiveEndpoint] = useState("get-project-boq");

    const endpoints = [
        {
            id: "get-project-boq",
            name: "Get Project BOQ",
            method: "GET",
            path: "/api/projects/{id}/boq",
            description: "Retrieves the full Bill of Quantities for a specific project, including hierarchical and consolidated views.",
            params: [
                { name: "id", type: "integer", required: true, description: "The unique ID of the project." }
            ],
            response: {
                projectId: 1,
                projectName: "Apartment Renovation",
                projectType: "Residential",
                hierarchy: [
                    {
                        id: 10,
                        name: "Electrical Installation",
                        module: "ELECTRICAL",
                        quantity: 1,
                        materials: [
                            {
                                id: "am_123",
                                name: "Copper Wire 2.5mm",
                                price: 15000,
                                totalQuantity: 100,
                                unit: "meters"
                            }
                        ]
                    }
                ],
                consolidated: {
                    typical: [
                        { name: "Copper Wire 2.5mm", totalQuantity: 100, unit: "meters" }
                    ],
                    installation: []
                },
                summary: {
                    totalAssemblies: 5,
                    totalTypicalItems: 12,
                    totalInstallationItems: 2
                }
            }
        },
        {
            id: "get-template-boq",
            name: "Get Template BOQ",
            method: "GET",
            path: "/api/templates/{id}/boq",
            description: "Retrieves the preliminary Bill of Quantities based on a template configuration.",
            params: [
                { name: "id", type: "integer", required: true, description: "The unique ID of the template." }
            ]
        },
        {
            id: "get-crm-inquiries",
            name: "Get CRM Inquiries",
            method: "GET",
            path: "/api/crm/inquiries",
            description: "Fetches live inquiry data from the external CRM system.",
            query: [
                { name: "role", type: "string", default: "Estimator" },
                { name: "id", type: "integer", default: "0" }
            ]
        }
    ];

    const currentEndpoint = endpoints.find(e => e.id === activeEndpoint) || endpoints[0];

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b bg-muted/20">
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        v1.0.0
                    </Badge>
                    <span className="text-sm text-muted-foreground">API Documentation</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">API Reference</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Technical documentation for QuickBom integration and data relationships.
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Nav */}
                <div className="w-64 border-r bg-muted/10 overflow-y-auto p-4 space-y-6 shrink-0">
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">
                            Introduction
                        </h3>
                        <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                Overview
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                                Authentication
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">
                            BOQ Endpoints
                        </h3>
                        <div className="space-y-1">
                            {endpoints.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => setActiveEndpoint(e.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${activeEndpoint === e.id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted/50"
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                        }`}>
                                        {e.method}
                                    </span>
                                    {e.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-2">
                            Data Schemas
                        </h3>
                        <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
                                <Layers className="h-3.5 w-3.5" /> Project Relation
                            </button>
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-2">
                                <Calculator className="h-3.5 w-3.5" /> BOQ Logic
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl">
                        {/* Overview Section */}
                        <section className="mb-12">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <BookOpen className="h-5 w-5" />
                                <h2 className="text-xl font-bold">API Overview</h2>
                            </div>
                            <p className="text-muted-foreground mb-6 leading-relaxed">
                                The QuickBom API provides a standardized way to access Bill of Quantities (BOQ) data from your projects.
                                Our BOQ system is unique because it connects high-level <b>Templates</b> with low-level <b>Materials</b>
                                synced from an external <b>CRM Inquiry</b>.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="bg-muted/20 border-none shadow-none">
                                    <CardHeader className="pb-2">
                                        <Database className="h-5 w-5 text-blue-500 mb-2" />
                                        <CardTitle className="text-sm">Real-time CRM</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Direct integration with External CRM for material pricing and inquiry tracking.
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/20 border-none shadow-none">
                                    <CardHeader className="pb-2">
                                        <Search className="h-5 w-5 text-purple-500 mb-2" />
                                        <CardTitle className="text-sm">Hierarchical View</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Deep structural breakdown of assemblies and their component materials.
                                    </CardContent>
                                </Card>
                                <Card className="bg-muted/20 border-none shadow-none">
                                    <CardHeader className="pb-2">
                                        <Calculator className="h-5 w-5 text-green-500 mb-2" />
                                        <CardTitle className="text-sm">BOM Consolidation</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-xs text-muted-foreground">
                                        Automated merging of identical items across different assemblies for procurement.
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        <Separator className="my-10" />

                        {/* Endpoint Section */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                                        {currentEndpoint.name}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono bg-green-50 text-green-700 dark:bg-green-950/30">
                                            {currentEndpoint.method}
                                        </Badge>
                                        <code className="text-sm font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded">
                                            {currentEndpoint.path}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            <p className="text-muted-foreground italic">
                                {currentEndpoint.description}
                            </p>

                            {/* Request Parameters */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Terminal className="h-4 w-4" />
                                    Parameters
                                </h3>
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Name</th>
                                                <th className="px-4 py-2 font-medium">Type</th>
                                                <th className="px-4 py-2 font-medium">Required</th>
                                                <th className="px-4 py-2 font-medium">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {((currentEndpoint.params || currentEndpoint.query || []) as any[]).map((p, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-3 font-mono text-blue-600">{p.name}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                                                    <td className="px-4 py-3">
                                                        {p.required ? (
                                                            <Badge variant="destructive" className="text-[10px] h-4">YES</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] h-4">NO</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.description || (p.default ? `Default: ${p.default}` : '-')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Response Section */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileJson className="h-4 w-4" />
                                    Response Example
                                </h3>
                                <div className="relative group">
                                    <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 text-xs font-mono overflow-x-auto border-2 border-slate-800">
                                        {JSON.stringify(currentEndpoint.response || { status: "success", data: [] }, null, 2)}
                                    </pre>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigator.clipboard.writeText(JSON.stringify(currentEndpoint.response, null, 2))}
                                    >
                                        <Code2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Relationship Logic */}
                            {activeEndpoint === 'get-project-boq' && (
                                <div className="mt-12 p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900">
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        BOQ Relationship Logic
                                    </h3>
                                    <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
                                        <div className="flex gap-3">
                                            <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-blue-600" /></div>
                                            <p><b>Project Inquiry:</b> Links project to CRM record via <code>crmInquiryId</code>.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-blue-600" /></div>
                                            <p><b>Assembly Snapshots:</b> Materials are copied from CRM to <code>AssemblyMaterial</code> to maintain price history integrity.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="mt-1"><CheckCircle2 className="h-4 w-4 text-blue-600" /></div>
                                            <p><b>Hierarchy Calculation:</b> Total Quantity = <code>Assembly.Material.quantity</code> × <code>Project.Assembly.quantity</code>.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Button({ children, ...props }: any) {
    return <button {...props}>{children}</button>;
}
