#!/usr/bin/env node

/**
 * Product Configurator Unified Database Seeder
 *
 * Consolidates all seeding logic into a single file.
 * Supports restoring data from JSON dumps in /data.
 *
 * Updated to handle removal of local Material table and move to Snapshots.
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
        if (!localUrl) {
            // Fallback for local dev if DATABASE_URL is not in env but we want to use default
            return { datasourceUrl: 'postgresql://quickbom:quickbom_password@localhost:5432/quickbom?schema=public' };
        }
        console.log('[SEED] Using local PostgreSQL database');
        return { datasourceUrl: localUrl };
    }
};

const createPrismaClient = () => {
    const config = getDatabaseConfig();
    return new PrismaClient({ datasourceUrl: config.datasourceUrl });
};

// --- HELPER FOR SMART UPSERT ---
async function smartUpsert(prisma, modelName, data, uniqueField = null) {
    const model = prisma[modelName];
    try {
        // 1. Try standard upsert first (covers ID match or clean insert)
        await model.upsert({ where: { id: data.id }, update: data, create: data });
    } catch (error) {
        // 2. Catch Unique Constraint Violation
        if (error.code === 'P2002' && uniqueField) {
            console.log(`   ⚠️  Conflict on ${modelName}.${uniqueField} = ${data[uniqueField]}`);

            // Find the conflicting record
            const existing = await model.findUnique({ where: { [uniqueField]: data[uniqueField] } });

            if (existing && existing.id !== data.id) {
                console.log(`      Mismatch: DB ID ${existing.id} vs Dump ID ${data.id}. Attempting replace...`);
                try {
                    // Delete generic record to make way for the correct Dump ID
                    await model.delete({ where: { id: existing.id } });
                    console.log(`      🗑️  Deleted conflicting record ${existing.id}`);
                    // Retry create with correct ID
                    await model.create({ data });
                    console.log(`      ✅ Re-created with correct ID`);
                } catch (delError) {
                    console.log(`      ❌ Could not replace: ${delError.message.split('\n')[0]}`);
                    console.log(`      (This record likely has dependent data preventing deletion. Run db:clear first or fix manually.)`);
                }
            } else {
                console.log(`      Unknown conflict state.`);
            }
        } else {
            throw error; // Rethrow other errors
        }
    }
}

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
            await smartUpsert(prisma, 'user', u, 'email');
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
            await smartUpsert(prisma, 'client', c);
        } catch (e) { console.log(`Error client ${c.contactPerson}: ${e.message}`); }
    }
}

// Material seeding is now DEPRECATED as a table, 
// but we keep this function to load the data for AssemblyMaterial snapshots
async function getMaterialMap() {
    const dataPath = path.join(__dirname, '../../data/material.json');
    if (!fs.existsSync(dataPath)) return new Map();

    const materials = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const map = new Map();
    for (const m of materials) {
        map.set(m.id, m);
    }
    return map;
}

async function seedAssemblyCategories(prisma) {
    console.log('📂 Seeding Assembly Categories...');
    const dataPath = path.join(__dirname, '../../data/assemblyCategory.json');
    if (!fs.existsSync(dataPath)) return console.log('⚠️ assemblyCategory.json not found');

    const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await smartUpsert(prisma, 'assemblyCategory', i, 'name');
        } catch (e) { console.log(`Error category ${i.name}: ${e.message}`); }
    }
}

async function seedAssemblies(prisma) {
    console.log('🏗️ Seeding Assemblies...');
    const asmPath = path.join(__dirname, '../../data/assembly.json');
    const relPath = path.join(__dirname, '../../data/assemblyMaterial.json');
    if (!fs.existsSync(asmPath)) return console.log('⚠️ assembly.json not found');

    // Load materials for snapshots
    const materialMap = await getMaterialMap();

    const items = JSON.parse(fs.readFileSync(asmPath, 'utf8'));
    for (const i of items) {
        try {
            ['createdAt', 'updatedAt'].forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            await smartUpsert(prisma, 'assembly', i, 'name');
        } catch (e) { console.log(`Error assembly ${i.name}: ${e.message}`); }
    }

    if (fs.existsSync(relPath)) {
        console.log('🔗 Seeding Assembly Materials (Snapshots)...');
        const rels = JSON.parse(fs.readFileSync(relPath, 'utf8'));
        for (const r of rels) {
            try {
                const materialInfo = materialMap.get(r.materialId);
                if (!materialInfo) {
                    console.log(`   ⚠️ Skipping missing material ID ${r.materialId} for assembly ${r.assemblyId}`);
                    continue;
                }

                const quantity = r.quantity ? r.quantity.toString() : "1";
                const price = materialInfo.price ? materialInfo.price.toString() : "0";

                await prisma.assemblyMaterial.upsert({
                    where: { assemblyId_externalId: { assemblyId: r.assemblyId, externalId: r.materialId.toString() } },
                    update: {
                        quantity,
                        price,
                        name: materialInfo.name,
                        partNumber: materialInfo.partNumber || null,
                        manufacturer: materialInfo.manufacturer || null,
                        unit: materialInfo.unit || "EACH"
                    },
                    create: {
                        assemblyId: r.assemblyId,
                        externalId: r.materialId.toString(),
                        quantity,
                        price,
                        name: materialInfo.name,
                        partNumber: materialInfo.partNumber || null,
                        manufacturer: materialInfo.manufacturer || null,
                        unit: materialInfo.unit || "EACH"
                    }
                });
            } catch (e) {
                console.log(`   ❌ Error assemblyMaterial (Asm:${r.assemblyId} Mat:${r.materialId}): ${e.message.split('\n')[0]}`);
            }
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
            await smartUpsert(prisma, 'assemblyGroup', i);
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
            await smartUpsert(prisma, 'template', i, 'name');
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
        project: 'project.json'
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
            await smartUpsert(prisma, 'project', p);
        } catch (e) { }
    }
}

// --- MAIN RUNNER ---

const SEEDERS = {
    users: { fn: seedUsers, deps: [] },
    clients: { fn: seedClients, deps: [] },
    'assembly-categories': { fn: seedAssemblyCategories, deps: [] },
    assemblies: { fn: seedAssemblies, deps: ['assembly-categories'] },
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
            await runSeeder('projects', prisma, ran);
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
    seedUsers, seedClients, seedAssemblies,
    seedAssemblyCategories, seedAssemblyGroups, seedTemplates, seedProjects
};
