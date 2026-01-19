import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/api/profiles";
import ProfileForm from "@/components/ProfileForm";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let profile;
  try {
    profile = await getProfile(id);
  } catch (error) {
    redirect("/dashboard/profiles");
  }

  if (!profile) {
    redirect("/dashboard/profiles");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileForm mode="edit" initialData={profile} />
      </div>
    </div>
  );
}
