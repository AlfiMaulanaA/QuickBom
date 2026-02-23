"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    Sparkles,
    LayoutGrid,
    Package,
    BarChart3,
    ArrowRight,
    Copy,
    Plus,
    Star,
    AlertCircle,
    Check,
    X,
    Loader2,
    RefreshCw,
    Layers,
    Info,
    Lock,
    RotateCcw,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// ── Types ──────────────────────────────────────────────────────────
interface Category {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    _count: { assemblies: number; assemblyGroups: number };
}

interface AssemblyItem {
    id: number;
    name: string;
    description: string | null;
    module: string;
    category: { name: string; color: string | null };
    _count: { materials: number; templates: number };
    isDefault: boolean;
}

interface Group {
    id: string;
    name: string;
    description: string | null;
    groupType: "REQUIRED" | "OPTIONAL" | "CHOOSE_ONE" | "CHOOSE_MANY";
    _count: { items: number };
    assemblies: AssemblyItem[];
    loadingAssemblies: boolean;
}

interface TemplateResult {
    template: { id: number; name: string; description: string | null; totalAssemblies: number };
    score: number;
    coverage: number;
    matchedCount: number;
    totalSelected: number;
    matchedAssemblies: { id: number; name: string; groupName: string; isBase: boolean }[];
    missingAssemblies: { id: number; name: string; groupName: string; isBase: boolean }[];
    recommendation: "EXCELLENT_MATCH" | "GOOD_MATCH" | "PARTIAL_MATCH" | "POOR_MATCH";
}

interface RecommendResult {
    results: TemplateResult[];
    summary: {
        totalTemplatesChecked: number;
        topScore: number;
        needsNewTemplate: boolean;
        recommendation: string;
    };
}

