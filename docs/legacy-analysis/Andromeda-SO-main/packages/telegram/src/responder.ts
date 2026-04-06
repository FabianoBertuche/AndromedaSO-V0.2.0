export function formatResponse(data: any) {
    return `
🧠 Andromeda OS

Task: ${data.taskId}

Resultado:
${data.result}
`;
}