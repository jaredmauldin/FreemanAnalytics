import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center px-4 py-12">
      <SignIn
        appearance={{
          variables: { colorPrimary: "#3b82f6", colorBackground: "#141a22", colorInputBackground: "#0c0f14" },
          elements: {
            card: "border border-[#243041] shadow-xl",
            headerTitle: "text-[var(--foreground)]",
            headerSubtitle: "text-[var(--muted)]",
            socialButtonsBlockButton: "border-[#243041]",
            formButtonPrimary: "bg-[#3b82f6] hover:bg-blue-600",
          },
        }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
      />
    </div>
  );
}
