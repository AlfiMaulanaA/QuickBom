import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function GET() {
    try {
        // Collect some basic summary metrics to feed into the AI
        const [
            assembliesCount,
            templatesCount,
            projects,
            usersCount,
        ] = await Promise.all([
            prisma.assembly.count(),
            prisma.template.count(),
            prisma.project.findMany({
                select: {
                    id: true,
                    name: true,
                    status: true,
                    totalPrice: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 30
            }),
            prisma.user.count()
        ]);

        const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
        const inProgressProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
        const delayedProjects = projects.filter(p => p.status === 'DELAYED').length;
        const planningProjects = projects.filter(p => p.status === 'PLANNING').length;

        const projectsValue = projects.reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);
        const completedValue = projects.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + Number(p.totalPrice || 0), 0);

        const metricsSummary = `
      Total Templates: ${templatesCount}
      Total Assemblies: ${assembliesCount}
      Total Users: ${usersCount}
      
      Recent Projects (Last 30):
      - Total Projects: ${projects.length}
      - Total Value: IDR ${projectsValue.toLocaleString()}
      - Completed: ${completedProjects} (Value: IDR ${completedValue.toLocaleString()})
      - In Progress: ${inProgressProjects}
      - Delayed: ${delayedProjects}
      - Planning: ${planningProjects}
    `;

        const systemPrompt = `You are an expert AI business analyst for a Construction/BOM Management System. 
    Analyze the following real-time system metrics and provide exactly 3 actionable, smart business insights.
    
    You MUST respond in strict JSON format containing an object with an "insights" array.
    Example:
    {
      "insights": [
        { "type": "efficiency", "title": "...", "description": "..." },
        { "type": "financial", "title": "...", "description": "..." },
        { "type": "alert", "title": "...", "description": "..." }
      ]
    }`;

        const groqResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Here is the current system data: ${metricsSummary}` }
                ],
                temperature: 0.4,
                max_tokens: 500,
                response_format: { type: "json_object" }
            }),
        });

        if (!groqResponse.ok) {
            throw new Error("Failed to fetch from Groq");
        }

        const groqData = await groqResponse.json();
        let content = groqData.choices[0]?.message?.content || "[]";

        // Sometimes response_format: json_object wraps array in an object
        // Handle that cleanly
        let insights;
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                insights = parsed;
            } else if (parsed.insights && Array.isArray(parsed.insights)) {
                insights = parsed.insights;
            } else {
                // fallback
                insights = [
                    { type: 'alert', title: 'Data Processing Error', description: 'Could not parse insights from AI.' }
                ]
            }
        } catch (e) {
            insights = [];
        }

        return NextResponse.json({ insights: insights.slice(0, 3) });
    } catch (error: any) {
        console.error('[AI-INSIGHTS ERROR]', error);
        return NextResponse.json({
            error: "Failed to generate AI insights",
        }, { status: 500 });
    }
}
