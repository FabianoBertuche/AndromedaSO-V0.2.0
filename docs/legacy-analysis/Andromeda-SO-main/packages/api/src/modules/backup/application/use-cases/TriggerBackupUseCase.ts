import { PgDumpRunner, BackupResult } from '../../infrastructure/PgDumpRunner';

export class TriggerBackupUseCase {
    constructor(
        private readonly pgDumpRunner: PgDumpRunner,
        private readonly backupDir: string
    ) { }

    async execute(): Promise<BackupResult> {
        console.log(`[Backup] Triggering backup to ${this.backupDir}...`);
        return this.pgDumpRunner.run(this.backupDir);
    }
}
