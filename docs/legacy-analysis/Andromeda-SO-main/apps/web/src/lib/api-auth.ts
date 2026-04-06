export const DEFAULT_WEB_TOKEN = 'andromeda_dev_web_token';

export function getApiToken(): string {
  return localStorage.getItem('andromeda_token') || DEFAULT_WEB_TOKEN;
}

export function resetApiToken(): string {
  localStorage.setItem('andromeda_token', DEFAULT_WEB_TOKEN);
  return DEFAULT_WEB_TOKEN;
}

export function withApiAuth(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${getApiToken()}`);
  }

  return {
    ...init,
    headers,
  };
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, withApiAuth(init));
  if (response.status !== 401 || getApiToken() === DEFAULT_WEB_TOKEN) {
    return response;
  }

  resetApiToken();
  return fetch(input, withApiAuth(init));
}