// ── Step Indicator ─────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Category", icon: LayoutGrid },
    { id: 2, label: "Select Assembly", icon: Package },
    { id: 3, label: "Results", icon: BarChart3 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;
                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-1.5 px-4">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                                isDone
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/30"
                                    : isActive
                                        ? "bg-white dark:bg-gray-900 border-indigo-600 text-indigo-600 shadow-md shadow-indigo-500/20"
                                        : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                            )}>
                                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <span className={cn(
                                "text-xs font-medium whitespace-nowrap",
                                isActive ? "text-indigo-600 dark:text-indigo-400" : isDone ? "text-indigo-500" : "text-gray-400"
                            )}>
                                {step.label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={cn("w-16 h-0.5 -mt-5", currentStep > step.id ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700")} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function GroupTypeBadge({ type }: { type: string }) {
    const config: Record<string, { label: string; className: string }> = {
        REQUIRED: { label: "Required – All Selected", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
        OPTIONAL: { label: "Optional", className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
        CHOOSE_ONE: { label: "Choose One", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
        CHOOSE_MANY: { label: "Choose Many", className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800" },
    };
    const c = config[type] ?? config.OPTIONAL;
    return (
        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", c.className)}>
            {c.label}
        </span>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 80 ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
            : score >= 50 ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
    return (
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold", color)}>
            <BarChart3 className="w-3.5 h-3.5" />
            {score}%
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────
export default function QuestionnairePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Step 1
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [loadingCats, setLoadingCats] = useState(false);

    // Step 2
    const [groups, setGroups] = useState<Group[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    // selections: groupId -> assemblyId[]
    const [selections, setSelections] = useState<Record<string, number[]>>({});

    // Step 3
    const [result, setResult] = useState<RecommendResult | null>(null);
    const [loadingResult, setLoadingResult] = useState(false);
    const [expandedTemplate, setExpandedTemplate] = useState<number | null>(null);
    const [categorySearch, setCategorySearch] = useState("");
    const [assemblySearch, setAssemblySearch] = useState("");

    // ── Load categories on mount ─────────────────────────────────────
    useEffect(() => {
        setLoadingCats(true);
        fetch("/api/questionnaire/categories")
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || []))
            .catch(() => toast({ title: "Failed to load categories", variant: "destructive" }))
            .finally(() => setLoadingCats(false));
    }, []);

    // ── Load all groups + assemblies for a category ──────────────────
    const loadGroupsForCategory = async (category: Category) => {
        setLoadingGroups(true);
        setGroups([]);
        setSelections({});

        try {
            const res = await fetch(`/api/questionnaire/groups?categoryId=${category.id}`);
            const data = await res.json();
            const rawGroups: Group[] = (data.groups || []).map((g: any) => ({
                ...g,
                assemblies: [],
                loadingAssemblies: true,
            }));
            setGroups(rawGroups);

            // Load assemblies for ALL groups in parallel
            const updatedGroups = await Promise.all(
                rawGroups.map(async (group) => {
                    try {
                        const r = await fetch(`/api/questionnaire/assemblies?groupId=${group.id}`);
                        const d = await r.json();
                        const asmList: AssemblyItem[] = d.assemblies || [];
                        return { ...group, assemblies: asmList, loadingAssemblies: false };
                    } catch {
                        return { ...group, assemblies: [], loadingAssemblies: false };
                    }
                })
            );

            setGroups(updatedGroups);

            // Auto-select logic:
            // - REQUIRED groups: ALL assemblies are auto-selected (locked)
            // - Other groups: only assemblies marked isDefault
            const autoSelections: Record<string, number[]> = {};
            updatedGroups.forEach((g) => {
                if (g.groupType === "REQUIRED") {
                    // Select ALL assemblies in required group
                    autoSelections[g.id] = g.assemblies.map((a) => a.id);
                } else {
                    // Select only defaults
                    const defaults = g.assemblies.filter((a) => a.isDefault).map((a) => a.id);
                    if (defaults.length > 0) autoSelections[g.id] = defaults;
                }
            });
            setSelections(autoSelections);

        } catch {
            toast({ title: "Failed to load groups", variant: "destructive" });
        } finally {
            setLoadingGroups(false);
        }
    };

    const handleCategorySelect = (cat: Category) => setSelectedCategory(cat);

    const goToStep2 = () => {
        if (!selectedCategory) return;
        setStep(2);
        setCategorySearch("");
        setAssemblySearch("");
        loadGroupsForCategory(selectedCategory);
    };

    // ── Toggle assembly selection ────────────────────────────────────
    const toggleAssembly = (group: Group, assemblyId: number) => {
        // REQUIRED groups: cannot be deselected
        if (group.groupType === "REQUIRED") return;

        setSelections((prev) => {
            const current = prev[group.id] || [];
            if (group.groupType === "CHOOSE_ONE") {
                // Radio behavior
                const alreadySelected = current.includes(assemblyId);
                return { ...prev, [group.id]: alreadySelected ? [] : [assemblyId] };
            }
            // Checkbox (OPTIONAL / CHOOSE_MANY)
            return {
                ...prev,
                [group.id]: current.includes(assemblyId)
                    ? current.filter((id) => id !== assemblyId)
                    : [...current, assemblyId],
            };
        });
    };

    const allSelectedIds = Object.values(selections).flat();

    // ── Fetch recommendations ────────────────────────────────────────
    const getRecommendations = async () => {
        if (allSelectedIds.length === 0) {
            toast({ title: "Please select at least one assembly", variant: "destructive" });
            return;
        }
        setLoadingResult(true);
        setResult(null);
        try {
            const res = await fetch("/api/questionnaire/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assemblyIds: allSelectedIds, categoryId: selectedCategory?.id }),
            });
            const data = await res.json();
            setResult(data);
            setStep(3);
        } catch {
            toast({ title: "Failed to get recommendations", variant: "destructive" });
        } finally {
            setLoadingResult(false);
        }
    };

    const resetQuestionnaire = () => {
        setStep(1);
        setSelectedCategory(null);
        setGroups([]);
        setSelections({});
        setResult(null);
        setExpandedTemplate(null);
        setCategorySearch("");
        setAssemblySearch("");
    };

    // Reset only optional selections — REQUIRED groups remain locked and fully selected
    const resetSelections = () => {
        setSelections((prev) => {
            const kept: Record<string, number[]> = {};
            groups.forEach((g) => {
                if (g.groupType === "REQUIRED") {
                    kept[g.id] = prev[g.id] || g.assemblies.map((a) => a.id);
                }
                // OPTIONAL / CHOOSE_ONE / CHOOSE_MANY are cleared
            });
            return kept;
        });
    };

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-6">

            {/* Page Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Questionnaire</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Find the best matching template for your project needs
                        </p>
                    </div>
                    {step > 1 && (
                        <Button variant="outline" size="sm" onClick={resetQuestionnaire} className="ml-auto gap-2 text-gray-500">
                            <RefreshCw className="w-3.5 h-3.5" /> Start Over
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                <StepIndicator currentStep={step} />

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 1 — Select Category                                  */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                Select Assembly Category
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Choose a category that matches your project type. All groups and assemblies within the selected category will be shown in the next step.
                            </p>

                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search categories..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                />
                                {categorySearch && (
                                    <button
                                        onClick={() => setCategorySearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {loadingCats ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                </div>
                            ) : (() => {
                                const filtered = categories.filter(cat =>
                                    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                                    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
                                );

                                if (filtered.length === 0) {
                                    return (
                                        <div className="text-center py-12 text-gray-400">
                                            {categorySearch ? (
                                                <>
                                                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                    <p>No categories match &ldquo;{categorySearch}&rdquo;</p>
                                                </>
                                            ) : (
                                                <>
                                                    <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                    <p>No assembly categories found</p>
                                                </>
                                            )}
                                        </div>
                                    );
                                }

                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filtered.map((cat) => {
                                            const isSelected = selectedCategory?.id === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleCategorySelect(cat)}
                                                    className={cn(
                                                        "flex flex-col gap-3 p-5 rounded-xl border-2 text-left transition-all hover:shadow-md",
                                                        isSelected
                                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-md shadow-indigo-500/10"
                                                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-200 dark:hover:border-indigo-800"
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div
                                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md"
                                                            style={{ backgroundColor: cat.color || "#6366f1" }}
                                                        >
                                                            {cat.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{cat.name}</p>
                                                        {cat.description && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-3 text-xs text-gray-400">
                                                        <span><span className="font-medium text-gray-600 dark:text-gray-300">{cat._count.assemblyGroups}</span> groups</span>
                                                        <span>·</span>
                                                        <span><span className="font-medium text-gray-600 dark:text-gray-300">{cat._count.assemblies}</span> assemblies</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={goToStep2}
                                disabled={!selectedCategory}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2 rounded-xl px-6"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 2 — Select Assemblies (all groups shown at once)     */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div className="space-y-4">
                        {/* Breadcrumb */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: selectedCategory?.color || "#6366f1" }}
                            >
                                {selectedCategory?.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Selected Category</p>
                                <p className="font-semibold text-gray-900 dark:text-white">{selectedCategory?.name}</p>
                            </div>
                            {allSelectedIds.length > 0 && (
                                <div className="ml-auto flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetSelections}
                                        className="gap-1.5 text-xs text-gray-500 hover:text-red-500 h-8 px-2"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset Selection
                                    </Button>
                                    <div className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                        <Check className="w-3.5 h-3.5" />
                                        {allSelectedIds.length} {allSelectedIds.length === 1 ? "assembly" : "assemblies"} selected
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hint */}
                        <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>
                                <strong>Required</strong> groups have all assemblies pre-selected and locked.
                                For other groups, select the assemblies that fit your project, then click <strong>Find Recommendations</strong>.
                            </p>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search assemblies or groups..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                value={assemblySearch}
                                onChange={(e) => setAssemblySearch(e.target.value)}
                            />
                            {assemblySearch && (
                                <button
                                    onClick={() => setAssemblySearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {loadingGroups ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 shadow-sm flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                <p className="text-sm text-gray-500">Loading groups and assemblies…</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 shadow-sm text-center text-gray-400">
                                <Layers className="w-12 h-12 mx-auto mb-4 opacity-40" />
                                <p className="font-medium">No groups found for this category</p>
                                <p className="text-sm mt-1">Add assembly groups in the Assembly Groups page first.</p>
                            </div>
                        ) : (() => {
                            const filteredGroups = groups.filter(g => {
                                const searchTerm = assemblySearch.toLowerCase();
                                const groupMatches = g.name.toLowerCase().includes(searchTerm) ||
                                    (g.description && g.description.toLowerCase().includes(searchTerm));
                                const assemblyMatches = g.assemblies.some(a => a.name.toLowerCase().includes(searchTerm));
                                return groupMatches || assemblyMatches;
                            });

                            if (filteredGroups.length === 0) {
                                return (
                                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 shadow-sm text-center text-gray-400">
                                        <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
                                        <p className="font-medium">No groups or assemblies match &ldquo;{assemblySearch}&rdquo;</p>
                                        <button
                                            onClick={() => setAssemblySearch("")}
                                            className="text-sm text-indigo-500 mt-2 hover:underline"
                                        >
                                            Clear search
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {filteredGroups.map((group) => {
                                        const searchTerm = assemblySearch.toLowerCase();
                                        const groupSelected = selections[group.id] || [];
                                        const isRequired = group.groupType === "REQUIRED";
                                        const isChooseOne = group.groupType === "CHOOSE_ONE";
                                        const hasSelection = groupSelected.length > 0;

                                        const filteredAssemblies = group.assemblies.filter(a =>
                                            a.name.toLowerCase().includes(searchTerm)
                                        );

                                        return (
                                            <div
                                                key={group.id}
                                                className={cn(
                                                    "bg-white dark:bg-gray-900 rounded-2xl border-2 shadow-sm overflow-hidden",
                                                    isRequired
                                                        ? "border-red-300 dark:border-red-800"
                                                        : hasSelection
                                                            ? "border-indigo-300 dark:border-indigo-700"
                                                            : "border-gray-200 dark:border-gray-800"
                                                )}
                                            >
                                                {/* Group Header */}
                                                <div className={cn(
                                                    "px-5 py-4 border-b flex items-center gap-3",
                                                    isRequired
                                                        ? "border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
                                                        : hasSelection
                                                            ? "border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20"
                                                            : "border-gray-100 dark:border-gray-800"
                                                )}>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                                        isRequired
                                                            ? "bg-red-500 text-white"
                                                            : hasSelection
                                                                ? "bg-indigo-600 text-white"
                                                                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                                    )}>
                                                        {isRequired ? <Lock className="w-4 h-4" /> : hasSelection ? <Check className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                                                            <GroupTypeBadge type={group.groupType} />
                                                        </div>
                                                        {group.description && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{group.description}</p>
                                                        )}
                                                        {isRequired && (
                                                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                                                <Lock className="w-3 h-3" />
                                                                All assemblies in this group are automatically included
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-xs flex-shrink-0">
                                                        {isRequired ? (
                                                            <span className="text-red-600 dark:text-red-400 font-medium">{group.assemblies.length} included</span>
                                                        ) : hasSelection ? (
                                                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">{groupSelected.length} selected</span>
                                                        ) : (
                                                            <span className="text-gray-400">{group._count.items} available</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Assembly Grid */}
                                                <div className="p-4">
                                                    {group.loadingAssemblies ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                                                        </div>
                                                    ) : filteredAssemblies.length === 0 ? (
                                                        <div className="text-center py-6 text-gray-400 text-sm">
                                                            <Package className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                                            {assemblySearch ? `No matching assemblies in this group` : "No assemblies in this group yet"}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {filteredAssemblies.map((asm) => {
                                                                const isSelected = isRequired || groupSelected.includes(asm.id);

                                                                return (
                                                                    <button
                                                                        key={asm.id}
                                                                        onClick={() => !isRequired && toggleAssembly(group, asm.id)}
                                                                        disabled={isRequired}
                                                                        className={cn(
                                                                            "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                                                                            isRequired
                                                                                ? "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 cursor-default"
                                                                                : isSelected
                                                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 hover:shadow-sm"
                                                                                    : "border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm cursor-pointer"
                                                                        )}
                                                                    >
                                                                        {/* Checkbox / Radio / Lock */}
                                                                        <div className={cn(
                                                                            "flex-shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 transition-all",
                                                                            isRequired
                                                                                ? "rounded bg-red-400 dark:bg-red-600"
                                                                                : isChooseOne
                                                                                    ? cn("rounded-full border-2", isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 dark:border-gray-600")
                                                                                    : cn("rounded border-2", isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 dark:border-gray-600")
                                                                        )}>
                                                                            {isRequired
                                                                                ? <Lock className="w-3 h-3 text-white" />
                                                                                : isSelected
                                                                                    ? <Check className="w-3 h-3 text-white" />
                                                                                    : null
                                                                            }
                                                                        </div>

                                                                        {/* Info */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                                <p className={cn(
                                                                                    "text-sm font-medium leading-tight",
                                                                                    isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                                                                )}>
                                                                                    {asm.name}
                                                                                </p>
                                                                                {asm.isDefault && !isRequired && (
                                                                                    <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                                                        Default
                                                                                    </span>
                                                                                )}
                                                                                {isRequired && (
                                                                                    <span className="text-xs text-red-500 bg-red-50 dark:bg-red-950 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                                                                        Required
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {asm.description && (
                                                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{asm.description}</p>
                                                                            )}
                                                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                                                                                <span
                                                                                    className="px-1.5 py-0.5 rounded text-white text-[10px]"
                                                                                    style={{ backgroundColor: asm.category.color || "#6366f1" }}
                                                                                >
                                                                                    {asm.module}
                                                                                </span>
                                                                                <span>{asm._count.materials} materials</span>
                                                                                {asm._count.templates > 0 && <span>· {asm._count.templates} templates</span>}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {/* Actions */}
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)} className="gap-2 rounded-xl">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button
                                onClick={getRecommendations}
                                disabled={allSelectedIds.length === 0 || loadingResult}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2 rounded-xl px-6"
                            >
                                {loadingResult ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Find Recommendations ({allSelectedIds.length})</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 3 — Results                                          */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 3 && result && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className={cn(
                            "rounded-2xl border-2 p-6 shadow-sm",
                            result.summary.needsNewTemplate
                                ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
                                : "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                        )}>
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                    result.summary.needsNewTemplate
                                        ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600"
                                        : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600"
                                )}>
                                    {result.summary.needsNewTemplate ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <h2 className={cn(
                                        "text-lg font-bold mb-1",
                                        result.summary.needsNewTemplate
                                            ? "text-amber-800 dark:text-amber-300"
                                            : "text-emerald-800 dark:text-emerald-300"
                                    )}>
                                        {result.summary.needsNewTemplate ? "No Good Match — Create a New Template" : "Matching Template Found!"}
                                    </h2>
                                    <p className={cn("text-sm", result.summary.needsNewTemplate ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400")}>
                                        {result.summary.recommendation}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                                        <span>{result.summary.totalTemplatesChecked} templates checked</span>
                                        <span>·</span>
                                        <span>Top score: <strong>{result.summary.topScore}%</strong></span>
                                        <span>·</span>
                                        <span>{allSelectedIds.length} assemblies selected</span>
                                    </div>
                                </div>
                                {result.summary.needsNewTemplate && (
                                    <Button
                                        onClick={() => router.push("/templates/create")}
                                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-2 rounded-xl flex-shrink-0"
                                    >
                                        <Plus className="w-4 h-4" /> Create Template
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Template Results */}
                        {result.results.length > 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-500" />
                                    Template Recommendations ({result.results.length})
                                </h3>
                                <div className="space-y-3">
                                    {result.results.map((res, idx) => {
                                        const isExpanded = expandedTemplate === res.template.id;
                                        const isTop = idx === 0;
                                        const canUse = res.score >= 50;

                                        return (
                                            <div
                                                key={res.template.id}
                                                className={cn(
                                                    "rounded-xl border-2 overflow-hidden",
                                                    isTop && canUse
                                                        ? "border-emerald-400 dark:border-emerald-600"
                                                        : canUse
                                                            ? "border-blue-200 dark:border-blue-800"
                                                            : "border-gray-200 dark:border-gray-700"
                                                )}
                                            >
                                                <button
                                                    onClick={() => setExpandedTemplate(isExpanded ? null : res.template.id)}
                                                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                                                        isTop && canUse
                                                            ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                                    )}>
                                                        {isTop && canUse ? <Star className="w-4 h-4" /> : idx + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-gray-900 dark:text-white">{res.template.name}</p>
                                                            {isTop && canUse && (
                                                                <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                                    Best Match
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden w-32">
                                                                <div
                                                                    className={cn("h-full rounded-full", res.score >= 80 ? "bg-emerald-500" : res.score >= 50 ? "bg-blue-500" : "bg-red-400")}
                                                                    style={{ width: `${res.score}%` }}
                                                                />
                                                            </div>
                                                            <ScoreBadge score={res.score} />
                                                            <span className="text-xs text-gray-400">{res.matchedCount}/{res.totalSelected} matched</span>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform flex-shrink-0", isExpanded && "rotate-90")} />
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 bg-gray-50 dark:bg-gray-900/50 space-y-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                    Selected Assemblies Detail
                                                                </h4>

                                                                {/* Grouping Logic */}
                                                                {(() => {
                                                                    const allItems = [...res.matchedAssemblies, ...res.missingAssemblies.map(m => ({ ...m, isMissing: true }))];
                                                                    const groups: Record<string, typeof allItems> = {};
                                                                    allItems.forEach(item => {
                                                                        const gName = item.groupName || "Other";
                                                                        if (!groups[gName]) groups[gName] = [];
                                                                        groups[gName].push(item);
                                                                    });

                                                                    return (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                            {Object.entries(groups).map(([gName, items]) => (
                                                                                <div key={gName} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                                                                                    <div className="flex items-center justify-between mb-2">
                                                                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{gName}</p>
                                                                                        {items.every(i => (i as any).isBase) && (
                                                                                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">Required</span>
                                                                                        )}
                                                                                    </div>
                                                                                    <ul className="space-y-1.5">
                                                                                        {items.map((item: any) => (
                                                                                            <li key={item.id} className="flex items-start gap-2 text-xs">
                                                                                                {item.isMissing ? (
                                                                                                    <X className="w-3.5 h-3.5 text-red-400 mt-0.5" />
                                                                                                ) : (
                                                                                                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5" />
                                                                                                )}
                                                                                                <span className={cn(
                                                                                                    "flex-1",
                                                                                                    item.isMissing ? "text-gray-400 italic" : "text-gray-700 dark:text-gray-200"
                                                                                                )}>
                                                                                                    {item.name}
                                                                                                    {item.isMissing && <span className="ml-1 text-[10px] text-red-400 font-medium">(Missing in Template)</span>}
                                                                                                </span>
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            {canUse ? (
                                                                <>
                                                                    <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-1.5 rounded-lg" onClick={() => router.push(`/templates/${res.template.id}`)}>
                                                                        <ArrowRight className="w-3.5 h-3.5" /> Use Template
                                                                    </Button>
                                                                    <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => router.push(`/templates/${res.template.id}/edit?mode=copy`)}>
                                                                        <Copy className="w-3.5 h-3.5" /> Copy Template
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => router.push("/templates/create")}>
                                                                    <Plus className="w-3.5 h-3.5" /> Create New Template
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {result.results.length === 0 && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 shadow-sm text-center">
                                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Templates Found</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    None of the existing templates contain the assemblies you selected. Create a new template to get started.
                                </p>
                                <Button onClick={() => router.push("/templates/create")} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white gap-2 rounded-xl">
                                    <Plus className="w-4 h-4" /> Create New Template
                                </Button>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(2)} className="gap-2 rounded-xl">
                                <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                            <Button variant="outline" onClick={resetQuestionnaire} className="gap-2 rounded-xl">
                                <RefreshCw className="w-4 h-4" /> Start Over
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
