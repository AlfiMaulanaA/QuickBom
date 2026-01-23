#!/usr/bin/env node

/**
 * QuickBom Unified Database Seeder
 *
 * Consolidates all seeding logic into a single file.
 * Supports restoring data from JSON dumps in /data.
 *
 * Usage:
 *   node data/seeds/seed.js <seeder-name>
 *
 * Examples:
 *   node data/seeds/seed.js users
 *   node data/seeds/seed.js all
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Environment-aware database configuration
const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
        const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
        if (!supabaseUrl) throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL required in production');
        console.log('[SEED] Using Supabase/Production database');
        return { datasourceUrl: supabaseUrl };
    } else {
        const localUrl = process.env.DATABASE_URL;
        if (!localUrl) throw new Error('DATABASE_URL required in development');
        console.log('[SEED] Using local PostgreSQL database');
        return { datasourceUrl: localUrl };
    }
};

const createPrismaClient = () => {
    const config = getDatabaseConfig();
    return new PrismaClient({ datasourceUrl: config.datasourceUrl });
};

// --- DATA SEEDING FUNCTIONS ---

async function seedUsers(prisma) {
    console.log('👥 Seeding Users...');
    const dataPath = path.join(__dirname, '../../data/user.json');
    if (!fs.existsSync(dataPath)) return console.log('⚠️ user.json not found');

    const users = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const u of users) {
        try {
            ['dateOfBirth', 'hireDate', 'lastLogin', 'createdAt', 'updatedAt'].forEach(f => { if (u[f]) u[f] = new Date(u[f]); });
            if (u.salary) u.salary = u.salary.toString();
            await prisma.user.upsert({ where: { id: u.id }, update: u, create: u });
        } catch (e) { console.log(`Error user ${u.email}: ${e.message}`); }
    }
}

async function seedClients(prisma) {
    console.log('🏢 Seeding Clients...');
    const dataPath = path.join(__dirname, '../../data/client.json');
    if (!fs.existsSync(dataPath)) return console.log('⚠️ client.json not found');

    const clients = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const c of clients) {
        try {
            ['lastPaymentDate', 'createdAt', 'updatedAt'].forEach(f => { if (c[f]) c[f] = new Date(c[f]); });
            ['annualRevenue', 'creditLimit', 'totalContractValue', 'outstandingBalance'].forEach(f => { if (c[f]) c[f] = c[f].toString(); });
            await prisma.client.upsert({ where: { id: c.id }, update: c, create: c });
        } catch (e) { console.log(`Error client ${c.contactPerson}: ${e.message}`); }
    }
}

async function seedMaterials(prisma) {
    console.log('🔧 Seeding Materials...');
    const dataPath = path.join(__dirname, '../../data/material.json');
    if (!fs.existsSync(dataPath)) return console.log('⚠️ material.json not found');

    const materials = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const m of materials) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (m[f]) m[f] = new Date(m[f]); });
            if (m.price) m.price = m.price.toString();
            await prisma.material.upsert({ where: { id: m.id }, update: m, create: m });
        } catch (e) { console.log(`Error material ${m.name}: ${e.message}`); }
    }
}

async function seedAssemblyCategories(prisma) {
    console.log('📂 Seeding Assembly Categories...');
    const dataPath = path.join(__dirname, '../../data/assemblyCategory.json');
    if (!fs.existsSync(dataPath)) return console.log('⚠️ assemblyCategory.json not found');

    const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await prisma.assemblyCategory.upsert({ where: { id: i.id }, update: i, create: i });
        } catch (e) { console.log(`Error category ${i.name}: ${e.message}`); }
    }
}

async function seedAssemblies(prisma) {
    console.log('🏗️ Seeding Assemblies...');
    const asmPath = path.join(__dirname, '../../data/assembly.json');
    const relPath = path.join(__dirname, '../../data/assemblyMaterial.json');
    if (!fs.existsSync(asmPath)) return console.log('⚠️ assembly.json not found');

    const items = JSON.parse(fs.readFileSync(asmPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await prisma.assembly.upsert({ where: { id: i.id }, update: i, create: i });
        } catch (e) { console.log(`Error assembly ${i.name}: ${e.message}`); }
    }

    if (fs.existsSync(relPath)) {
        const rels = JSON.parse(fs.readFileSync(relPath, 'utf8'));
        for (const r of rels) {
            try {
                if (r.quantity) r.quantity = r.quantity.toString();
                await prisma.assemblyMaterial.upsert({
                    where: { assemblyId_materialId: { assemblyId: r.assemblyId, materialId: r.materialId } },
                    update: r, create: r
                });
            } catch (e) { }
        }
    }
}

async function seedAssemblyGroups(prisma) {
    console.log('📋 Seeding Assembly Groups...');
    const grpPath = path.join(__dirname, '../../data/assemblyGroup.json');
    const itemsPath = path.join(__dirname, '../../data/assemblyGroupItem.json');
    if (!fs.existsSync(grpPath)) return console.log('⚠️ assemblyGroup.json not found');

    const items = JSON.parse(fs.readFileSync(grpPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await prisma.assemblyGroup.upsert({ where: { id: i.id }, update: i, create: i });
        } catch (e) { console.log(`Error group ${i.name}: ${e.message}`); }
    }

    if (fs.existsSync(itemsPath)) {
        const rels = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
        for (const r of rels) {
            try {
                ['createdAt', 'updatedAt'].forEach(f => { if (r[f]) r[f] = new Date(r[f]); });
                if (r.quantity) r.quantity = r.quantity.toString();
                await prisma.assemblyGroupItem.upsert({
                    where: { groupId_assemblyId: { groupId: r.groupId, assemblyId: r.assemblyId } },
                    update: r, create: r
                });
            } catch (e) { }
        }
    }
}

async function seedTemplates(prisma) {
    console.log('📄 Seeding Templates...');
    const tplPath = path.join(__dirname, '../../data/template.json');
    const relPath = path.join(__dirname, '../../data/templateAssembly.json');
    if (!fs.existsSync(tplPath)) return console.log('⚠️ template.json not found');

    const items = JSON.parse(fs.readFileSync(tplPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await prisma.template.upsert({ where: { id: i.id }, update: i, create: i });
        } catch (e) { console.log(`Error template ${i.name}: ${e.message}`); }
    }

    if (fs.existsSync(relPath)) {
        const rels = JSON.parse(fs.readFileSync(relPath, 'utf8'));
        for (const r of rels) {
            try {
                if (r.quantity) r.quantity = r.quantity.toString();
                await prisma.templateAssembly.upsert({
                    where: { templateId_assemblyId: { templateId: r.templateId, assemblyId: r.assemblyId } },
                    update: r, create: r
                });
            } catch (e) { }
        }
    }
}

async function seedProjects(prisma) {
    console.log('🏗️ Seeding Projects...');
    const files = {
        project: 'project.json', projectTimeline: 'projectTimeline.json', projectMilestone: 'projectMilestone.json',
        projectTask: 'projectTask.json', projectOverrideHistory: 'projectOverrideHistory.json'
    };

    const data = {};
    for (const [key, filename] of Object.entries(files)) {
        const p = path.join(__dirname, '../../data', filename);
        data[key] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
    }

    // Projects
    for (const p of data.project) {
        try {
            ['createdAt', 'updatedAt', 'startDate', 'endDate', 'actualStart', 'actualEnd'].forEach(f => { if (p[f]) p[f] = new Date(p[f]); });
            ['area', 'budget', 'totalPrice', 'progress'].forEach(f => { if (p[f]) p[f] = p[f].toString(); });
            await prisma.project.upsert({ where: { id: p.id }, update: p, create: p });
        } catch (e) { }
    }

    // Timelines
    for (const t of data.projectTimeline) {
        try {
            ['startDate', 'endDate', 'createdAt', 'updatedAt'].forEach(f => { if (t[f]) t[f] = new Date(t[f]); });
            if (t.progress) t.progress = t.progress.toString();
            await prisma.projectTimeline.upsert({ where: { id: t.id }, update: t, create: t });
        } catch (e) { }
    }

    // Milestones
    for (const m of data.projectMilestone) {
        try {
            ['dueDate', 'actualDate'].forEach(f => { if (m[f]) m[f] = new Date(m[f]); });
            if (m.progress) m.progress = m.progress.toString();
            await prisma.projectMilestone.upsert({ where: { id: m.id }, update: m, create: m });
        } catch (e) { }
    }

    // Tasks
    for (const t of data.projectTask) {
        try {
            ['plannedStart', 'plannedEnd', 'actualStart', 'actualEnd'].forEach(f => { if (t[f]) t[f] = new Date(t[f]); });
            ['effortHours', 'actualHours', 'progress', 'estimatedCost', 'actualCost'].forEach(f => { if (t[f]) t[f] = t[f].toString(); });
            await prisma.projectTask.upsert({ where: { id: t.id }, update: t, create: t });
        } catch (e) { }
    }

    // Override History
    for (const h of data.projectOverrideHistory) {
        try {
            if (h.createdAt) h.createdAt = new Date(h.createdAt);
            await prisma.projectOverrideHistory.upsert({ where: { id: h.id }, update: h, create: h });
        } catch (e) { }
    }
}

// --- MAIN RUNNER ---

const SEEDERS = {
    users: { fn: seedUsers, deps: [] },
    clients: { fn: seedClients, deps: [] },
    materials: { fn: seedMaterials, deps: [] },
    'assembly-categories': { fn: seedAssemblyCategories, deps: [] },
    assemblies: { fn: seedAssemblies, deps: ['materials', 'assembly-categories'] },
    'assembly-groups': { fn: seedAssemblyGroups, deps: ['assemblies'] },
    templates: { fn: seedTemplates, deps: ['assemblies'] },
    projects: { fn: seedProjects, deps: ['clients', 'templates'] },
};

async function runSeeder(name, prisma, ran = new Set()) {
    if (ran.has(name)) return;
    const s = SEEDERS[name];
    if (!s) return console.log(`❌ Unknown seeder: ${name}`);

    for (const d of s.deps) await runSeeder(d, prisma, ran);

    await s.fn(prisma);
    ran.add(name);
}

async function main() {
    const args = process.argv.slice(2);
    const cmd = args[0] ? args[0].toLowerCase() : 'all';
    const prisma = createPrismaClient();

    try {
        if (cmd === 'all') {
            const ran = new Set();
            // Explicit order handling via dependencies
            await runSeeder('users', prisma, ran);
            await runSeeder('projects', prisma, ran); // Dependencies will trigger clients, templates, assemblies, etc.
            console.log('🎉 All Seeding Completed!');
        } else {
            await runSeeder(cmd, prisma);
            console.log(`✅ ${cmd} Completed`);
        }
    } catch (e) {
        console.error('❌ Seeding Failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    seedUsers, seedClients, seedMaterials, seedAssemblies,
    seedAssemblyCategories, seedAssemblyGroups, seedTemplates, seedProjects
};
