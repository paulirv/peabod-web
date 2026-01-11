"use client";

import { useEffect, useState, useCallback } from "react";
import type { SiteSettings } from "@/app/admin/api/settings/route";

interface SettingsResponse {
  success: boolean;
  data?: SiteSettings;
  error?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/settings");
      const data = (await res.json()) as SettingsResponse;
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        setError(data.error || "Failed to load settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/admin/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = (await res.json()) as SettingsResponse;

      if (data.success && data.data) {
        setSettings(data.data);
        setSuccess("Settings saved successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SiteSettings>(
    field: K,
    value: SiteSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Failed to load settings"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Site Info */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site URL
              </label>
              <input
                type="url"
                value={settings.site_url || ""}
                onChange={(e) => updateField("site_url", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://www.example.com"
              />
              <p className="text-xs text-gray-500 mt-1">The public URL of your website</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={settings.site_name || ""}
                onChange={(e) => updateField("site_name", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="My Website"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Description
              </label>
              <textarea
                value={settings.site_description || ""}
                onChange={(e) => updateField("site_description", e.target.value || null)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="A brief description of your website"
              />
            </div>
          </div>
        </section>

        {/* SEO/Meta */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO & Meta</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Suffix
              </label>
              <input
                type="text"
                value={settings.meta_title_suffix || ""}
                onChange={(e) => updateField("meta_title_suffix", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder=" | My Website"
              />
              <p className="text-xs text-gray-500 mt-1">Appended to page titles (e.g., &quot;Page Title | My Website&quot;)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default OG Image ID
              </label>
              <input
                type="number"
                value={settings.default_og_image_id || ""}
                onChange={(e) => updateField("default_og_image_id", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="Media ID"
              />
              {settings.default_og_image_path && (
                <p className="text-xs text-gray-500 mt-1">Current: {settings.default_og_image_path}</p>
              )}
            </div>
          </div>
        </section>

        {/* Display */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Display</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo Media ID
              </label>
              <input
                type="number"
                value={settings.logo_media_id || ""}
                onChange={(e) => updateField("logo_media_id", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="Media ID"
              />
              {settings.logo_path && (
                <p className="text-xs text-gray-500 mt-1">Current: {settings.logo_path}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                value={settings.copyright_text || ""}
                onChange={(e) => updateField("copyright_text", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="© 2026 My Website. All rights reserved."
              />
            </div>
          </div>
        </section>

        {/* Content Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Posts Per Page
              </label>
              <input
                type="number"
                value={settings.posts_per_page || 10}
                onChange={(e) => updateField("posts_per_page", parseInt(e.target.value) || 10)}
                min={1}
                max={100}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contact_email || ""}
                onChange={(e) => updateField("contact_email", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter / X
              </label>
              <input
                type="text"
                value={settings.social_twitter || ""}
                onChange={(e) => updateField("social_twitter", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook
              </label>
              <input
                type="text"
                value={settings.social_facebook || ""}
                onChange={(e) => updateField("social_facebook", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://facebook.com/page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <input
                type="text"
                value={settings.social_instagram || ""}
                onChange={(e) => updateField("social_instagram", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="text"
                value={settings.social_linkedin || ""}
                onChange={(e) => updateField("social_linkedin", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube
              </label>
              <input
                type="text"
                value={settings.social_youtube || ""}
                onChange={(e) => updateField("social_youtube", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://youtube.com/@channel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub
              </label>
              <input
                type="text"
                value={settings.social_github || ""}
                onChange={(e) => updateField("social_github", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Substack
              </label>
              <input
                type="text"
                value={settings.social_substack || ""}
                onChange={(e) => updateField("social_substack", e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="https://username.substack.com"
              />
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
