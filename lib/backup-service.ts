import { prisma } from "@/lib/prisma";
import * as fs from 'fs';
import * as path from 'path';

interface BackupData {
  materials: any[];
  assemblies: any[];
  templates: any[];
  timestamp: string;
  version: string;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  size: number;
  status: 'success' | 'failed';
  error?: string;
  filePath?: string;
}

class BackupService {
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  private ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a complete backup of materials, assemblies, and templates
   */
  async createBackup(isManual: boolean = false, customName?: string): Promise<BackupMetadata> {
    const now = new Date();
    let backupId: string;

    if (isManual && customName) {
      // Manual backup with custom name
      const sanitizedName = customName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      backupId = `manual_${sanitizedName}_${timestamp}`;
    } else {
      // Automatic daily backup
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      backupId = `daily_backup_${dateStr}`;
    }

    const timestamp = now.toISOString().replace(/[:.]/g, '-');

    try {
      // Fetch all data
      const [materials, assemblies, templates] = await Promise.all([
        prisma.material.findMany({
          include: {
            assemblies: {
              include: {
                assembly: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.assembly.findMany({
          include: {
            materials: {
              include: {
                material: true
              }
            },
            templates: {
              include: {
                template: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.template.findMany({
          include: {
            assemblies: {
              include: {
                assembly: true
              }
            },
            projects: {
              select: {
                id: true,
                name: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const backupData: BackupData = {
        materials,
        assemblies,
        templates,
        timestamp,
        version: '1.0'
      };

      // Create backup file
      const fileName = `${backupId}.json`;
      const filePath = path.join(this.backupDir, fileName);
      const jsonData = JSON.stringify(backupData, null, 2);

      fs.writeFileSync(filePath, jsonData);

      const stats = fs.statSync(filePath);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size: stats.size,
        status: 'success',
        filePath
      };

      // Log successful backup
      console.log(`Backup created successfully: ${backupId}, Size: ${(stats.size / 1024).toFixed(2)} KB`);

      return metadata;

    } catch (error) {
      console.error('Backup creation failed:', error);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        size: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return metadata;
    }
  }

  /**
   * List all backups with metadata
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json') && (file.startsWith('daily_backup_') || file.startsWith('manual_')))
        .sort()
        .reverse(); // Most recent first

      const backups: BackupMetadata[] = files.map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileNameWithoutExt = file.replace('.json', '');

        let timestamp: Date;

        if (fileNameWithoutExt.startsWith('daily_backup_')) {
          // Daily backup format: daily_backup_YYYY-MM-DD
          const dateStr = fileNameWithoutExt.replace('daily_backup_', '');
          timestamp = new Date(dateStr + 'T00:00:00.000Z');
        } else if (fileNameWithoutExt.startsWith('manual_')) {
          // Manual backup format: manual_customname_YYYY-MM-DDTHH-mm-ss-sssZ
          const timestampMatch = fileNameWithoutExt.match(/manual_.*_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
          if (timestampMatch) {
            const timestampStr = timestampMatch[1].replace(/-/g, ':');
            timestamp = new Date(timestampStr);
          } else {
            timestamp = stats.mtime;
          }
        } else {
          // Fallback to file modification time
          timestamp = stats.mtime;
        }

        return {
          id: fileNameWithoutExt,
          timestamp,
          size: stats.size,
          status: 'success',
          filePath
        };
      });

      return backups;
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Get backup data by ID
   */
  async getBackup(id: string): Promise<BackupData | null> {
    try {
      const filePath = path.join(this.backupDir, `${id}.json`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to read backup ${id}:`, error);
      return null;
    }
  }

  /**
   * Delete backup by ID
   */
  async deleteBackup(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.backupDir, `${id}.json`);

      if (!fs.existsSync(filePath)) {
        return false;
      }

      fs.unlinkSync(filePath);
      console.log(`Backup deleted: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete backup ${id}:`, error);
      return false;
    }
  }

  /**
   * Clean up old backups (older than 7 days)
   */
  async cleanupOldBackups(): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const backups = await this.listBackups();
      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.timestamp < sevenDaysAgo) {
          const success = await this.deleteBackup(backup.id);
          if (success) {
            deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old backups`);
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

      const successfulBackups = backups.filter(b => b.status === 'success').length;
      const failedBackups = backups.filter(b => b.status === 'failed').length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentBackups = backups.filter(b => b.timestamp >= sevenDaysAgo).length;

      return {
        totalBackups: backups.length,
        totalSize,
        successfulBackups,
        failedBackups,
        recentBackups,
        lastBackup: backups.length > 0 ? backups[0].timestamp : null
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        successfulBackups: 0,
        failedBackups: 0,
        recentBackups: 0,
        lastBackup: null
      };
    }
  }

  /**
   * Restore data from backup (materials, assemblies, templates only)
   * Note: This will not restore projects or other data
   */
  async restoreFromBackup(backupId: string): Promise<{ success: boolean; message: string; restored: { materials: number; assemblies: number; templates: number } }> {
    try {
      const backupData = await this.getBackup(backupId);

      if (!backupData) {
        return {
          success: false,
          message: 'Backup not found',
          restored: { materials: 0, assemblies: 0, templates: 0 }
        };
      }

      let materialsRestored = 0;
      let assembliesRestored = 0;
      let templatesRestored = 0;

      // Clear existing data first
      await Promise.all([
        prisma.assemblyMaterial.deleteMany(),
        prisma.templateAssembly.deleteMany(),
        prisma.material.deleteMany(),
        prisma.assembly.deleteMany(),
        prisma.template.deleteMany()
      ]);

      // Restore materials
      for (const material of backupData.materials) {
        try {
          await prisma.material.create({
            data: {
              name: material.name,
              partNumber: material.partNumber,
              manufacturer: material.manufacturer,
              unit: material.unit,
              price: material.price,
              purchaseUrl: material.purchaseUrl,
              datasheetFile: material.datasheetFile,
              createdAt: new Date(material.createdAt),
              updatedAt: new Date(material.updatedAt)
            }
          });
          materialsRestored++;
        } catch (error) {
          console.error(`Failed to restore material ${material.name}:`, error);
        }
      }

      // Restore assemblies
      for (const assembly of backupData.assemblies) {
        try {
          const createdAssembly = await prisma.assembly.create({
            data: {
              name: assembly.name,
              description: assembly.description,
              docs: assembly.docs,
              createdAt: new Date(assembly.createdAt),
              updatedAt: new Date(assembly.updatedAt)
            }
          });

          // Restore assembly materials
          for (const am of assembly.materials) {
            try {
              await prisma.assemblyMaterial.create({
                data: {
                  assemblyId: createdAssembly.id,
                  materialId: am.materialId,
                  quantity: am.quantity
                }
              });
            } catch (error) {
              console.error(`Failed to restore assembly material for assembly ${assembly.name}:`, error);
            }
          }

          assembliesRestored++;
        } catch (error) {
          console.error(`Failed to restore assembly ${assembly.name}:`, error);
        }
      }

      // Restore templates
      for (const template of backupData.templates) {
        try {
          const createdTemplate = await prisma.template.create({
            data: {
              name: template.name,
              description: template.description,
              docs: template.docs,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt)
            }
          });

          // Restore template assemblies
          for (const ta of template.assemblies) {
            try {
              await prisma.templateAssembly.create({
                data: {
                  templateId: createdTemplate.id,
                  assemblyId: ta.assemblyId,
                  quantity: ta.quantity
                }
              });
            } catch (error) {
              console.error(`Failed to restore template assembly for template ${template.name}:`, error);
            }
          }

          templatesRestored++;
        } catch (error) {
          console.error(`Failed to restore template ${template.name}:`, error);
        }
      }

      return {
        success: true,
        message: `Successfully restored ${materialsRestored} materials, ${assembliesRestored} assemblies, and ${templatesRestored} templates`,
        restored: { materials: materialsRestored, assemblies: assembliesRestored, templates: templatesRestored }
      };

    } catch (error) {
      console.error('Restore operation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during restore',
        restored: { materials: 0, assemblies: 0, templates: 0 }
      };
    }
  }
}

// Singleton instance
const backupService = new BackupService();

export { backupService };
export type { BackupData, BackupMetadata };
