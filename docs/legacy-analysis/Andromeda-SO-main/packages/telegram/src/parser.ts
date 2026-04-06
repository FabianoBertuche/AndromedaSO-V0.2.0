import { TelegramMessage, TaskRequest } from "./types";

export function parseMessage(msg: TelegramMessage): TaskRequest {
    return {
        input: msg.text || "",
        userId: msg.userId,
        source: "telegram",
    };
}