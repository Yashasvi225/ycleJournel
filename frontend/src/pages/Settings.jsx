import { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  Sun,
  Moon,
  Monitor,
  Save,
  CheckCircle2,
} from "lucide-react";

import { getSettings, updateSettings } from "../api";

export default function Settings() {
  const [settings, setSettings] = useState({
    reminder_enabled: false,
    preferred_reminder_time: "09:00",
    theme: "light",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  function applyTheme(theme) {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (theme === "light") {
      root.classList.remove("dark");
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    root.classList.toggle("dark", prefersDark);
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const data = await getSettings();

      const loaded = {
        reminder_enabled: Boolean(data.reminder_enabled),
        preferred_reminder_time:
          data.preferred_reminder_time || "09:00",
        theme: data.theme || "light",
      };

      setSettings(loaded);
      applyTheme(loaded.theme);
    } catch (err) {
      setError(err.message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }

  function selectTheme(theme) {
    setSettings((current) => ({
      ...current,
      theme,
    }));

    // Preview immediately.
    applyTheme(theme);

    setMessage("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateSettings(settings);

      applyTheme(settings.theme);

      setMessage("Your preferences have been saved.");
    } catch (err) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section aria-busy="true">
        <p className="eyebrow">CycleJournal</p>
        <h1 className="mt-2 text-4xl font-black">
          Settings
        </h1>

        <div className="card mt-8 max-w-3xl">
          Loading your preferences...
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl">
      <p className="eyebrow">CycleJournal</p>

      <h1 className="mt-2 text-4xl font-black md:text-5xl">
        Settings
      </h1>

      <p className="muted-text mt-3 max-w-2xl">
        Personalize your CycleJournal experience and manage
        your reminder preferences.
      </p>

      {message && (
        <div
          className="success-message"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {message}
          </div>
        </div>
      )}

      {error && (
        <div
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* APPEARANCE */}

      <div className="settings-card mt-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
            <Sun size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Appearance
            </h2>

            <p className="muted-text mt-1">
              Choose how CycleJournal looks on this device.
            </p>
          </div>
        </div>

        <div
          className="theme-options"
          role="radiogroup"
          aria-label="Theme preference"
        >
          <button
            type="button"
            role="radio"
            aria-checked={settings.theme === "light"}
            className={`theme-option ${
              settings.theme === "light" ? "active" : ""
            }`}
            onClick={() => selectTheme("light")}
          >
            <Sun size={22} />

            <strong className="mt-3 block">
              Light
            </strong>

            <span className="muted-text mt-1 block text-sm">
              Bright and clean
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={settings.theme === "dark"}
            className={`theme-option ${
              settings.theme === "dark" ? "active" : ""
            }`}
            onClick={() => selectTheme("dark")}
          >
            <Moon size={22} />

            <strong className="mt-3 block">
              Dark
            </strong>

            <span className="muted-text mt-1 block text-sm">
              Comfortable in low light
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={settings.theme === "system"}
            className={`theme-option ${
              settings.theme === "system" ? "active" : ""
            }`}
            onClick={() => selectTheme("system")}
          >
            <Monitor size={22} />

            <strong className="mt-3 block">
              System
            </strong>

            <span className="muted-text mt-1 block text-sm">
              Follow your device
            </span>
          </button>
        </div>
      </div>

      {/* REMINDERS */}

      <div className="settings-card mt-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <Bell size={24} />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">
              Reminder preference
            </h2>

            <p className="muted-text mt-1">
              Store whether you would like reminders and your
              preferred reminder time.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-5 rounded-2xl border p-4">
          <div>
            <label
              htmlFor="reminders"
              className="font-bold"
            >
              Enable reminder preference
            </label>

            <p className="muted-text mt-1 text-sm">
              This saves your preference. Notification delivery
              is not currently implemented.
            </p>
          </div>

          <input
            id="reminders"
            type="checkbox"
            checked={settings.reminder_enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                reminder_enabled: e.target.checked,
              })
            }
            className="h-5 w-5"
          />
        </div>

        <div className="mt-6">
          <label
            htmlFor="reminder-time"
            className="flex items-center gap-2 font-bold"
          >
            <Clock size={18} />
            Preferred reminder time
          </label>

          <input
            id="reminder-time"
            type="time"
            className="form-control mt-3 max-w-xs"
            value={settings.preferred_reminder_time}
            disabled={!settings.reminder_enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                preferred_reminder_time: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* SAVE */}

      <div className="mt-7 flex justify-end">
        <button
          type="button"
          className="primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />

          {saving ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </section>
  );
}