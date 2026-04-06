import { ApiClient } from '../lib/api-client.js';

export async function i18nLocales() {
    const client = new ApiClient();
    
    console.log('Listing available locales...\n');
    
    let locales;
    try {
        locales = await client.listLocales();
    } catch (error: any) {
        console.error(`Failed to list locales: ${error.message}`);
        process.exit(1);
    }
    
    if (locales.length === 0) {
        console.log('No locales found.');
        return;
    }
    
    console.log('Available locales:');
    console.log('─'.repeat(40));
    
    for (const locale of locales) {
        console.log(`  ${locale.code.padEnd(10)} ${locale.name}`);
    }
    
    console.log('─'.repeat(40));
    console.log(`Total: ${locales.length} locale(s)`);
}