import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-bold text-[#3b82f6] mb-4 tracking-tight">
          vochat.io
        </h1>
        <p className="text-2xl text-[#e4e4e7] mb-8 font-medium">
          Voice to Text AI Companion
        </p>
        <p className="text-lg text-[#a1a1aa] mb-12">
          Speak naturally, get polished text instantly.<br />
          Works everywhere - terminal, native apps, browsers.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/auth/signup"
            className="btn-primary"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="btn-secondary"
          >
            Sign In
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-[#3b82f6] font-medium">✓ Authentication & Profiles</p>
          <p className="text-[#3b82f6] font-medium">✓ Desktop App (Alt+Z)</p>
          <p className="text-[#3b82f6] font-medium">✓ Speech-to-Text (Deepgram)</p>
          <p className="text-[#3b82f6] font-medium">✓ Tech Terms Auto-Correction</p>
          <p className="text-[#6b7280]">Coming next: Stripe Billing & Advanced Features</p>
        </div>
      </div>
    </div>
  );
}
