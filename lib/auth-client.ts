export function clearLegacyCodeVerifierCookies() {
  if (typeof document === 'undefined') return;

  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.split('=');
    if (name.trim().includes('-code-verifier')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}
