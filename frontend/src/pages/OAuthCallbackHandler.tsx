function getFriendlyCallbackErrorMessage(params: URLSearchParams): string {
  const error = params.get('error')?.trim();
  const errorDescription = params.get('error_description')?.trim();

  if (errorDescription?.includes('missing_codex_entitlement')) {
    return 'OpenAI OAuth access is not enabled for your workspace yet. Ask your workspace administrator to enable OpenAI OAuth access and then restart sign-in.';
  }

  if (error) {
    return errorDescription
      ? `OpenAI OAuth authorization did not finish: ${errorDescription}`
      : `OpenAI OAuth authorization did not finish: ${error}`;
  }

  const code = params.get('code')?.trim();
  const state = params.get('state')?.trim();
  if (!code || !state) {
    return 'The OpenAI OAuth callback is incomplete. Copy the full callback URL only when both code and state are present.';
  }

  return '';
}

export function OAuthCallbackHandler() {
  const callbackUrl = window.location.href;
  const parsedUrl = new URL(callbackUrl);
  const params = parsedUrl.searchParams;
  const code = params.get('code')?.trim() ?? '';
  const state = params.get('state')?.trim() ?? '';
  const errorMessage = getFriendlyCallbackErrorMessage(params);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-mono text-cyan-100">
        <div className="w-full max-w-3xl rounded-2xl border border-red-500/40 bg-slate-900/85 p-6 shadow-[0_0_32px_rgba(239,68,68,0.15)]">
          <h1 className="text-2xl font-bold text-red-300">OpenAI OAuth authorization needs attention</h1>
          <p className="mt-3 text-sm text-red-200/90">{errorMessage}</p>
          <label className="mt-5 block text-xs uppercase tracking-wide text-red-200/80">
            Returned callback URL
            <textarea readOnly value={callbackUrl} className="mt-2 min-h-28 w-full rounded border border-red-500/30 bg-slate-950/90 p-3 text-red-100" />
          </label>
          <p className="mt-4 text-xs text-red-200/80">Return to the LLM Connection Console, start a new OpenAI OAuth session if needed, and paste the callback details there instead of this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 font-mono text-cyan-100">
      <div className="w-full max-w-3xl rounded-2xl border border-cyan-500/40 bg-slate-900/85 p-6 shadow-[0_0_32px_rgba(34,211,238,0.15)]">
        <h1 className="text-2xl font-bold text-cyan-200">OpenAI OAuth authorization received</h1>
        <p className="mt-3 text-sm text-cyan-100/85">Copy the full callback URL or copy the code and state below, then paste them back into the LLM Connection Console to finish sign-in.</p>

        <label className="mt-5 block text-xs uppercase tracking-wide text-cyan-300/80">
          Full callback URL
          <textarea readOnly value={callbackUrl} className="mt-2 min-h-28 w-full rounded border border-cyan-500/30 bg-slate-950/90 p-3 text-cyan-100" />
        </label>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-xs uppercase tracking-wide text-cyan-300/80">
            Authorization code
            <textarea readOnly value={code} className="mt-2 min-h-24 w-full rounded border border-cyan-500/30 bg-slate-950/90 p-3 text-cyan-100" />
          </label>
          <label className="block text-xs uppercase tracking-wide text-cyan-300/80">
            OAuth state
            <textarea readOnly value={state} className="mt-2 min-h-24 w-full rounded border border-cyan-500/30 bg-slate-950/90 p-3 text-cyan-100" />
          </label>
        </div>

        <p className="mt-4 text-xs text-cyan-200/75">This helper page does not complete authentication on its own and never sends tokens to the browser UI.</p>
      </div>
    </div>
  );
}
