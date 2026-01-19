import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          VoChat
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Voice to Text AI Companion
        </p>
        <p className="text-lg text-gray-700 mb-8">
          Speak naturally, get polished text instantly.<br />
          Works everywhere - terminal, native apps, browsers.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg transition"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg shadow-lg transition"
          >
            Sign In
          </Link>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-green-600 font-medium">✓ Phase 0: Monorepo Setup</p>
          <p className="text-sm text-green-600 font-medium">✓ Phase 1: Database Migrations Ready</p>
          <p className="text-sm text-green-600 font-medium">✓ Phase 2: Authentication</p>
          <p className="text-sm text-green-600 font-medium">✓ Phase 3: App Profiles CRUD</p>
          <p className="text-sm text-gray-400">Coming next: Stripe Billing, Desktop App, STT, AI</p>
        </div>
      </div>
    </div>
  );
}
