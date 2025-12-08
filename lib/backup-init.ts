// lib/backup-init.ts
// Initialize backup scheduler on server startup

import { backupScheduler } from './backup-scheduler';

let initialized = false;

export function initializeBackupScheduler() {
  if (initialized) {
    console.log('Backup scheduler already initialized');
    return;
  }

  try {
    // Always initialize the scheduler
    backupScheduler.initialize();
    console.log('Backup scheduler initialized');

    // Always auto-start the scheduler regardless of environment
    backupScheduler.start();
    console.log('Backup scheduler auto-started and will run continuously');

    initialized = true;
  } catch (error) {
    console.error('Failed to initialize backup scheduler:', error);
  }
}

// Call initialization
initializeBackupScheduler();
