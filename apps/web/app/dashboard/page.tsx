import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#18181b] border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#3b82f6]">vochat.io</h1>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-[#fafafa] mb-2">
            Welcome back!
          </h2>
          <p className="text-[#a1a1aa]">
            Logged in as: <span className="font-medium text-[#3b82f6]">{user.email}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="text-sm font-medium text-[#a1a1aa] mb-2">
              Weekly Usage
            </h3>
            <p className="text-3xl font-bold text-[#3b82f6]">0 / 2,000</p>
            <p className="text-sm text-[#71717a] mt-1">words (Free tier)</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-[#a1a1aa] mb-2">
              Active Profiles
            </h3>
            <p className="text-3xl font-bold text-[#3b82f6]">0</p>
            <p className="text-sm text-[#71717a] mt-1">app profiles</p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-[#a1a1aa] mb-2">
              Dictations
            </h3>
            <p className="text-3xl font-bold text-[#3b82f6]">0</p>
            <p className="text-sm text-[#71717a] mt-1">this week</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-[#fafafa] mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/profiles"
              className="p-4 bg-[#0f0f0f] border border-[#27272a] rounded-lg hover:border-[#3b82f6] transition text-left block"
            >
              <h4 className="font-medium text-[#fafafa] mb-1">
                📝 Manage App Profiles
              </h4>
              <p className="text-sm text-[#a1a1aa]">
                Configure tone and formatting for different apps
              </p>
            </Link>

            <button className="p-4 bg-[#0f0f0f] border border-[#27272a] rounded-lg hover:border-[#3b82f6] transition text-left">
              <h4 className="font-medium text-[#fafafa] mb-1">
                💎 Upgrade to Pro
              </h4>
              <p className="text-sm text-[#a1a1aa]">
                Unlimited usage and advanced features
              </p>
            </button>

            <button className="p-4 bg-[#0f0f0f] border border-[#27272a] rounded-lg hover:border-[#3b82f6] transition text-left">
              <h4 className="font-medium text-[#fafafa] mb-1">
                📖 My Dictionary
              </h4>
              <p className="text-sm text-[#a1a1aa]">
                Add custom terms and pronunciations
              </p>
            </button>

            <button className="p-4 bg-[#0f0f0f] border border-[#27272a] rounded-lg hover:border-[#3b82f6] transition text-left">
              <h4 className="font-medium text-[#fafafa] mb-1">
                🚀 Desktop App Active
              </h4>
              <p className="text-sm text-[#a1a1aa]">
                Use vochat.io everywhere with Alt+Z
              </p>
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 bg-[#18181b] border border-[#3b82f6]/30 rounded-lg p-4">
          <p className="text-sm text-[#3b82f6]">
            <strong>Ready to use!</strong> Desktop app is installed. Press Alt+Z anywhere to dictate.
          </p>
        </div>
      </main>
    </div>
  );
}
