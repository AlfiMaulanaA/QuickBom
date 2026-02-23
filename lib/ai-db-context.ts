import { prisma } from "@/lib/prisma";

// Fetch a comprehensive snapshot of the database for AI context
export async function fetchDatabaseContext(): Promise<string> {
    try {
        const [
            projectStats,
            recentProjects,
            assemblyStats,
            clientStats,
            templateStats,
            topAssemblies,
            recentClients,
            userStats,
            allUsers,
        ] = await Promise.all([
            // Project stats by status
            prisma.project.groupBy({
                by: ["status"],
                _count: { id: true },
                _sum: { totalPrice: true, budget: true },
                _avg: { progress: true },
            }),

            // Recent 10 projects
            prisma.project.findMany({
                take: 10,
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    priority: true,
                    progress: true,
                    totalPrice: true,
                    budget: true,
                    startDate: true,
                    endDate: true,
                    location: true,
                    projectType: true,
                    client: {
                        select: { contactPerson: true, companyName: true, city: true },
                    },
                },
            }),

            // Assembly stats by module
            prisma.assembly.groupBy({
                by: ["module"],
                _count: { id: true },
            }),

            // Client stats by status and category
            prisma.client.groupBy({
                by: ["status", "category"],
                _count: { id: true },
                _sum: { totalContractValue: true },
            }),

            // Template count
            prisma.template.count(),

            // Top 5 assemblies
            prisma.assembly.findMany({
                take: 5,
                include: {
                    category: { select: { name: true } },
                    _count: { select: { templates: true } },
                },
                orderBy: { updatedAt: "desc" },
            }),

            // Recent clients
            prisma.client.findMany({
                take: 5,
                orderBy: { updatedAt: "desc" },
                select: {
                    contactPerson: true,
                    companyName: true,
                    city: true,
                    category: true,
                    status: true,
                    totalContractValue: true,
                    totalProjects: true,
                },
            }),

            // User stats grouped by role
            prisma.user.groupBy({
                by: ["role"],
                _count: { id: true },
            }),

            // All users — use fields that exist in schema
            prisma.user.findMany({
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,       // UserStatus enum: ACTIVE | INACTIVE | SUSPENDED | PENDING_VERIFICATION
                    department: true,
                    position: true,
                    lastLogin: true,
                    createdAt: true,
                    _count: { select: { createdProjects: true } },
                },
            }),
        ]);

        // ── Compute totals ──────────────────────────────────────────────────
        const totalProjects = projectStats.reduce((sum, s) => sum + s._count.id, 0);
        const totalContractValue = projectStats.reduce((sum, s) => sum + Number(s._sum.totalPrice || 0), 0);
        const totalBudget = projectStats.reduce((sum, s) => sum + Number(s._sum.budget || 0), 0);
        const totalAssemblies = assemblyStats.reduce((sum, s) => sum + s._count.id, 0);
        const totalClients = clientStats.reduce((sum, s) => sum + s._count.id, 0);
        const totalClientVal = clientStats.reduce((sum, s) => sum + Number(s._sum.totalContractValue || 0), 0);
        const totalUsers = userStats.reduce((sum, s) => sum + s._count.id, 0);
        const activeUsers = allUsers.filter((u) => u.status === "ACTIVE").length;

        // ── Helpers ─────────────────────────────────────────────────────────
        const fmt = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)}M`;
        const fmtDate = (d: Date | null | undefined) =>
            d
                ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                : "-";

        // ── Build context string ────────────────────────────────────────────
        let ctx = `\n\n--- REAL-TIME DATABASE CONTEXT (updated ${new Date().toLocaleString("id-ID")}) ---\n\n`;

        // ── USER ─────────────────────────────────────────────────────────────
        ctx += `## USER SISTEM\n`;
        ctx += `- Total user terdaftar: ${totalUsers}\n`;
        ctx += `- User ACTIVE: ${activeUsers}\n`;
        ctx += `- User INACTIVE/SUSPENDED/PENDING: ${totalUsers - activeUsers}\n\n`;

        ctx += `### Jumlah User per Role:\n`;
        for (const s of userStats) {
            ctx += `- ${s.role}: ${s._count.id} user\n`;
        }

        ctx += `\n### Daftar Semua User (${allUsers.length} user):\n`;
        for (const u of allUsers) {
            const dept = u.department ? ` | Dept: ${u.department}` : "";
            const pos = u.position ? ` | Posisi: ${u.position}` : "";
            const login = u.lastLogin ? fmtDate(u.lastLogin) : "Belum pernah login";
            ctx += `- ${u.name || "(tanpa nama)"} | ${u.email} | Role: ${u.role} | Status: ${u.status}${dept}${pos} | ${u._count.createdProjects} proyek dibuat | Last login: ${login} | Bergabung: ${fmtDate(u.createdAt)}\n`;
        }

        // ── PROJECT ──────────────────────────────────────────────────────────
        ctx += `\n## RINGKASAN PROYEK\n`;
        ctx += `- Total proyek: ${totalProjects}\n`;
        ctx += `- Total nilai kontrak: ${fmt(totalContractValue)}\n`;
        ctx += `- Total budget: ${fmt(totalBudget)}\n\n`;

        ctx += `### Status Proyek:\n`;
        for (const s of projectStats) {
            const avg = s._avg.progress ? Number(s._avg.progress).toFixed(0) : "0";
            ctx += `- ${s.status}: ${s._count.id} proyek | nilai ${fmt(Number(s._sum.totalPrice || 0))} | progress rata-rata ${avg}%\n`;
        }

        ctx += `\n### 10 Proyek Terbaru:\n`;
        for (const p of recentProjects) {
            const clientName = p.client?.companyName || p.client?.contactPerson || "Tanpa klien";
            ctx += `- "${p.name}" | ${p.status} | Progress: ${Number(p.progress).toFixed(0)}% | ${fmt(Number(p.totalPrice))} | Klien: ${clientName} | Lokasi: ${p.location || "-"} | ${fmtDate(p.startDate)} → ${fmtDate(p.endDate)}\n`;
        }

        // ── ASSEMBLY ─────────────────────────────────────────────────────────
        ctx += `\n## ASSEMBLY & MATERIAL\n`;
        ctx += `- Total assembly: ${totalAssemblies}\n`;
        for (const a of assemblyStats) {
            ctx += `  - Module ${a.module}: ${a._count.id} assembly\n`;
        }

        ctx += `\n### Assembly Terbaru:\n`;
        for (const a of topAssemblies) {
            ctx += `- "${a.name}" | Kategori: ${a.category.name} | Modul: ${a.module} | Dipakai di ${a._count.templates} template\n`;
        }

        // ── CLIENT ───────────────────────────────────────────────────────────
        ctx += `\n## KLIEN\n`;
        ctx += `- Total klien: ${totalClients}\n`;
        ctx += `- Total nilai kontrak klien: ${fmt(totalClientVal)}\n\n`;

        ctx += `### Klien Terbaru:\n`;
        for (const c of recentClients) {
            const name = c.companyName || c.contactPerson;
            ctx += `- "${name}" | ${c.city} | ${c.category} | ${c.status} | ${c.totalProjects} proyek | ${fmt(Number(c.totalContractValue))}\n`;
        }

        // ── TEMPLATE ─────────────────────────────────────────────────────────
        ctx += `\n## TEMPLATE\n`;
        ctx += `- Total template tersedia: ${templateStats}\n`;

        ctx += `\n--- END DATABASE CONTEXT ---\n`;

        return ctx;
    } catch (error) {
        console.error("[DB Context Error]", error);
        return "\n[Database context tidak tersedia saat ini]\n";
    }
}
