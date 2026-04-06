import { PgDumpRunner } from './infrastructure/PgDumpRunner';
import { TriggerBackupUseCase } from './application/use-cases/TriggerBackupUseCase';
import { ListBackupsUseCase } from './application/use-cases/ListBackupsUseCase';
import { createBackupRoutes } from './interfaces/http/backup.routes';
import dotenv from 'dotenv';

dotenv.config();

const backupDir = process.env.BACKUP_DIR || './backups';

const pgDumpRunner = new PgDumpRunner();
const triggerBackupUseCase = new TriggerBackupUseCase(pgDumpRunner, backupDir);
const listBackupsUseCase = new ListBackupsUseCase(pgDumpRunner, backupDir);

const backupRouter = createBackupRoutes(triggerBackupUseCase, listBackupsUseCase);

export {
    backupRouter,
    triggerBackupUseCase,
    listBackupsUseCase
};
