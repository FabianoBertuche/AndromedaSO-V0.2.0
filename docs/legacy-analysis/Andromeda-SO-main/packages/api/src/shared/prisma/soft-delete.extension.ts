import { Prisma } from "@prisma/client";

export const softDeleteExtension = Prisma.defineExtension({
    name: 'softDelete',
    query: {
        $allModels: {
            async findMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...(args.where ?? {}), deletedAt: null };
                }
                return query(args);
            },
            async findFirst({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...(args.where ?? {}), deletedAt: null };
                }
                return query(args);
            },
            async findUnique({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...(args.where ?? {}), deletedAt: null };
                }
                return query(args);
            },
            async count({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    args.where = { ...(args.where ?? {}), deletedAt: null };
                }
                return query(args);
            },
            async delete({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    return (Prisma.getExtensionContext(this) as any).update({
                        ...args,
                        data: { deletedAt: new Date() },
                    });
                }
                return query(args);
            },
            async deleteMany({ model, args, query }: { model: string; args: any; query: (args: any) => Promise<any> }) {
                if (supportsSoftDelete(model)) {
                    return (Prisma.getExtensionContext(this) as any).updateMany({
                        ...args,
                        data: { deletedAt: new Date() },
                    });
                }
                return query(args);
            },
        },
    },
    model: {
        $allModels: {
            async restore<T, A>(
                this: T,
                args: Prisma.Exact<A, Prisma.Args<T, 'update'>>
            ): Promise<Prisma.Result<T, A, 'update'>> {
                const context = Prisma.getExtensionContext(this) as any;
                const updateArgs = args as Record<string, unknown>;
                return context.update({
                    ...updateArgs,
                    data: { deletedAt: null },
                });
            },
        },
    },
});

function supportsSoftDelete(model: string): boolean {
    const modelsWithSoftDelete = [
        'SandboxProfile',
        'AgentSandboxConfig',
        'SandboxExecution',
        'MemoryEntry',
        'MemoryPolicy',
        'KnowledgeCollection',
        'KnowledgeDocument',
        'KnowledgeChunk',
        'CommunicationSession',
        'CommunicationMessage',
        'User',
        'AgentBudgetPolicy',
        'AgentVersion',
        'TaskFeedback',
        'AgentPerformanceRecord',
        'PlaybookSuggestion',
        'AgentExecutionLedger'
    ];
    return modelsWithSoftDelete.includes(model);
}
