"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import {
    Bot,
    Send,
    Plus,
    Trash2,
    MessageSquare,
    Sparkles,
    User,
    Copy,
    Check,
    Edit2,
    ChevronLeft,
    Loader2,
    Zap,
    Brain,
    BarChart3,
    FileText,
    Database,
    FolderOpen,
    Users,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { Message } from "ai";

interface ChatSession {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { messages: number };
}

interface DbMessage {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

const SUGGESTED_PROMPTS = [
    { icon: BarChart3, text: "Berapa total nilai kontrak semua proyek saya?", color: "text-blue-500" },
    { icon: FolderOpen, text: "Tampilkan daftar proyek yang sedang berjalan beserta progressnya", color: "text-purple-500" },
    { icon: Users, text: "Siapa klien dengan nilai kontrak tertinggi?", color: "text-emerald-500" },
    { icon: TrendingUp, text: "Analisis performa proyek dan berikan rekomendasi", color: "text-amber-500" },
    { icon: FileText, text: "Assembly mana yang paling banyak digunakan di template?", color: "text-rose-500" },
    { icon: Zap, text: "Proyek mana yang progressnya paling lambat?", color: "text-cyan-500" },
];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
            title="Copy"
        >
            {copied
                ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                : <Copy className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            }
        </button>
    );
}

