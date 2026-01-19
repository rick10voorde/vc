"use client";

import Link from "next/link";
import { AppProfile } from "@/lib/types/database";
import { deleteProfileAction, setDefaultProfileAction } from "@/app/dashboard/profiles/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileCardProps {
  profile: AppProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [settingDefault, setSettingDefault] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    setDeleting(true);
    try {
      await deleteProfileAction(profile.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete profile');
      setDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try {
      await setDefaultProfileAction(profile.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set default');
      setSettingDefault(false);
    }
  };

  const formatting = profile.formatting as any || {};

  return (
    <div className={`bg-white rounded-lg shadow p-6 relative ${
      profile.is_default ? 'ring-2 ring-indigo-500' : ''
    }`}>
      {/* Default Badge */}
      {profile.is_default && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
            Default
          </span>
        </div>
      )}

      {/* App Key */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {profile.app_key}
        </h3>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-20">Tone:</span>
          <span className="text-gray-900 font-medium capitalize">{profile.tone}</span>
        </div>
        <div className="flex items-center text-sm">
          <span className="text-gray-500 w-20">Language:</span>
          <span className="text-gray-900 font-medium uppercase">{profile.language}</span>
        </div>
        {formatting.bullets !== undefined && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-20">Bullets:</span>
            <span className="text-gray-900 font-medium">
              {formatting.bullets ? 'Yes' : 'No'}
            </span>
          </div>
        )}
        {formatting.max_length && (
          <div className="flex items-center text-sm">
            <span className="text-gray-500 w-20">Max length:</span>
            <span className="text-gray-900 font-medium">{formatting.max_length} chars</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/profiles/${profile.id}/edit`}
          className="flex-1 px-3 py-2 text-sm text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition"
        >
          Edit
        </Link>

        {!profile.is_default && (
          <button
            onClick={handleSetDefault}
            disabled={settingDefault}
            className="flex-1 px-3 py-2 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-md transition disabled:opacity-50"
          >
            {settingDefault ? 'Setting...' : 'Set Default'}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-md transition disabled:opacity-50"
        >
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
