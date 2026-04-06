import pino from 'pino';

const log = pino({ name: 'agents:resolve-system-prompt' });

type PromptRules = {
  must?: string[];
  mustNot?: string[];
  delegateWhen?: string[];
  reviewWhen?: string[];
  feedbackWhen?: string[];
  interruptWhen?: string[];
  evidenceWhen?: string[];
};

type PromptPlaybook = {
  start?: string[];
  execute?: string[];
  review?: string[];
  report?: string[];
};

type PromptContext = {
  stack?: string[];
  architecture?: string[];
  objectives?: string[];
  decisions?: string[];
  constraints?: string[];
  patterns?: string[];
};

export interface SystemPromptInputs {
  systemPrompt: string;
  agentIdentity?: string;
  mission?: string;
  scope?: string;
  soul?: string;
  voice?: string;
  responseStyle?: string;
  rules?: PromptRules;
  playbook?: PromptPlaybook;
  context?: PromptContext;
  operatingInstructions?: string[];
  doRules?: string[];
  dontRules?: string[];
}

const SECTION_SEPARATOR = '\n\n---\n\n';

function normalizeText(value?: string): string {
  if (!value) return '';
  return value.trim();
}

function normalizeList(values?: string[]): string[] {
  if (!values || values.length === 0) return [];
  return values.map((item) => item.trim()).filter((item) => item.length > 0);
}

function toNumberedList(values: string[]): string {
  return values.map((value, index) => `${index + 1}. ${value}`).join('\n');
}

function toBulletList(values: string[]): string {
  return values.map((value) => `- ${value}`).join('\n');
}

function buildSection(title: string, content: string): string {
  return `# ${title}\n${content}`;
}

export function resolveEffectiveSystemPrompt(inputs: SystemPromptInputs): string {
  const emittedSections: string[] = [];

  const baseInstructions = normalizeText(inputs.systemPrompt);
  if (baseInstructions) {
    emittedSections.push(buildSection('Base Instructions', baseInstructions));
  }

  const agentIdentity = normalizeText(inputs.agentIdentity);
  if (agentIdentity) {
    emittedSections.push(buildSection('Agent Identity', agentIdentity));
  }

  const mission = normalizeText(inputs.mission);
  if (mission) {
    emittedSections.push(buildSection('Mission', mission));
  }

  const scope = normalizeText(inputs.scope);
  if (scope) {
    emittedSections.push(buildSection('Scope', scope));
  }

  const soul = normalizeText(inputs.soul);
  if (soul) {
    emittedSections.push(buildSection('Soul', soul));
  }

  const voice = normalizeText(inputs.voice);
  if (voice) {
    emittedSections.push(buildSection('Voice', voice));
  }

  const responseStyle = normalizeText(inputs.responseStyle);
  if (responseStyle) {
    emittedSections.push(buildSection('Response Style', responseStyle));
  }

  const rulesMust = normalizeList(inputs.rules?.must).length > 0
    ? normalizeList(inputs.rules?.must)
    : normalizeList(inputs.doRules);
  if (rulesMust.length > 0) {
    emittedSections.push(buildSection('Rules Must', toBulletList(rulesMust)));
  }

  const rulesMustNot = normalizeList(inputs.rules?.mustNot).length > 0
    ? normalizeList(inputs.rules?.mustNot)
    : normalizeList(inputs.dontRules);
  if (rulesMustNot.length > 0) {
    emittedSections.push(buildSection('Rules Must Not', toBulletList(rulesMustNot)));
  }

  const rulesDelegateWhen = normalizeList(inputs.rules?.delegateWhen);
  if (rulesDelegateWhen.length > 0) {
    emittedSections.push(buildSection('Rules Delegate When', toBulletList(rulesDelegateWhen)));
  }

  const rulesReviewWhen = normalizeList(inputs.rules?.reviewWhen);
  if (rulesReviewWhen.length > 0) {
    emittedSections.push(buildSection('Rules Review When', toBulletList(rulesReviewWhen)));
  }

  const rulesFeedbackWhen = normalizeList(inputs.rules?.feedbackWhen);
  if (rulesFeedbackWhen.length > 0) {
    emittedSections.push(buildSection('Rules Feedback When', toBulletList(rulesFeedbackWhen)));
  }

  const rulesInterruptWhen = normalizeList(inputs.rules?.interruptWhen);
  if (rulesInterruptWhen.length > 0) {
    emittedSections.push(buildSection('Rules Interrupt When', toBulletList(rulesInterruptWhen)));
  }

  const rulesEvidenceWhen = normalizeList(inputs.rules?.evidenceWhen);
  if (rulesEvidenceWhen.length > 0) {
    emittedSections.push(buildSection('Rules Evidence When', toBulletList(rulesEvidenceWhen)));
  }

  const playbookStart = normalizeList(inputs.playbook?.start);
  const playbookExecute = normalizeList(inputs.playbook?.execute);
  const playbookReview = normalizeList(inputs.playbook?.review);
  const playbookReport = normalizeList(inputs.playbook?.report);
  const contextStack = normalizeList(inputs.context?.stack);
  const contextArchitecture = normalizeList(inputs.context?.architecture);
  const contextObjectives = normalizeList(inputs.context?.objectives);
  const contextDecisions = normalizeList(inputs.context?.decisions);
  const contextConstraints = normalizeList(inputs.context?.constraints);
  const contextPatterns = normalizeList(inputs.context?.patterns);
  const operatingInstructions = normalizeList(inputs.operatingInstructions);

  const playbookAndContextBlocks: string[] = [];

  if (playbookStart.length > 0) playbookAndContextBlocks.push(`## Playbook Start\n${toNumberedList(playbookStart)}`);
  if (playbookExecute.length > 0) playbookAndContextBlocks.push(`## Playbook Execute\n${toNumberedList(playbookExecute)}`);
  if (playbookReview.length > 0) playbookAndContextBlocks.push(`## Playbook Review\n${toNumberedList(playbookReview)}`);
  if (playbookReport.length > 0) playbookAndContextBlocks.push(`## Playbook Report\n${toNumberedList(playbookReport)}`);
  if (contextStack.length > 0) playbookAndContextBlocks.push(`## Context Stack\n${toBulletList(contextStack)}`);
  if (contextArchitecture.length > 0) playbookAndContextBlocks.push(`## Context Architecture\n${toBulletList(contextArchitecture)}`);
  if (contextObjectives.length > 0) playbookAndContextBlocks.push(`## Context Objectives\n${toBulletList(contextObjectives)}`);
  if (contextDecisions.length > 0) playbookAndContextBlocks.push(`## Context Decisions\n${toBulletList(contextDecisions)}`);
  if (contextConstraints.length > 0) playbookAndContextBlocks.push(`## Context Constraints\n${toBulletList(contextConstraints)}`);
  if (contextPatterns.length > 0) playbookAndContextBlocks.push(`## Context Patterns\n${toBulletList(contextPatterns)}`);
  if (operatingInstructions.length > 0) {
    playbookAndContextBlocks.push(`## Operating Instructions\n${toNumberedList(operatingInstructions)}`);
  }

  if (playbookAndContextBlocks.length > 0) {
    emittedSections.push(buildSection('Playbook e Contexto Operacional', playbookAndContextBlocks.join('\n\n')));
  }

  const result = emittedSections.join(SECTION_SEPARATOR);

  log.debug(
    {
      totalSectionsEmitted: emittedSections.length,
      finalPromptSize: result.length
    },
    'Resolved effective system prompt'
  );

  return result;
}
