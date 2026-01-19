import { getProfiles } from "@/lib/api/profiles";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ProfileCard from "@/components/ProfileCard";

export default async function ProfilesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let profiles = [];
  let error = null;

  try {
    profiles = await getProfiles();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load profiles';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">App Profiles</h1>
          </div>
          <Link
            href="/dashboard/profiles/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition"
          >
            + New Profile
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            What are App Profiles?
          </h3>
          <p className="text-sm text-blue-700">
            Create different profiles for different apps to control tone, language, and formatting.
            For example: Professional for Gmail, Direct for Slack, Technical for Terminal.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && profiles.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No profiles yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first app profile to get started with VoChat.
            </p>
            <Link
              href="/dashboard/profiles/new"
              className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition"
            >
              Create Your First Profile
            </Link>
          </div>
        )}

        {/* Profiles Grid */}
        {!error && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
