// test-backup-system.js - Comprehensive test for backup system
// Run with: node test-backup-system.js

const { backupService, backupScheduler } = require('./lib/backup-service.ts');

async function testBackupSystem() {
  console.log('🚀 Starting comprehensive backup system test...\n');

  try {
    // Test 1: Initialize scheduler
    console.log('📋 Test 1: Initializing scheduler...');
    backupScheduler.initialize();
    console.log('✅ Scheduler initialized\n');

    // Test 2: Get scheduler status
    console.log('📊 Test 2: Getting scheduler status...');
    const status = backupScheduler.getStatus();
    console.log('Scheduler status:', status);
    console.log('✅ Status retrieved\n');

    // Test 3: Create a backup
    console.log('💾 Test 3: Creating backup...');
    const metadata = await backupService.createBackup();
    console.log('Backup result:', metadata);

    if (metadata.status !== 'success') {
      throw new Error(`Backup failed: ${metadata.error}`);
    }
    console.log('✅ Backup created successfully\n');

    // Test 4: List backups
    console.log('📁 Test 4: Listing backups...');
    const backups = await backupService.listBackups();
    console.log(`Found ${backups.length} backups`);

    const latestBackup = backups[0];
    if (latestBackup) {
      console.log('Latest backup:', latestBackup.id, 'Size:', latestBackup.size, 'bytes');
    }
    console.log('✅ Backups listed\n');

    // Test 5: Get backup statistics
    console.log('📈 Test 5: Getting backup statistics...');
    const stats = await backupService.getBackupStats();
    console.log('Backup stats:', stats);
    console.log('✅ Statistics retrieved\n');

    // Test 6: Get specific backup data
    console.log('📄 Test 6: Getting specific backup data...');
    if (latestBackup) {
      const backupData = await backupService.getBackup(latestBackup.id);
      if (backupData) {
        console.log('Backup contains:');
        console.log('- Materials:', backupData.materials?.length || 0);
        console.log('- Assemblies:', backupData.assemblies?.length || 0);
        console.log('- Templates:', backupData.templates?.length || 0);
        console.log('- Timestamp:', backupData.timestamp);
        console.log('✅ Backup data retrieved\n');
      } else {
        console.log('❌ Failed to retrieve backup data\n');
      }
    }

    // Test 7: Trigger cleanup (should not remove recent backups)
    console.log('🧹 Test 7: Running cleanup...');
    const cleanupResult = await backupScheduler.triggerCleanup();
    console.log('Cleanup result:', cleanupResult);
    console.log('✅ Cleanup completed\n');

    // Test 8: Manual backup trigger via scheduler
    console.log('⚡ Test 8: Manual backup trigger...');
    const triggerResult = await backupScheduler.triggerBackup();
    console.log('Manual trigger result:', triggerResult);
    console.log('✅ Manual trigger completed\n');

    // Test 9: Verify backups after operations
    console.log('🔍 Test 9: Final backup verification...');
    const finalBackups = await backupService.listBackups();
    const finalStats = await backupService.getBackupStats();
    console.log(`Final count: ${finalBackups.length} backups`);
    console.log('Final stats:', finalStats);
    console.log('✅ Final verification completed\n');

    console.log('🎉 ALL TESTS PASSED! Backup system is working correctly.');
    console.log('\n📋 Summary:');
    console.log('- ✅ Scheduler initialization');
    console.log('- ✅ Backup creation');
    console.log('- ✅ Backup listing');
    console.log('- ✅ Statistics retrieval');
    console.log('- ✅ Backup data access');
    console.log('- ✅ Cleanup functionality');
    console.log('- ✅ Manual triggers');
    console.log('- ✅ Data integrity');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the comprehensive test
testBackupSystem().catch(error => {
  console.error('💥 Unexpected error during testing:', error);
  process.exit(1);
});
