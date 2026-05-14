/**
 * Sign-in / sign-up only: no app nav, branding chrome, or analytics content.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0d12] text-[var(--foreground)]">
      {children}
    </div>
  );
}
