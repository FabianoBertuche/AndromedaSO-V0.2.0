import chokidar from 'chokidar';
import path from 'path';
import { AddDocumentUseCase } from '../../application/use-cases/AddDocumentUseCase';
import { IKnowledgeRepository } from '../../../../../../core/src/domain/knowledge/IKnowledgeRepository';
import { KnowledgeSourceType } from '../../../../../../core/src/domain/knowledge/types';

export interface WatcherConfig {
    vaultPath: string;
    collectionId: string;
}

export class VaultWatcherService {
    private watchers = new Map<string, Awaited<ReturnType<typeof chokidar.watch>>>();

    constructor(
        private knowledgeRepository: IKnowledgeRepository,
        private addDocumentUseCase: AddDocumentUseCase
    ) { }

    public async startWatching(config: WatcherConfig): Promise<void> {
        if (this.watchers.has(config.collectionId)) {
            await this.stopWatching(config.collectionId);
        }

        const watcher = chokidar.watch(config.vaultPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            depth: 10
        });

        watcher
            .on('add', (filePath) => this.handleFileChange(filePath, config))
            .on('change', (filePath) => this.handleFileChange(filePath, config));

        this.watchers.set(config.collectionId, watcher);
        console.log(`[VaultWatcher] Started watching: ${config.vaultPath} for collection ${config.collectionId}`);
    }

    public async stopWatching(collectionId: string): Promise<void> {
        const watcher = this.watchers.get(collectionId);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(collectionId);
            console.log(`[VaultWatcher] Stopped watching collection ${collectionId}`);
        }
    }

    private async handleFileChange(filePath: string, config: WatcherConfig): Promise<void> {
        const ext = path.extname(filePath).toLowerCase();
        if (ext !== '.md' && ext !== '.txt') return;

        const fileName = path.basename(filePath);
        console.log(`[VaultWatcher] Change detected in ${fileName}`);

        try {
            // Read file content locally could be done here or in UseCase
            // For now, let's assume AddDocumentUseCase handles standard ingestion
            // We might need a specific "SyncVaultFileUseCase" in the future
            await this.addDocumentUseCase.execute({
                collectionId: config.collectionId,
                title: fileName,
                sourceType: KnowledgeSourceType.VAULT,
                sourcePath: filePath,
                mimeType: 'text/markdown',
                rawText: '',
                tenantId: 'default',
            });
        } catch (error) {
            console.error(`[VaultWatcher] Error syncing ${fileName}:`, error);
        }
    }
}
