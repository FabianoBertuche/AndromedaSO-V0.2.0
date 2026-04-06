import vm from "node:vm";

export interface SkillExecutionContext {
    input: Record<string, any>;
    metadata?: Record<string, any>;
}

export class ScriptSkillRuntime {
    /**
     * Executa um código Javascript em um sandbox isolado.
     * Para o MVP, usamos o módulo 'vm' nativo do Node.js.
     */
    async run(code: string, context: SkillExecutionContext): Promise<any> {
        const sandbox = {
            input: context.input,
            console: console, // Opcional: permitir logs para debug no MVP
            result: null,
        };

        vm.createContext(sandbox);

        const script = new vm.Script(`
      (async () => {
        ${code}
      })().then(res => { result = res; });
    `);

        // Nota: Em produção, usaríamos um timeout e limites de memória mais rigorosos.
        script.runInContext(sandbox, { timeout: 5000 });

        // Aguarda o resultado assíncrono (hack simples para o sandbox do vm)
        // No MVP, assumimos que o script preenche a variável 'result' ou retorna um valor.
        // Para simplificar, vamos ajustar o padrão do script esperado: 
        // "result = (seu código aqui)" ou apenas o código se for síncrono.

        return sandbox.result;
    }
}