function MessageBubble({ role, content }: { role: string; content: string }) {
    const isUser = role === "user";
    return (
        <div className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
            {/* Avatar */}
            <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-md",
                isUser
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600"
            )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={cn(
                "relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                isUser
                    ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-700"
            )}>
                {!isUser && (
                    <div className="absolute top-2 right-2">
                        <CopyButton text={content} />
                    </div>
                )}
                <div className="text-sm leading-relaxed">
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{content}</p>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm">{children}</ol>,
                                    code: ({ children }) => (
                                        <code className="bg-black/10 dark:bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-700 dark:text-emerald-300">{children}</code>
                                    ),
                                    pre: ({ children }) => (
                                        <pre className="bg-black/10 dark:bg-black/40 rounded-lg p-3 overflow-x-auto text-xs font-mono mb-2">{children}</pre>
                                    ),
                                    strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 text-gray-900 dark:text-white">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-2 border-indigo-400 pl-3 italic text-gray-600 dark:text-gray-300">{children}</blockquote>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AiPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [dbStats, setDbStats] = useState<{ projects: number; clients: number; assemblies: number; templates: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
        api: "/api/ai/chat",
        body: { sessionId: activeSessionId },
        onFinish: () => {
            fetchSessions();
        },
    });

    const fetchSessions = useCallback(async () => {
        const res = await fetch("/api/ai/sessions");
        if (res.ok) {
            const data = await res.json();
            setSessions(data.sessions || []);
        }
    }, []);

    // Fetch live DB stats for welcome screen
    const fetchDbStats = useCallback(async () => {
        try {
            const res = await fetch("/api/ai/context");
            if (res.ok) {
                const data = await res.json();
                const ctx: string = data.context || "";
                // Parse totals from context string
                const projectMatch = ctx.match(/Total proyek: (\d+)/);
                const clientMatch = ctx.match(/Total klien: (\d+)/);
                const assemblyMatch = ctx.match(/Total assembly: (\d+)/);
                const templateMatch = ctx.match(/Total template[^:]*: (\d+)/);
                setDbStats({
                    projects: projectMatch ? parseInt(projectMatch[1]) : 0,
                    clients: clientMatch ? parseInt(clientMatch[1]) : 0,
                    assemblies: assemblyMatch ? parseInt(assemblyMatch[1]) : 0,
                    templates: templateMatch ? parseInt(templateMatch[1]) : 0,
                });
            }
        } catch { /* silent fail */ }
    }, []);

    useEffect(() => {
        fetchSessions();
        fetchDbStats();
    }, [fetchSessions, fetchDbStats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const createNewSession = async () => {
        const res = await fetch("/api/ai/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            const data = await res.json();
            setActiveSessionId(data.session.id);
            setMessages([]);
            fetchSessions();
        }
    };

    const loadSession = async (sessionId: string) => {
        setActiveSessionId(sessionId);
        const res = await fetch(`/api/ai/sessions/${sessionId}`);
        if (res.ok) {
            const data = await res.json();
            const dbMessages: DbMessage[] = data.session.messages || [];
            setMessages(
                dbMessages.map((m) => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    createdAt: new Date(m.createdAt),
                })) as Message[]
            );
        }
    };

    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        await fetch(`/api/ai/sessions/${sessionId}`, { method: "DELETE" });
        if (activeSessionId === sessionId) {
            setActiveSessionId(null);
            setMessages([]);
        }
        fetchSessions();
    };

    const startRename = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditTitle(session.title || "");
    };

    const saveRename = async (sessionId: string) => {
        await fetch(`/api/ai/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: editTitle }),
        });
        setEditingId(null);
        fetchSessions();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitWithSession(e as unknown as React.FormEvent);
        }
    };

    const submitWithSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        let sessionId = activeSessionId;
        if (!sessionId) {
            const res = await fetch("/api/ai/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                sessionId = data.session.id;
                setActiveSessionId(sessionId);
            }
        }
        handleSubmit(e);
    };

    const handleSuggestedPrompt = async (text: string) => {
        let sessionId = activeSessionId;
        if (!sessionId) {
            const res = await fetch("/api/ai/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                const data = await res.json();
                sessionId = data.session.id;
                setActiveSessionId(sessionId);
            }
        }
        await append({ role: "user", content: text });
        fetchSessions();
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">

            {/* ── Sidebar ──────────────────────────────── */}
            <div className={cn(
                "flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 flex-shrink-0",
                sidebarOpen ? "w-72" : "w-0 overflow-hidden"
            )}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Product Configurator AI</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Analytics Assistant</p>
                        </div>
                    </div>
                    <Button
                        onClick={createNewSession}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 gap-2 text-sm shadow-md shadow-indigo-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </Button>
                </div>

                {/* Session List */}
                <ScrollArea className="flex-1 p-2">
                    {sessions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs px-4">
                            <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p>Belum ada chat history</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className={cn(
                                        "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm",
                                        activeSessionId === session.id
                                            ? "bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                    )}
                                >
                                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {editingId === session.id ? (
                                            <input
                                                autoFocus
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                onBlur={() => saveRename(session.id)}
                                                onKeyDown={(e) => e.key === "Enter" && saveRename(session.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full bg-white dark:bg-gray-700 border border-indigo-300 dark:border-indigo-600 rounded px-1 text-xs outline-none text-gray-900 dark:text-gray-100"
                                            />
                                        ) : (
                                            <>
                                                <p className="truncate text-xs font-medium">
                                                    {session.title || "New Chat"}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    {session._count.messages} messages
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    {editingId !== session.id && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={(e) => startRename(e, session)}
                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteSession(e, session.id)}
                                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 text-gray-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* ── Main Chat Area ───────────────────────── */}
            <div className="flex flex-col flex-1 min-w-0">

                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white h-8 w-8"
                    >
                        <ChevronLeft className={cn("h-4 w-4 transition-transform", !sidebarOpen && "rotate-180")} />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {activeSessionId
                                ? sessions.find((s) => s.id === activeSessionId)?.title || "New Chat"
                                : "Product Configurator AI Assistant"}
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <Database className="w-3 h-3" />
                            <span>Database Connected</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                            Groq · Llama 3.3 70B
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1">
                    <div className="px-4 py-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[420px] text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
                                    <Bot className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Configurator AI</h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm">
                                    Asisten AI cerdas yang terhubung langsung ke database Anda.
                                </p>

                                {/* Live DB Stats */}
                                {dbStats && (
                                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                                        {[
                                            { icon: FolderOpen, label: "Proyek", value: dbStats.projects, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" },
                                            { icon: Users, label: "Klien", value: dbStats.clients, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800" },
                                            { icon: Database, label: "Assembly", value: dbStats.assemblies, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800" },
                                            { icon: FileText, label: "Template", value: dbStats.templates, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800" },
                                        ].map((stat, i) => (
                                            <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${stat.color}`}>
                                                <stat.icon className="w-4 h-4" />
                                                <span>{stat.value} {stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSuggestedPrompt(prompt.text)}
                                            className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left group shadow-sm hover:shadow-md"
                                        >
                                            <prompt.icon className={cn("w-5 h-5 flex-shrink-0", prompt.color)} />
                                            <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{prompt.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((message: Message) => (
                                    <MessageBubble key={message.id} role={message.role} content={message.content} />
                                ))}
                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-200 dark:border-gray-700">
                                            <div className="flex gap-1.5 items-center">
                                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
                    <form id="chat-form" onSubmit={submitWithSession} className="max-w-3xl mx-auto">
                        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors p-3 shadow-sm">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanyakan sesuatu tentang proyek, BOM, estimasi biaya..."
                                rows={1}
                                className="flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[24px] max-h-32 py-0 px-0"
                                style={{ scrollbarWidth: "thin" }}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl h-9 w-9 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                            Enter untuk kirim · Shift+Enter untuk baris baru
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
