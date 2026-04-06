export interface TelegramMessage {
    userId: number;
    text?: string;
    file?: any;
    raw: any;
}

export interface TaskRequest {
    input: string;
    userId: number;
    source: "telegram";
}