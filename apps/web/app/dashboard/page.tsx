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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">VoChat Dashboard</h1>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back!
          </h2>
          <p className="text-gray-600">
            Logged in as: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Weekly Usage
            </h3>
            <p className="text-3xl font-bold text-gray-900">0 / 2,000</p>
            <p className="text-sm text-gray-500 mt-1">words (Free tier)</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Active Profiles
            </h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">app profiles</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Dictations
            </h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">this week</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/profiles"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left block"
            >
              <h4 className="font-medium text-gray-900 mb-1">
                📝 Manage App Profiles
              </h4>
              <p className="text-sm text-gray-600">
                Configure tone and formatting for different apps
              </p>
            </Link>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
              <h4 className="font-medium text-gray-900 mb-1">
                💎 Upgrade to Pro
              </h4>
              <p className="text-sm text-gray-600">
                Unlimited usage and advanced features
              </p>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
              <h4 className="font-medium text-gray-900 mb-1">
                📖 My Dictionary
              </h4>
              <p className="text-sm text-gray-600">
                Add custom terms and pronunciations
              </p>
            </button>

            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-left">
              <h4 className="font-medium text-gray-900 mb-1">
                🚀 Download Desktop App
              </h4>
              <p className="text-sm text-gray-600">
                Use VoChat everywhere with Ctrl+Win
              </p>
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            <strong>Phase 3 Ready!</strong> You can now create app profiles. Click "Manage App Profiles" above to get started.
          </p>
        </div>
      </main>
    </div>
  );
}
