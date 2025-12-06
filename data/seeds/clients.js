async function seedClients(prismaInstance = null) {
  const prisma = prismaInstance; // Use provided prisma instance
  console.log('🏢 Seeding Clients...');

  const clients = [
    // Individual clients
    {
      clientType: 'INDIVIDUAL',
      category: 'RESIDENTIAL',
      status: 'ACTIVE',
      contactPerson: 'Ahmad Susanto',
      contactTitle: 'Owner',
      contactEmail: 'ahmad.susanto@email.com',
      contactPhone: '+6281234567890',
      contactPhone2: '+6289876543210',
      address: 'Jl. Sudirman No. 123',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10230',
      country: 'Indonesia',
      industry: 'Personal',
      companySize: 'Individual',
      annualRevenue: 0,
      creditLimit: 500000000, // 500 million IDR
      paymentTerms: '30 days',
      totalProjects: 2,
      activeProjects: 1,
      completedProjects: 1,
      totalContractValue: 750000000,
      outstandingBalance: 250000000,
      lastPaymentDate: new Date('2024-11-15'),
      preferences: {
        communication: 'WhatsApp',
        paymentMethod: 'Bank Transfer',
        preferredContactTime: 'Morning'
      },
      specialNotes: 'VIP client - prefers premium materials',
      source: 'Referral',
      referralSource: 'Existing Client',
      marketingConsent: true,
      dataConsent: true,
    },
    {
      clientType: 'INDIVIDUAL',
      category: 'RESIDENTIAL',
      status: 'ACTIVE',
      contactPerson: 'Siti Nurhaliza',
      contactTitle: 'Housewife',
      contactEmail: 'siti.nurhaliza@email.com',
      contactPhone: '+6281234567891',
      address: 'Jl. Thamrin No. 456',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
      country: 'Indonesia',
      industry: 'Personal',
      companySize: 'Individual',
      annualRevenue: 0,
      creditLimit: 300000000,
      paymentTerms: '15 days',
      totalProjects: 1,
      activeProjects: 1,
      completedProjects: 0,
      totalContractValue: 450000000,
      outstandingBalance: 450000000,
      preferences: {
        communication: 'Phone Call',
        paymentMethod: 'Cash',
        preferredContactTime: 'Afternoon'
      },
      specialNotes: 'First-time client, budget conscious',
      source: 'Online Search',
      marketingConsent: true,
      dataConsent: true,
    },

    // Company clients
    {
      clientType: 'COMPANY',
      category: 'COMMERCIAL',
      status: 'ACTIVE',
      companyName: 'PT. Modern Office Solutions',
      companyType: 'PT',
      businessLicense: '1234567890123456',
      taxId: '01.234.567.8-123.456',
      companyEmail: 'procurement@modernoffice.co.id',
      companyPhone: '+62211234567',
      website: 'https://www.modernoffice.co.id',
      contactPerson: 'Budi Santoso',
      contactTitle: 'Procurement Manager',
      contactEmail: 'budi.santoso@modernoffice.co.id',
      contactPhone: '+6281234567892',
      address: 'Jl. Gatot Subroto No. 789',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12930',
      country: 'Indonesia',
      industry: 'Office Furniture',
      companySize: 'Medium',
      annualRevenue: 50000000000, // 50 billion IDR
      creditLimit: 2000000000, // 2 billion IDR
      paymentTerms: '45 days',
      totalProjects: 5,
      activeProjects: 2,
      completedProjects: 3,
      totalContractValue: 3500000000,
      outstandingBalance: 750000000,
      lastPaymentDate: new Date('2024-12-01'),
      paymentHistory: [
        { date: '2024-11-15', amount: 250000000, description: 'Office renovation phase 1' },
        { date: '2024-10-30', amount: 300000000, description: 'Meeting room setup' }
      ],
      preferences: {
        communication: 'Email',
        paymentMethod: 'Bank Transfer',
        preferredContactTime: 'Business Hours'
      },
      specialNotes: 'Corporate client - requires formal invoicing',
      contractTerms: 'Standard corporate terms apply',
      source: 'Direct Sales',
      marketingConsent: true,
      dataConsent: true,
    },
    {
      clientType: 'COMPANY',
      category: 'INDUSTRIAL',
      status: 'ACTIVE',
      companyName: 'CV. Maju Jaya Construction',
      companyType: 'CV',
      businessLicense: '6543210987654321',
      taxId: '02.345.678.9-234.567',
      companyEmail: 'info@majujayaconstruction.com',
      companyPhone: '+62219876543',
      website: 'https://www.majujayaconstruction.com',
      contactPerson: 'Cahyo Pratama',
      contactTitle: 'Director',
      contactEmail: 'cahyo@majujayaconstruction.com',
      contactPhone: '+6281234567893',
      address: 'Jl. Raya Bogor No. 1000',
      city: 'Depok',
      province: 'Jawa Barat',
      postalCode: '16451',
      country: 'Indonesia',
      industry: 'Construction',
      companySize: 'Small',
      annualRevenue: 2000000000,
      creditLimit: 500000000,
      paymentTerms: '30 days',
      totalProjects: 8,
      activeProjects: 3,
      completedProjects: 5,
      totalContractValue: 1800000000,
      outstandingBalance: 200000000,
      lastPaymentDate: new Date('2024-11-20'),
      preferences: {
        communication: 'WhatsApp',
        paymentMethod: 'Bank Transfer',
        preferredContactTime: 'Morning'
      },
      specialNotes: 'Sub-contractor - good track record',
      source: 'Referral',
      referralSource: 'PT. Modern Office Solutions',
      marketingConsent: true,
      dataConsent: true,
    },

    // Government client
    {
      clientType: 'GOVERNMENT',
      category: 'INSTITUTIONAL',
      status: 'ACTIVE',
      companyName: 'Dinas Pekerjaan Umum Kota Jakarta',
      companyType: 'Government Agency',
      businessLicense: 'GOV-JKT-2024-001',
      taxId: '00.000.000.0-000.000',
      companyEmail: 'ppu@jakarta.go.id',
      companyPhone: '+62213800000',
      website: 'https://ppu.jakarta.go.id',
      contactPerson: 'Dr. Ir. Dwi Cahyono',
      contactTitle: 'Head of Infrastructure Division',
      contactEmail: 'dwi.cahyono@jakarta.go.id',
      contactPhone: '+6281234567894',
      address: 'Jl. Medan Merdeka Selatan No. 8-9',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10110',
      country: 'Indonesia',
      industry: 'Government',
      companySize: 'Large',
      annualRevenue: 0,
      creditLimit: 10000000000, // 10 billion IDR
      paymentTerms: '60 days',
      totalProjects: 15,
      activeProjects: 4,
      completedProjects: 11,
      totalContractValue: 25000000000,
      outstandingBalance: 3000000000,
      lastPaymentDate: new Date('2024-12-05'),
      preferences: {
        communication: 'Email',
        paymentMethod: 'Government Transfer',
        preferredContactTime: 'Business Hours'
      },
      specialNotes: 'Government client - strict compliance required',
      contractTerms: 'Government procurement regulations apply',
      source: 'Tender',
      marketingConsent: false,
      dataConsent: true,
    },

    // Contractor client
    {
      clientType: 'CONTRACTOR',
      category: 'INFRASTRUCTURE',
      status: 'ACTIVE',
      companyName: 'PT. Wijaya Karya Bangunan',
      companyType: 'PT',
      businessLicense: 'WK-2024-567890',
      taxId: '03.456.789.0-345.678',
      companyEmail: 'tender@wijayakarya.co.id',
      companyPhone: '+62212987654',
      website: 'https://www.wijayakarya.co.id',
      contactPerson: 'Eko Susilo',
      contactTitle: 'Project Coordinator',
      contactEmail: 'eko.susilo@wijayakarya.co.id',
      contactPhone: '+6281234567895',
      address: 'Jl. Letjend. MT. Haryono No. 1234',
      city: 'Jakarta Timur',
      province: 'DKI Jakarta',
      postalCode: '13350',
      country: 'Indonesia',
      industry: 'Infrastructure',
      companySize: 'Large',
      annualRevenue: 150000000000, // 150 billion IDR
      creditLimit: 5000000000,
      paymentTerms: '45 days',
      totalProjects: 25,
      activeProjects: 6,
      completedProjects: 19,
      totalContractValue: 75000000000,
      outstandingBalance: 1500000000,
      lastPaymentDate: new Date('2024-11-28'),
      preferences: {
        communication: 'Email',
        paymentMethod: 'Bank Transfer',
        preferredContactTime: 'Business Hours'
      },
      specialNotes: 'Major contractor - bulk orders expected',
      contractTerms: 'Enterprise agreement terms',
      source: 'Direct Sales',
      marketingConsent: true,
      dataConsent: true,
    },

    // Inactive client
    {
      clientType: 'INDIVIDUAL',
      category: 'RESIDENTIAL',
      status: 'INACTIVE',
      contactPerson: 'Fajar Ramadhan',
      contactTitle: 'Owner',
      contactEmail: 'fajar.ramadhan@email.com',
      contactPhone: '+6281234567896',
      address: 'Jl. Malioboro No. 567',
      city: 'Yogyakarta',
      province: 'DI Yogyakarta',
      postalCode: '55271',
      country: 'Indonesia',
      industry: 'Personal',
      companySize: 'Individual',
      annualRevenue: 0,
      creditLimit: 100000000,
      paymentTerms: '30 days',
      totalProjects: 1,
      activeProjects: 0,
      completedProjects: 1,
      totalContractValue: 150000000,
      outstandingBalance: 0,
      lastPaymentDate: new Date('2024-06-15'),
      specialNotes: 'Inactive - project completed, no follow-up needed',
      source: 'Walk-in',
      marketingConsent: false,
      dataConsent: false,
    },

    // Blacklisted client
    {
      clientType: 'COMPANY',
      category: 'COMMERCIAL',
      status: 'BLACKLISTED',
      companyName: 'PT. Abadi Sejahtera',
      companyType: 'PT',
      businessLicense: 'BLACKLISTED-001',
      companyEmail: 'contact@abadi-sejahtera.co.id',
      companyPhone: '+622112345678',
      contactPerson: 'Gunawan Hartono',
      contactTitle: 'CEO',
      contactEmail: 'gunawan@abadi-sejahtera.co.id',
      contactPhone: '+6281234567897',
      address: 'Jl. Veteran No. 999',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60294',
      country: 'Indonesia',
      industry: 'Trading',
      companySize: 'Medium',
      specialNotes: 'BLACKLISTED - Non-payment of invoices',
      source: 'Former Client',
      marketingConsent: false,
      dataConsent: false,
    },

    // Pending approval
    {
      clientType: 'COMPANY',
      category: 'INDUSTRIAL',
      status: 'PENDING_APPROVAL',
      companyName: 'PT. Baru Mulia Industries',
      companyType: 'PT',
      businessLicense: 'PENDING-2024-001',
      companyEmail: 'hr@barumulia.com',
      companyPhone: '+62217654321',
      contactPerson: 'Hendro Wicaksono',
      contactTitle: 'HR Manager',
      contactEmail: 'hendro@barumulia.com',
      contactPhone: '+6281234567898',
      address: 'Jl. Industri No. 2000',
      city: 'Bekasi',
      province: 'Jawa Barat',
      postalCode: '17510',
      country: 'Indonesia',
      industry: 'Manufacturing',
      companySize: 'Large',
      specialNotes: 'Pending credit approval - large corporation',
      source: 'Cold Call',
      marketingConsent: true,
      dataConsent: true,
    },
  ];

  const createdClients = [];

  for (const clientData of clients) {
    try {
      const client = await prisma.client.create({
        data: clientData,
      });
      createdClients.push(client);
      console.log(`✓ Created client: ${client.contactPerson} (${client.companyName || 'Individual'}) - ${client.contactEmail}`);
    } catch (error) {
      console.log(`⚠️  Skipping duplicate client: ${clientData.contactEmail} (${error.message})`);
    }
  }

  console.log(`\n✅ Clients seeding completed! Created ${createdClients.length} clients`);

  console.log('\n📊 Client Summary:');
  console.log(`   Individual Clients: ${clients.filter(c => c.clientType === 'INDIVIDUAL').length}`);
  console.log(`   Company Clients: ${clients.filter(c => c.clientType === 'COMPANY').length}`);
  console.log(`   Government Clients: ${clients.filter(c => c.clientType === 'GOVERNMENT').length}`);
  console.log(`   Contractor Clients: ${clients.filter(c => c.clientType === 'CONTRACTOR').length}`);
  console.log(`   Active Clients: ${clients.filter(c => c.status === 'ACTIVE').length}`);
  console.log(`   Inactive/Pending/Blacklisted: ${clients.filter(c => c.status !== 'ACTIVE').length}`);

  return createdClients;
}

module.exports = { seedClients };
