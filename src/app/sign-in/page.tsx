import { Suspense } from "react";
import { SignInForm } from "@/features/auth";
import { Girih } from "@/components/ui/girih";

export const metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-sand px-6 py-16">
      <Girih id="girih-signin" opacity={0.16} color="var(--gold-strong)" />
      <div className="relative w-full max-w-sm">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
