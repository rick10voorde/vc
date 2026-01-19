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
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="bg-[#18181b] border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-[#a1a1aa] hover:text-[#3b82f6] mb-1 inline-block transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-[#3b82f6]">App Profiles</h1>
          </div>
          <Link
            href="/dashboard/profiles/new"
            className="btn-primary text-sm"
          >
            + New Profile
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-[#18181b] border border-[#3b82f6]/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-[#fafafa] mb-1">
            What are App Profiles?
          </h3>
          <p className="text-sm text-[#a1a1aa]">
            Create different profiles for different apps to control tone, language, and formatting.
            For example: Professional for Gmail, Direct for Slack, Technical for Terminal.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!error && profiles.length === 0 && (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-medium text-[#fafafa] mb-2">
              No profiles yet
            </h3>
            <p className="text-[#a1a1aa] mb-6">
              Create your first app profile to get started with vochat.io.
            </p>
            <Link
              href="/dashboard/profiles/new"
              className="btn-primary inline-block"
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
