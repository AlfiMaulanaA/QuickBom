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
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is required');
    console.log('[SEED] Connecting to database...');
    return { datasourceUrl: url };
};

const createPrismaClient = () => {
    const config = getDatabaseConfig();
    return new PrismaClient({ datasourceUrl: config.datasourceUrl });
};

// --- HELPER FOR SMART UPSERT ---
async function smartUpsert(prisma, modelName, data, uniqueField = null) {
    const model = prisma[modelName];
    try {
        // Handle composite IDs if any (specifically TemplateAssembly)
        if (modelName === 'templateAssembly') {
            return await model.upsert({
                where: { templateId_assemblyId: { templateId: data.templateId, assemblyId: data.assemblyId } },
                update: data,
                create: data
            });
        }

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
            console.log(`      ❌ Error in ${modelName}: ${error.message.split('\n')[0]}`);
            throw error; // Rethrow other errors
        }
    }
}

// --- DATA SEEDING FUNCTIONS ---

async function seedGeneric(prisma, modelName, fileName, uniqueField = null, dateFields = [], decimalFields = []) {
    console.log(`📦 Seeding ${modelName}...`);
    const dataPath = path.join(__dirname, `../../data/${fileName}`);
    if (!fs.existsSync(dataPath)) return console.log(`⚠️ ${fileName} not found`);

    const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    for (const i of items) {
        try {
            dateFields.forEach(f => { if (i[f]) i[f] = new Date(i[f]); });
            decimalFields.forEach(f => { if (i[f]) i[f] = i[f].toString(); });
            await smartUpsert(prisma, modelName, i, uniqueField);
        } catch (e) { console.log(`   ❌ Error ${modelName}: ${e.message}`); }
    }
}

async function seedUsers(prisma) {
    await seedGeneric(prisma, 'user', 'user.json', 'email',
        ['dateOfBirth', 'hireDate', 'lastLogin', 'createdAt', 'updatedAt'],
        ['salary']);
}

async function seedClients(prisma) {
    await seedGeneric(prisma, 'client', 'client.json', null,
        ['lastPaymentDate', 'createdAt', 'updatedAt'],
        ['annualRevenue', 'creditLimit', 'totalContractValue', 'outstandingBalance']);
}

async function seedAssemblyCategories(prisma) {
    await seedGeneric(prisma, 'assemblyCategory', 'assemblyCategory.json', 'name',
        ['createdAt', 'updatedAt']);
}

async function seedAssemblies(prisma) {
    await seedGeneric(prisma, 'assembly', 'assembly.json', 'name',
        ['createdAt', 'updatedAt']);
}

async function seedAssemblyMaterials(prisma) {
    await seedGeneric(prisma, 'assemblyMaterial', 'assemblyMaterial.json', null,
        ['createdAt', 'updatedAt'], ['price', 'quantity']);
}

async function seedAssemblyGroups(prisma) {
    await seedGeneric(prisma, 'assemblyGroup', 'assemblyGroup.json', null,
        ['createdAt', 'updatedAt']);
}

async function seedAssemblyGroupItems(prisma) {
    await seedGeneric(prisma, 'assemblyGroupItem', 'assemblyGroupItem.json', null,
        ['createdAt', 'updatedAt'], ['quantity']);
}

async function seedTemplates(prisma) {
    await seedGeneric(prisma, 'template', 'template.json', 'name',
        ['createdAt', 'updatedAt']);
}

async function seedTemplateAssemblies(prisma) {
    await seedGeneric(prisma, 'templateAssembly', 'templateAssembly.json', null,
        [], ['quantity']);
}

async function seedTemplateAssemblyGroups(prisma) {
    await seedGeneric(prisma, 'templateAssemblyGroup', 'templateAssemblyGroup.json', null,
        ['createdAt', 'updatedAt']);
}

async function seedTemplateAssemblyGroupItems(prisma) {
    await seedGeneric(prisma, 'templateAssemblyGroupItem', 'templateAssemblyGroupItem.json', null,
        ['createdAt', 'updatedAt'], ['quantity']);
}

async function seedProjects(prisma) {
    await seedGeneric(prisma, 'project', 'project.json', null,
        ['startDate', 'endDate', 'actualStart', 'actualEnd', 'createdAt', 'updatedAt'],
        ['budget', 'totalPrice', 'progress']);
}

// --- MAIN RUNNER ---

const SEEDERS = {
    users: { fn: seedUsers, deps: [] },
    clients: { fn: seedClients, deps: [] },
    'assembly-categories': { fn: seedAssemblyCategories, deps: [] },
    assemblies: { fn: seedAssemblies, deps: ['assembly-categories'] },
    'assembly-materials': { fn: seedAssemblyMaterials, deps: ['assemblies'] },
    'assembly-groups': { fn: seedAssemblyGroups, deps: ['assembly-categories'] },
    'assembly-group-items': { fn: seedAssemblyGroupItems, deps: ['assembly-groups', 'assemblies'] },
    templates: { fn: seedTemplates, deps: [] },
    'template-assemblies': { fn: seedTemplateAssemblies, deps: ['templates', 'assemblies'] },
    'template-assembly-groups': { fn: seedTemplateAssemblyGroups, deps: ['templates', 'assembly-categories'] },
    'template-assembly-group-items': { fn: seedTemplateAssemblyGroupItems, deps: ['template-assembly-groups', 'assemblies'] },
    projects: { fn: seedProjects, deps: ['users', 'clients', 'templates'] },
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
            const allSeeders = Object.keys(SEEDERS);
            const ran = new Set();
            for (const s of allSeeders) {
                await runSeeder(s, prisma, ran);
            }
            console.log('🎉 Comprehensive Seeding Completed!');
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
    seedUsers, seedClients, seedAssemblyCategories, seedAssemblies, seedAssemblyMaterials,
    seedAssemblyGroups, seedAssemblyGroupItems, seedTemplates, seedTemplateAssemblies,
    seedTemplateAssemblyGroups, seedTemplateAssemblyGroupItems, seedProjects
};
