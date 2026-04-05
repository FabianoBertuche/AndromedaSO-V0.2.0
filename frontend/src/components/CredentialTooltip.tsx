interface CredentialTooltipProps {
  url: string;
}

export function CredentialTooltip({ url }: CredentialTooltipProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title="Obter credenciais"
      className="ml-1 inline-flex items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/60 px-1.5 py-0.5 font-mono text-xs text-cyan-400 hover:border-cyan-400 hover:text-cyan-200"
    >
      ?
    </a>
  );
}
