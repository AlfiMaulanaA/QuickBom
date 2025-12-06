const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedProjects() {
  console.log('🏗️ Seeding Projects...');

  // Load projects from JSON file
  const projectsPath = path.join(__dirname, '../../data/projects.json');
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));

  // Get required related data
  const [clients, templates, users] = await Promise.all([
    prisma.client.findMany(),
    prisma.template.findMany(),
    prisma.user.findMany()
  ]);

  console.log(`Found ${clients.length} clients, ${templates.length} templates, and ${users.length} users in database`);

  // Create maps for easy lookup
  const clientMap = {};
  const templateMap = {};
  const userMap = {};

  clients.forEach(client => {
    clientMap[client.id] = client;
  });

  templates.forEach(template => {
    templateMap[template.name] = template;
  });

  users.forEach(user => {
    userMap[user.name] = user;
  });

  console.log(`Available clients for projects: ${Object.keys(clientMap).length} clients`);
  console.log(`Available templates: ${Object.keys(templateMap).join(', ')}`);
  console.log(`Available users: ${Object.keys(userMap).join(', ')}`);

  const createdProjects = [];

  for (const projectData of projectsData) {
    try {
      console.log(`\n🔍 Processing project: ${projectData.name}`);

      // Find related entities
      const client = clientMap[projectData.clientId];
      let template = null;
      let assignedUser = null;

      // Find template by name if specified
      if (projectData.templateName) {
        template = templateMap[projectData.templateName];
      }

      // Find assigned user by name if specified
      if (projectData.assignedUsers && projectData.assignedUsers.length > 0) {
        assignedUser = userMap[projectData.assignedUsers[0]];
      }

      // If assigned user not found by name, try to find by email or use default
      if (!assignedUser && projectData.assignedUsers && projectData.assignedUsers.length > 0) {
        // Try to find by email
        const userByEmail = users.find(u => u.email === projectData.assignedUsers[0]);
        if (userByEmail) {
          assignedUser = userByEmail;
        }
      }

      console.log(`   Client ID "${projectData.clientId}": ${client ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`   Template "${projectData.templateName}": ${template ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`   User "${projectData.assignedUsers ? projectData.assignedUsers[0] : 'None'}": ${assignedUser ? 'FOUND' : 'NOT FOUND'}`);

      if (!client) {
        console.log(`⚠️  Warning: Client ID "${projectData.clientId}" not found, skipping project`);
        continue;
      }

      // Use first available user as creator if no assigned user
      let creatorUser = assignedUser || users.find(u => u.role === 'ADMIN') || users[0];
      if (!creatorUser) {
        console.log(`⚠️  No users available for project creator, skipping project`);
        continue;
      }

      console.log(`   Creating project with clientId: ${client.id}, creatorId: ${creatorUser.id}`);

      const project = await prisma.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          clientId: client.id,
          fromTemplateId: template ? template.id : null,
          createdBy: creatorUser.id,
          assignedUsers: assignedUser ? [assignedUser.id] : [creatorUser.id],
          status: projectData.status || 'PLANNING',
          priority: projectData.priority || 'MEDIUM',
          location: projectData.location,
          area: projectData.area ? parseFloat(projectData.area) : null,
          budget: projectData.budget ? parseFloat(projectData.budget) : null,
          startDate: projectData.startDate ? new Date(projectData.startDate) : null,
          endDate: projectData.endDate ? new Date(projectData.endDate) : null,
          actualStart: projectData.actualStart ? new Date(projectData.actualStart) : null,
          actualEnd: projectData.actualEnd ? new Date(projectData.actualEnd) : null,
          progress: projectData.progress ? parseFloat(projectData.progress) : 0,
          projectType: projectData.projectType,
        },
        include: {
          client: true,
          creator: true,
          template: true,
        },
      });

      createdProjects.push(project);
      console.log(`✓ Created project: ${project.name}`);
      console.log(`   - Client: ${project.client.contactPerson} (${project.client.companyName || 'Individual'})`);
      console.log(`   - Template: ${project.template ? project.template.name : 'None'}`);
      console.log(`   - Status: ${project.status} (${project.progress}% complete)`);
      console.log(`   - Budget: ${project.budget ? project.budget.toLocaleString('id-ID') : 'Not set'} IDR`);

    } catch (error) {
      console.log(`❌ Error creating project: ${projectData.name}`);
      console.log(`   Error: ${error.message}`);
      if (error.code) {
        console.log(`   Code: ${error.code}`);
      }
      if (error.meta) {
        console.log(`   Meta: ${JSON.stringify(error.meta)}`);
      }
    }
  }

  console.log(`\n✅ Projects seeding completed! Created ${createdProjects.length} projects`);

  console.log('\n📊 Projects Summary:');
  console.log(`   Total Projects: ${createdProjects.length}`);

  // Group by status
  const statusGroups = {};
  createdProjects.forEach(project => {
    statusGroups[project.status] = (statusGroups[project.status] || 0) + 1;
  });

  Object.entries(statusGroups).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} projects`);
  });

  // Group by priority
  const priorityGroups = {};
  createdProjects.forEach(project => {
    priorityGroups[project.priority] = (priorityGroups[project.priority] || 0) + 1;
  });

  console.log('\n🎯 Priority Breakdown:');
  Object.entries(priorityGroups).forEach(([priority, count]) => {
    console.log(`   ${priority}: ${count} projects`);
  });

  // Calculate total budget
  const totalBudget = createdProjects.reduce((total, project) => total + (project.budget || 0), 0);
  console.log(`\n💰 Total Project Budget: ${totalBudget.toLocaleString('id-ID')} IDR`);

  // Calculate average project size
  const projectsWithArea = createdProjects.filter(p => p.area);
  if (projectsWithArea.length > 0) {
    const avgArea = projectsWithArea.reduce((total, project) => total + project.area, 0) / projectsWithArea.length;
    console.log(`🏗️  Average Project Area: ${avgArea.toFixed(1)} m²`);
  }

  return createdProjects;
}

module.exports = { seedProjects };
