import { ApiClient } from '../lib/api-client.js';

export async function i18nSeed(options: { locale?: string; category?: string }) {
    const client = new ApiClient();
    
    const locale = options.locale || 'pt-BR';
    const category = options.category;
    
    console.log(`Seeding i18n messages for locale ${locale}...\n`);
    
    let messages;
    try {
        messages = await client.getMessages(locale, category);
    } catch (error: any) {
        console.error(`Failed to get messages: ${error.message}`);
        process.exit(1);
    }
    
    if (messages.length === 0) {
        console.log('No messages found for this locale/category.');
        return;
    }
    
    console.log('Messages:');
    console.log('─'.repeat(60));
    
    for (const msg of messages) {
        console.log(`  ${msg.key}`);
        console.log(`    ${msg.value}`);
        console.log('');
    }
    
    console.log('─'.repeat(60));
    console.log(`Total: ${messages.length} message(s)`);
}