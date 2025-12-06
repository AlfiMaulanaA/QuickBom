const bcrypt = require('bcryptjs');

async function seedUsers(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('👥 Seeding Users...');

  // Only 4 users as specified
  const users = [
    {
      email: 'admin@gmail.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+6281234567890',
      employeeId: 'ADM001',
      department: 'IT',
      position: 'Administrator',
    },
    {
      email: 'alfi@gmail.com',
      password: await bcrypt.hash('alfi123', 10),
      name: 'Alfi Maulana',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      phone: '+6281234567891',
      employeeId: 'PM001',
      department: 'Project Management',
      position: 'Project Manager',
    },
    {
      email: 'jonathan@gmail.com',
      password: await bcrypt.hash('jonathan123', 10),
      name: 'Jonathan',
      role: 'ENGINEER',
      status: 'ACTIVE',
      phone: '+6281234567892',
      employeeId: 'ENG001',
      department: 'Engineering',
      position: 'Engineer',
    },
    {
      email: 'hilmi@gmail.com',
      password: await bcrypt.hash('hilmi123', 10),
      name: 'Hilmi',
      role: 'ESTIMATOR',
      status: 'ACTIVE',
      phone: '+6281234567893',
      employeeId: 'EST001',
      department: 'Estimation',
      position: 'Estimator',
    },
  ];

  const allUsers = users;
  const createdUsers = [];

  for (const userData of allUsers) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });
      createdUsers.push(user);
      console.log(`✓ Created user: ${user.name} (${user.role}) - ${user.email}`);
    } catch (error) {
      console.log(`⚠️  Skipping duplicate user: ${userData.email}`);
    }
  }

  console.log(`\n✅ Users seeding completed! Created ${createdUsers.length} users`);

  console.log('\n🔐 Login Credentials:');
  console.log('Admin: admin@gmail.com / admin123');
  console.log('Alfi: alfi@gmail.com / alfi123');
  console.log('Jonathan: jonathan@gmail.com / jonathan123');
  console.log('Hilmi: hilmi@gmail.com / hilmi123');

  return createdUsers;
}

module.exports = { seedUsers };
