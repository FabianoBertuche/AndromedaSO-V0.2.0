import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProvider } from '../api/kernel';

export function OAuthCallbackHandler() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        setError('Autorização cancelada ou código ausente.');
        return;
      }

      const verifier = sessionStorage.getItem('oauth_code_verifier');
      if (!verifier) {
        setError('Sessão OAuth expirada. Tente novamente.');
        return;
      }

      try {
        const tokenRes = await fetch('https://auth.openai.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: 'http://localhost:5173/oauth/callback',
            client_id: import.meta.env.VITE_OPENAI_OAUTH_CLIENT_ID as string,
            code_verifier: verifier
          })
        });

        if (!tokenRes.ok) {
          const body = await tokenRes.json() as { error_description?: string };
          setError(body.error_description ?? 'Falha ao obter token OAuth.');
          return;
        }

        const { access_token } = await tokenRes.json() as { access_token: string };
        sessionStorage.removeItem('oauth_code_verifier');

        await createProvider({ type: 'openai', name: 'openai', apiKey: access_token });
        navigate('/providers');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido no fluxo OAuth.');
      }
    };

    void run();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-mono text-red-400">
        <p>Erro OAuth: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 font-mono text-cyan-300">
      <p>Processando autenticação OpenAI...</p>
    </div>
  );
}
