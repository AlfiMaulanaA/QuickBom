import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting data fix process...');

    // Fix Templates with invalid docs
    console.log('📄 Fixing templates...');
    const templates = await prisma.template.findMany({
      select: { id: true, name: true, docs: true }
    });

    let fixedTemplates = 0;
    for (const template of templates) {
      if (template.docs && typeof template.docs === 'string') {
        console.log(`Fixing template ${template.id}: ${template.docs}`);
        await prisma.template.update({
          where: { id: template.id },
          data: { docs: [] }
        });
        fixedTemplates++;
      }
    }

    // Fix Assemblies with invalid docs
    console.log('🏗️ Fixing assemblies...');
    const assemblies = await prisma.assembly.findMany({
      select: { id: true, name: true, docs: true }
    });

    let fixedAssemblies = 0;
    for (const assembly of assemblies) {
      if (assembly.docs && typeof assembly.docs === 'string') {
        console.log(`Fixing assembly ${assembly.id}: ${assembly.docs}`);
        await prisma.assembly.update({
          where: { id: assembly.id },
          data: { docs: [] }
        });
        fixedAssemblies++;
      }
    }

    // Fix Projects with invalid docs
    console.log('🏗️ Fixing projects...');
    const projects = await prisma.project.findMany({
      select: { id: true, name: true, schematicDocs: true, qualityCheckDocs: true }
    });

    let fixedProjects = 0;
    for (const project of projects) {
      const updates: any = {};

      if (project.schematicDocs && typeof project.schematicDocs === 'string') {
        console.log(`Fixing project ${project.id} schematicDocs`);
        updates.schematicDocs = null;
      }

      if (project.qualityCheckDocs && typeof project.qualityCheckDocs === 'string') {
        console.log(`Fixing project ${project.id} qualityCheckDocs`);
        updates.qualityCheckDocs = null;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.project.update({
          where: { id: project.id },
          data: updates
        });
        fixedProjects++;
      }
    }

    console.log(`✅ Data fix completed: ${fixedTemplates} templates, ${fixedAssemblies} assemblies, ${fixedProjects} projects`);

    return NextResponse.json({
      success: true,
      message: 'Data fix completed successfully',
      stats: {
        templates: fixedTemplates,
        assemblies: fixedAssemblies,
        projects: fixedProjects
      }
    });

  } catch (error: any) {
    console.error('❌ Error fixing data:', error);
    return NextResponse.json(
      { error: "Failed to fix data", details: error.message },
      { status: 500 }
    );
  }
}