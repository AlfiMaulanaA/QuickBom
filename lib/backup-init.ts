// lib/backup-init.ts
// Initialize backup scheduler on server startup

let initialized = false;

export function initializeBackupScheduler() {
  if (initialized) {
    console.log('Backup scheduler already initialized');
    return;
  }

  try {
    // Delay initialization to avoid Prisma client issues during Next.js compilation
    setTimeout(async () => {
      try {
        const { backupScheduler } = await import('./backup-scheduler');

        // Initialize the scheduler
        backupScheduler.initialize();
        console.log('Backup scheduler initialized');

        // Auto-start the scheduler in production only
        if (process.env.NODE_ENV === 'production') {
          backupScheduler.start();
          console.log('Backup scheduler auto-started and will run continuously');
        } else {
          console.log('Backup scheduler initialized but not started (development mode)');
        }

        initialized = true;
      } catch (error) {
        console.error('Failed to initialize backup scheduler:', error);
      }
    }, 1000); // Delay by 1 second to ensure Prisma client is ready
  } catch (error) {
    console.error('Failed to initialize backup scheduler:', error);
  }
}

// Call initialization
initializeBackupScheduler();
