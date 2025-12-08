import * as cron from 'node-cron';
import { backupService } from './backup-service';

class BackupScheduler {
  private dailyBackupJob: cron.ScheduledTask | null = null;
  private cleanupJob: cron.ScheduledTask | null = null;
  private isInitialized = false;
  private isDailyBackupRunning = false;
  private isCleanupRunning = false;

  /**
   * Initialize the backup scheduler
   */
  initialize() {
    if (this.isInitialized) {
      console.log('Backup scheduler already initialized');
      return;
    }

    this.setupDailyBackup();
    this.setupCleanupJob();
    this.isInitialized = true;

    console.log('Backup scheduler initialized successfully');
    console.log('- Daily backup at 2:00 AM');
    console.log('- Cleanup job every 24 hours');
  }

  /**
   * Set up daily backup job (runs every day at 2:00 AM)
   */
  private setupDailyBackup() {
    // Schedule: "0 2 * * *" - Every day at 2:00 AM
    this.dailyBackupJob = cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled daily backup...');

      try {
        const metadata = await backupService.createBackup();

        if (metadata.status === 'success') {
          console.log(`Daily backup completed successfully: ${metadata.id}`);
        } else {
          console.error(`Daily backup failed: ${metadata.error}`);
          // Log failure but don't stop the scheduler
        }
      } catch (error) {
        console.error('Scheduled daily backup error:', error);
        // Ensure scheduler continues running despite errors
      }
    });
  }

  /**
   * Set up cleanup job (runs every 24 hours to remove backups older than 7 days)
   */
  private setupCleanupJob() {
    // Schedule: "0 3 * * *" - Every day at 3:00 AM (1 hour after backup)
    this.cleanupJob = cron.schedule('0 3 * * *', async () => {
      console.log('Starting scheduled backup cleanup...');

      try {
        const deletedCount = await backupService.cleanupOldBackups();

        if (deletedCount > 0) {
          console.log(`Cleanup completed: ${deletedCount} old backups removed`);
        } else {
          console.log('Cleanup completed: No old backups to remove');
        }
      } catch (error) {
        console.error('Scheduled cleanup error:', error);
        // Log error but continue running
      }
    });
  }

  /**
   * Start the backup scheduler
   */
  start() {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.dailyBackupJob && !this.isDailyBackupRunning) {
      this.dailyBackupJob.start();
      this.isDailyBackupRunning = true;
      console.log('Daily backup job started');
    }

    if (this.cleanupJob && !this.isCleanupRunning) {
      this.cleanupJob.start();
      this.isCleanupRunning = true;
      console.log('Cleanup job started');
    }
  }

  /**
   * Stop the backup scheduler
   */
  stop() {
    if (this.dailyBackupJob && this.isDailyBackupRunning) {
      this.dailyBackupJob.stop();
      this.isDailyBackupRunning = false;
      console.log('Daily backup job stopped');
    }

    if (this.cleanupJob && this.isCleanupRunning) {
      this.cleanupJob.stop();
      this.isCleanupRunning = false;
      console.log('Cleanup job stopped');
    }
  }

  /**
   * Manually trigger a backup (useful for testing)
   */
  async triggerBackup(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Manually triggering backup...');
      const metadata = await backupService.createBackup();

      if (metadata.status === 'success') {
        return {
          success: true,
          message: `Backup created successfully: ${metadata.id} (${(metadata.size / 1024).toFixed(2)} KB)`
        };
      } else {
        return {
          success: false,
          message: `Backup failed: ${metadata.error}`
        };
      }
    } catch (error) {
      console.error('Manual backup trigger error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Manually trigger cleanup (useful for testing)
   */
  async triggerCleanup(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Manually triggering cleanup...');
      const deletedCount = await backupService.cleanupOldBackups();

      return {
        success: true,
        message: `Cleanup completed: ${deletedCount} old backups removed`
      };
    } catch (error) {
      console.error('Manual cleanup trigger error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      dailyBackupRunning: this.isDailyBackupRunning,
      cleanupJobRunning: this.isCleanupRunning,
      nextBackupRun: this.getNextRunTime('0 2 * * *'),
      nextCleanupRun: this.getNextRunTime('0 3 * * *')
    };
  }

  /**
   * Calculate next run time for a cron expression
   */
  private getNextRunTime(cronExpression: string): Date | null {
    try {
      // This is a simplified calculation - in production you might want more sophisticated logic
      const now = new Date();
      const nextRun = new Date(now);

      // For daily jobs, just add 24 hours if past the scheduled time
      const [minute, hour] = cronExpression.split(' ').slice(0, 2).map(Number);

      nextRun.setHours(hour, minute, 0, 0);

      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      return nextRun;
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
const backupScheduler = new BackupScheduler();

export { backupScheduler };
