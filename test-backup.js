// test-backup.js - Simple test script for backup functionality
// Run with: node test-backup.js

const { backupService, backupScheduler } = require('./lib/backup-service.ts');

async function testBackup() {
  console.log('Testing backup functionality...');

  try {
    // Test creating a backup
    console.log('1. Creating backup...');
    const metadata = await backupService.createBackup();
    console.log('Backup created:', metadata);

    // Test listing backups
    console.log('2. Listing backups...');
    const backups = await backupService.listBackups();
    console.log(`Found ${backups.length} backups`);

    // Test getting backup stats
    console.log('3. Getting backup stats...');
    const stats = await backupService.getBackupStats();
    console.log('Backup stats:', stats);

    // Test scheduler status
    console.log('4. Getting scheduler status...');
    const status = backupScheduler.getStatus();
    console.log('Scheduler status:', status);

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBackup();
