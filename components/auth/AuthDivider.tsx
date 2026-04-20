'use client';

export default function AuthDivider({ label = 'Or continue with email' }: { label?: string }) {
  return (
    <div className="auth-divider">
      <div className="auth-divider-line" />
      <span className="auth-divider-label">{label}</span>
      <div className="auth-divider-line" />
    </div>
  );
}
