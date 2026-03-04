import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth-helper";
import { fetchDatabaseContext } from "@/lib/ai-db-context";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const BASE_SYSTEM_PROMPT = `You are Product Configurator AI, an intelligent analytics assistant for the Product Configurator & BOM (Bill of Materials) Management System.

You help construction project managers, estimators, and engineers with:
- Analyzing project data, costs, and progress comprehensively and in deep detail.
- Understanding assemblies, materials, and BOMs.
- Client management insights.
- Template optimization recommendations.
- Cost estimation and budget analysis (focusing on under/over budget metrics).
- Construction project planning advice and bottleneck discovery.

The Product Configurator system manages:
- Projects (with status, budget vs real price, priority, timeline, progress, assigned team members)
- Assemblies (grouped work packages with materials)
- Assembly Categories & Groups
- Templates (reusable project blueprints)
- Clients (individual, company, government)
- Materials (sourced from external CRM)

When answering questions about data (especially projects and budgets), ALWAYS use the real-time database context provided below. 
You must provide HIGHLY DETAILED, analytical, and comprehensive answers. Point out anomalies, budget overruns, delayed timelines, or opportunities for efficiency. 
Always be helpful but data-driven. Format responses beautifully using markdown, lists, and highlighting when appropriate.
Speak in Indonesian when the user speaks in Indonesian, and in English otherwise.`;

export async function POST(request: NextRequest) {
    const user = getUserFromRequest(request);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { messages, sessionId } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
        }

        // Fetch real-time database context for AI
        const dbContext = await fetchDatabaseContext();
        const SYSTEM_PROMPT = BASE_SYSTEM_PROMPT + dbContext;

        // Save user message to DB
        const lastUserMessage = messages[messages.length - 1];
        if (sessionId && lastUserMessage?.role === "user") {
            const session = await prisma.chatSession.findFirst({
                where: { id: sessionId, userId: user.userId },
            });

            if (session) {
                await prisma.chatMessage.create({
                    data: {
                        sessionId,
                        role: "user",
                        content: lastUserMessage.content,
                    },
                });

                // Auto-generate title from first message
                if (!session.title) {
                    const title =
                        lastUserMessage.content.slice(0, 60) +
                        (lastUserMessage.content.length > 60 ? "..." : "");
                    await prisma.chatSession.update({
                        where: { id: sessionId },
                        data: { title },
                    });
                }
            }
        }

        // Call Groq API directly via fetch (streaming)
        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                stream: true,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...messages.map((m: { role: string; content: string }) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ],
            }),
        });

        if (!groqResponse.ok) {
            const errorText = await groqResponse.text();
            console.error("[Groq API Error]", errorText);
            return NextResponse.json(
                { error: "Groq API error", details: errorText },
                { status: groqResponse.status }
            );
        }

        // Transform Groq SSE stream → plain text stream for ai/react
        const encoder = new TextEncoder();
        let fullText = "";

        const transformStream = new TransformStream({
            async transform(chunk, controller) {
                const text = new TextDecoder().decode(chunk);
                const lines = text.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                fullText += content;
                                // Vercel AI SDK v3 text stream format
                                controller.enqueue(encoder.encode(`0:${JSON.stringify(content)}\n`));
                            }
                        } catch {
                            // skip malformed JSON
                        }
                    }
                }
            },
            async flush() {
                // Save assistant response after stream finishes
                if (sessionId && fullText) {
                    try {
                        const session = await prisma.chatSession.findFirst({
                            where: { id: sessionId, userId: user.userId },
                        });
                        if (session) {
                            await prisma.chatMessage.create({
                                data: {
                                    sessionId,
                                    role: "assistant",
                                    content: fullText,
                                },
                            });
                            await prisma.chatSession.update({
                                where: { id: sessionId },
                                data: { updatedAt: new Date() },
                            });
                        }
                    } catch (err) {
                        console.error("Failed to save assistant message:", err);
                    }
                }
            },
        });

        // Pipe Groq stream through transformer
        groqResponse.body?.pipeTo(transformStream.writable);

        return new Response(transformStream.readable, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Vercel-AI-Data-Stream": "v1",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error: any) {
        console.error("[AI Chat Error]", error);
        return NextResponse.json(
            { error: "Failed to process AI request", details: error.message },
            { status: 500 }
        );
    }
}
