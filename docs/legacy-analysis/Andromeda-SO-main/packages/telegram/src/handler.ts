import axios from "axios";
import { parseMessage } from "./parser";
import { TelegramMessage } from "./types";

const API = process.env.ANDROMEDA_API;

export async function handleMessage(msg: TelegramMessage) {
    const task = parseMessage(msg);

    // cria task no Andromeda
    const res = await axios.post(`${API}/tasks`, {
        raw_request: task.input,
        user_id: task.userId,
        source: task.source,
    });

    const taskId = res.data.id;

    // executa task
    const execution = await axios.post(`${API}/tasks/${taskId}/execute`);

    return {
        taskId,
        result: execution.data.result,
    };
}