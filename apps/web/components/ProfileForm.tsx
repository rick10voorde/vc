"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProfileAction, updateProfileAction } from "@/app/dashboard/profiles/actions";
import type { AppProfile } from "@/lib/types/database";
import { APP_KEYS, TONES, LANGUAGES } from "@/lib/types/database";

interface ProfileFormProps {
  mode: "create" | "edit";
  initialData?: AppProfile;
}

export default function ProfileForm({ mode, initialData }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [appKey, setAppKey] = useState(initialData?.app_key || "generic");
  const [tone, setTone] = useState(initialData?.tone || "professional");
  const [language, setLanguage] = useState(initialData?.language || "en");
  const [isDefault, setIsDefault] = useState(initialData?.is_default || false);

  // Formatting options
  const formatting = (initialData?.formatting as any) || {};
  const [bullets, setBullets] = useState(formatting.bullets !== undefined ? formatting.bullets : false);
  const [maxLength, setMaxLength] = useState(formatting.max_length || 1000);
  const [paragraphs, setParagraphs] = useState(formatting.paragraphs || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        app_key: appKey,
        tone,
        language,
        is_default: isDefault,
        formatting: {
          bullets,
          max_length: maxLength,
          paragraphs,
        },
      };

      if (mode === "create") {
        await createProfileAction(data);
      } else if (initialData) {
        await updateProfileAction(initialData.id, data);
      }

      router.push("/dashboard/profiles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/profiles"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Back to Profiles
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "create" ? "Create New Profile" : "Edit Profile"}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App Key */}
        <div>
          <label htmlFor="app-key" className="block text-sm font-medium text-gray-700 mb-1">
            App / Context
          </label>
          <select
            id="app-key"
            value={appKey}
            onChange={(e) => setAppKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={mode === "edit"} // Can't change app_key after creation (unique constraint)
          >
            {APP_KEYS.map((key) => (
              <option key={key} value={key} className="capitalize">
                {key}
              </option>
            ))}
          </select>
          {mode === "edit" && (
            <p className="mt-1 text-xs text-gray-500">
              App cannot be changed after creation
            </p>
          )}
        </div>

        {/* Tone */}
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {TONES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            How should the text sound?
          </p>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className="uppercase">
                {lang === "en" && "English"}
                {lang === "nl" && "Nederlands"}
                {lang === "es" && "Español"}
                {lang === "fr" && "Français"}
                {lang === "de" && "Deutsch"}
              </option>
            ))}
          </select>
        </div>

        {/* Formatting Options */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Formatting Options</h3>

          {/* Bullets */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="bullets"
              checked={bullets}
              onChange={(e) => setBullets(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="bullets" className="ml-2 block text-sm text-gray-700">
              Use bullet points
            </label>
          </div>

          {/* Paragraphs */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="paragraphs"
              checked={paragraphs}
              onChange={(e) => setParagraphs(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="paragraphs" className="ml-2 block text-sm text-gray-700">
              Split into paragraphs
            </label>
          </div>

          {/* Max Length */}
          <div>
            <label htmlFor="max-length" className="block text-sm font-medium text-gray-700 mb-1">
              Max Length: {maxLength} characters
            </label>
            <input
              type="range"
              id="max-length"
              min="100"
              max="5000"
              step="100"
              value={maxLength}
              onChange={(e) => setMaxLength(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100</span>
              <span>5000</span>
            </div>
          </div>
        </div>

        {/* Default */}
        <div className="border-t pt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="is-default" className="ml-2 block text-sm text-gray-700">
              Set as default profile
            </label>
          </div>
          <p className="mt-1 ml-6 text-xs text-gray-500">
            The default profile is used when no specific app is detected
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : mode === "create" ? "Create Profile" : "Save Changes"}
          </button>
          <Link
            href="/dashboard/profiles"
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 rounded-md shadow-sm transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
