import { readFileSync, statSync } from 'fs';
import { basename } from 'path';
import { ApiClient, ImportJobStatus } from '../lib/api-client.js';

export async function agentsImport(filePath: string, options: { conflict?: 'abort' | 'rename' | 'overwrite' }) {
    const client = new ApiClient();
    
    console.log(`Importing agent from ${filePath}...`);
    
    let fileStats;
    try {
        fileStats = statSync(filePath);
    } catch {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }
    
    if (!filePath.endsWith('.andromeda-agent')) {
        console.warn('Warning: File does not have .andromeda-agent extension');
    }
    
    const conflictPolicy = (options.conflict || 'abort').toUpperCase() as 'ABORT' | 'RENAME' | 'OVERWRITE';
    
    const file = new File([readFileSync(filePath)], basename(filePath));
    
    let job: ImportJobStatus;
    try {
        job = await client.importAgent(file, conflictPolicy);
    } catch (error: any) {
        console.error(`Failed to start import: ${error.message}`);
        process.exit(1);
    }
    
    console.log(`Import job started: ${job.jobId}`);
    console.log(`Status: ${job.status}`);
    
    if (job.status === 'CONFLICT_DETECTED') {
        console.log(`\n⚠ Conflict detected: Agent ${job.conflictAgentId} already exists.`);
        console.log('Resolution options:');
        console.log('  1. RENAME - Import with a new name');
        console.log('  2. OVERWRITE - Replace existing agent');
        console.log('  3. ABORT - Cancel import');
        process.exit(2);
    }
    
    while (job.status === 'PENDING' || job.status === 'VALIDATING' || job.status === 'IMPORTING') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        job = await client.getImportJobStatus(job.jobId);
        console.log(`Status: ${job.status}`);
    }
    
    if (job.status === 'COMPLETED') {
        console.log(`\n✓ Import completed successfully`);
        console.log(`Agent ID: ${job.importedAgentId}`);
    } else if (job.status === 'FAILED') {
        console.error(`\n✗ Import failed: ${job.errors?.join('; ')}`);
        process.exit(1);
    }
}