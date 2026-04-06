import { MessageRepository } from "../domain/types";
import { seedPtBrMessages } from "./pt-BR.seed";
import { seedEnUsMessages } from "./en-US.seed";

export async function runSeeds(messageRepo: MessageRepository): Promise<void> {
    console.log("Seeding i18n messages...");

    const ptBrCount = await seedPtBrMessages(messageRepo);
    console.log(`Seeded ${ptBrCount} pt-BR messages`);

    const enUsCount = await seedEnUsMessages(messageRepo);
    console.log(`Seeded ${enUsCount} en-US messages`);

    console.log("i18n seeding complete.");
}

export { seedPtBrMessages, seedEnUsMessages };