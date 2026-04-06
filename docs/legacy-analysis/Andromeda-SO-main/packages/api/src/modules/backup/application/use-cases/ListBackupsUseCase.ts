import { PgDumpRunner } from '../../infrastructure/PgDumpRunner';

export class ListBackupsUseCase {
    constructor(
        private readonly pgDumpRunner: PgDumpRunner,
        private readonly backupDir: string
    ) { }

    async execute(): Promise<string[]> {
        return this.pgDumpRunner.list(this.backupDir);
    }
}
