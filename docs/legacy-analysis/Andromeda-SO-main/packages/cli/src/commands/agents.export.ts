import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import archiver from 'archiver';
import { ApiClient, AgentProfile } from '../lib/api-client.js';

export async function agentsExport(agentId: string, options: { output?: string; includeKnowledge?: boolean; includeVersions?: boolean }) {
    const client = new ApiClient();
    
    console.log(`Exporting agent ${agentId}...`);
    
    let agent: AgentProfile;
    try {
        agent = await client.getAgent(agentId);
    } catch (error: any) {
        console.error(`Failed to get agent: ${error.message}`);
        process.exit(1);
    }
    
    console.log(`Agent found: ${agent.name} (${agent.role})`);
    
    let result;
    try {
        result = await client.exportAgent(agentId, {
            includesKnowledge: options.includeKnowledge,
            includesVersions: options.includeVersions !== false,
        });
    } catch (error: any) {
        console.error(`Failed to export agent: ${error.message}`);
        process.exit(1);
    }
    
    console.log(`Export created: ${result.bundleId}`);
    console.log(`Checksum: ${result.checksum}`);
    
    let buffer: ArrayBuffer;
    try {
        buffer = await client.downloadBundle(agentId, result.bundleId);
    } catch (error: any) {
        console.error(`Failed to download bundle: ${error.message}`);
        process.exit(1);
    }
    
    const outputPath = options.output || `${agentId}.andromeda-agent`;
    writeFileSync(outputPath, Buffer.from(buffer));
    
    console.log(`✓ Bundle saved to ${outputPath}`);
}