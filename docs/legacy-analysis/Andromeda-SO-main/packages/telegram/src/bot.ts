import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { handleMessage } from "./handler";
import { formatResponse } from "./responder";

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
    ctx.reply("🚀 Andromeda OS conectado.");
});

bot.on("text", async (ctx) => {
    try {
        const result = await handleMessage({
            userId: ctx.from.id,
            text: ctx.message.text,
            raw: ctx.message,
        });

        ctx.reply(formatResponse(result));
    } catch (err) {
        console.error(err);
        ctx.reply("❌ erro ao processar task");
    }
});

export function startBot() {
    bot.launch();
    console.log("🤖 Telegram bot running...");
}