import { PrismaCommunicationSessionRepository } from "./prisma-communication-session.repository";
import { PrismaCommunicationMessageRepository } from "./prisma-communication-message.repository";

export const globalSessionRepository = new PrismaCommunicationSessionRepository();
export const globalMessageRepository = new PrismaCommunicationMessageRepository();

