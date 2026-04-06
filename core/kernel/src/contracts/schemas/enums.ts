import { z } from 'zod';

// Status do agente
export const agentStatusEnum = z.enum(['active', 'disabled']);
export type AgentStatus = z.infer<typeof agentStatusEnum>;

// Modo de herança de template
export const templateInheritanceModeEnum = z.enum(['strict', 'flexible', 'override']);
export type TemplateInheritanceMode = z.infer<typeof templateInheritanceModeEnum>;

// Política de lock de template
export const templateLockPolicyEnum = z.enum(['locked', 'unlocked', 'managed']);
export type TemplateLockPolicy = z.infer<typeof templateLockPolicyEnum>;

// Modo de interação
export const interactionModeEnum = z.enum(['autonomous', 'assisted', 'supervised', 'manual']);
export type InteractionMode = z.infer<typeof interactionModeEnum>;

// Formato de resposta
export const responseFormatEnum = z.enum(['text', 'json', 'markdown', 'xml']);
export type ResponseFormat = z.infer<typeof responseFormatEnum>;

// Modo de raciocínio
export const reasoningModeEnum = z.enum(['standard', 'chain-of-thought', 'reasoning']);
export type ReasoningMode = z.infer<typeof reasoningModeEnum>;

// Tipo de origem
export const originTypeEnum = z.enum(['template', 'clone', 'manual']);
export type OriginType = z.infer<typeof originTypeEnum>;

// Visibilidade
export const visibilityEnum = z.enum(['private', 'team', 'public']);
export type Visibility = z.infer<typeof visibilityEnum>;
