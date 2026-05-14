import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <p className="mb-4 hidden text-center text-sm text-zinc-400 lg:block">Welcome back</p>
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
        forceRedirectUrl="/analytics"
      />
    </div>
  );
}
