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

// --- MAIN RUNNER ---

const SEEDERS = {
    users: { fn: seedUsers, deps: [] },
    clients: { fn: seedClients, deps: [] },
    'assembly-categories': { fn: seedAssemblyCategories, deps: [] },
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
            await runSeeder('users', prisma);
            await runSeeder('clients', prisma);
            await runSeeder('assembly-categories', prisma);
            console.log('🎉 Selected Seeding Completed!');
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
    seedUsers, seedClients, seedAssemblyCategories
};
