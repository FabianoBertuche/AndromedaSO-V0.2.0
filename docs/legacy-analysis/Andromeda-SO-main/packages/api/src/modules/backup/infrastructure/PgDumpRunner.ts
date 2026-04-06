import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export interface BackupResult {
    filename: string;
    path: string;
    success: boolean;
    error?: string;
}

export class PgDumpRunner {
    private readonly backupScriptPath: string;

    constructor() {
        // Path to scripts/backup.sh relative to packages/api
        this.backupScriptPath = path.resolve(__dirname, '../../../../../../scripts/backup.sh');
    }

    async run(backupDir: string): Promise<BackupResult> {
        const absoluteBackupDir = path.resolve(process.cwd(), backupDir);

        if (!fs.existsSync(absoluteBackupDir)) {
            fs.mkdirSync(absoluteBackupDir, { recursive: true });
        }

        try {
            // Execute the script
            // Pass the absolute backup directory as argument
            // We pass the DATABASE_URL environment variable to the script
            const { stdout, stderr } = await execAsync(`bash "${this.backupScriptPath}" "${absoluteBackupDir}"`, {
                env: { ...process.env }
            });

            const lines = stdout.trim().split('\n');
            const filename = lines[lines.length - 1]; // Last line should be the filename if successful

            if (stderr && !stdout.includes('Backup completed successfully')) {
                return {
                    filename: '',
                    path: '',
                    success: false,
                    error: stderr
                };
            }

            return {
                filename,
                path: path.join(absoluteBackupDir, filename),
                success: true
            };
        } catch (error: any) {
            return {
                filename: '',
                path: '',
                success: false,
                error: error.message
            };
        }
    }

    async list(backupDir: string): Promise<string[]> {
        const absoluteBackupDir = path.resolve(process.cwd(), backupDir);

        if (!fs.existsSync(absoluteBackupDir)) {
            return [];
        }

        const files = fs.readdirSync(absoluteBackupDir);
        return files
            .filter(file => file.startsWith('andromeda-db-') && file.endsWith('.sql.gz'))
            .sort((a, b) => b.localeCompare(a)); // Newest first
    }
}
