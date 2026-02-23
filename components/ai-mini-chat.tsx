"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "ai/react";
import type { Message } from "ai";
import {
    Bot,
    Send,
    X,
    Maximize2,
    Sparkles,
    User,
    Loader2,
    MessageSquare,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type PopupSize = "mini" | "medium" | "large";

const SIZE_CLASSES: Record<PopupSize, string> = {
    mini: "w-80 h-[400px]",
    medium: "w-96 h-[500px]",
    large: "w-[480px] h-[620px]",
};

export function AiMiniChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [popupSize, setPopupSize] = useState<PopupSize>("medium");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [hasNewMessage, setHasNewMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
        api: "/api/ai/chat",
        body: { sessionId },
        onFinish: () => {
            if (!isOpen) setHasNewMessage(true);
        },
    });

    const initSession = useCallback(async () => {
        if (sessionId) return;
        const res = await fetch("/api/ai/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            const data = await res.json();
            setSessionId(data.session.id);
        }
    }, [sessionId]);

    const handleOpen = () => {
        setIsOpen(true);
        setHasNewMessage(false);
        initSession();
    };

    const handleNewChat = async () => {
        const res = await fetch("/api/ai/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        if (res.ok) {
            const data = await res.json();
            setSessionId(data.session.id);
            setMessages([]);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await initSession();
        handleSubmit(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as unknown as React.FormEvent);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const cycleSize = () => {
        setPopupSize((prev) => {
            if (prev === "mini") return "medium";
            if (prev === "medium") return "large";
            return "mini";
        });
    };

    return (
        <>
            {/* ── Floating Trigger Button ─────────────── */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    id="ai-mini-chat-trigger"
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-2xl shadow-indigo-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Product Configurator AI Assistant"
                >
                    <Sparkles className="w-6 h-6" />
                    {hasNewMessage && (
                        <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </button>
            )}

            {/* ── Chat Popup ──────────────────────────── */}
            {isOpen && (
                <div
                    className={cn(
                        "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden",
                        "shadow-2xl shadow-black/20 dark:shadow-black/60",
                        "border border-gray-200 dark:border-gray-700",
                        "bg-white dark:bg-gray-900",
                        "transition-all duration-200",
                        SIZE_CLASSES[popupSize]
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold leading-tight">Product Configurator AI</p>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <p className="text-white/70 text-[10px]">Online · Groq Llama 3.3</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={handleNewChat}
                                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                                title="New Chat"
                            >
                                <MessageSquare className="w-3.5 h-3.5 text-white/80" />
                            </button>
                            <Link
                                href="/ai"
                                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                                title="Open Full Chat"
                            >
                                <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                            </Link>
                            <button
                                onClick={cycleSize}
                                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                                title="Resize"
                            >
                                <Maximize2 className="w-3.5 h-3.5 text-white/80" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
                                title="Close"
                            >
                                <X className="w-3.5 h-3.5 text-white/80" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-950"
                        style={{ scrollbarWidth: "thin" }}
                    >
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold">Halo! Saya Product Configurator AI</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                    Tanya saya tentang proyek, BOM, atau analitik konstruksi.
                                </p>
                            </div>
                        ) : (
                            messages.map((message: Message) => (
                                <div
                                    key={message.id}
                                    className={cn("flex gap-2", message.role === "user" ? "flex-row-reverse" : "flex-row")}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                        message.role === "user"
                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                                    )}>
                                        {message.role === "user"
                                            ? <User className="w-3 h-3 text-white" />
                                            : <Bot className="w-3 h-3 text-white" />
                                        }
                                    </div>

                                    {/* Bubble */}
                                    <div className={cn(
                                        "max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                                        message.role === "user"
                                            ? "bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-none"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm"
                                    )}>
                                        {message.role === "user" ? (
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        ) : (
                                            <div className="prose prose-xs dark:prose-invert max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="mb-1.5 last:mb-0 text-xs">{children}</p>,
                                                        code: ({ children }) => (
                                                            <code className="bg-gray-100 dark:bg-black/30 px-1 rounded text-[10px] font-mono text-emerald-600 dark:text-emerald-300">{children}</code>
                                                        ),
                                                        ul: ({ children }) => <ul className="list-disc pl-3 mb-1 text-xs space-y-0.5">{children}</ul>,
                                                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white text-xs">{children}</strong>,
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-3 h-3 text-white" />
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={onSubmit}
                        className="flex-shrink-0 p-2.5 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    >
                        <div className="flex gap-2 items-end bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors p-2">
                            <Textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanya sesuatu..."
                                rows={1}
                                className="flex-1 resize-none bg-transparent border-0 focus-visible:ring-0 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[20px] max-h-20 py-0 px-0"
                                style={{ scrollbarWidth: "thin" }}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                size="icon"
                                className="flex-shrink-0 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg h-7 w-7 shadow-sm disabled:opacity-50"
                            >
                                {isLoading
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Send className="w-3 h-3" />
                                }
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
