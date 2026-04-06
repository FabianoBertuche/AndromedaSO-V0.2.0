import { Agent } from "@andromeda/core";

export interface LLMRequest {
    agent: Agent;
    userPrompt: string;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}

export class MockLLMProvider {
    /**
     * Simula uma chamada de LLM. 
     * No futuro, este arquivo será substituído ou estendido para OpenAI/Gemini.
     */
    async generate(request: LLMRequest): Promise<LLMResponse> {
        const { agent, userPrompt } = request;

        // Simulação de delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            content: `[Mock Resposta do Modelo ${agent.getModel()}] Respondendo como ${agent.getName()}: Com base no prompt "${userPrompt}", minha resposta é que tudo está funcionando perfeitamente no Andromeda OS.`,
            usage: {
                promptTokens: userPrompt.length / 4,
                completionTokens: 50
            }
        };
    }
}
