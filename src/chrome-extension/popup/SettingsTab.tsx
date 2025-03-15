import React, { useState, useEffect } from "react";
import { SettingsStorage } from "../storage/settings";
import { UserSettings, defaultSettings } from "../types/settings";

export const SettingsTab = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedSettings = await SettingsStorage.loadSettings();
      setSettings(savedSettings);
      setError(null);
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "provider") {
      setSettings((prev) => ({
        ...prev,
        provider: value,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [name]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SettingsStorage.saveSettings(settings);
      setError(null);
    } catch (err) {
      setError("Failed to save settings");
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="provider"
            className="block text-sm font-medium text-gray-700"
          >
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={settings.provider}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700"
          >
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={settings.settings.apiKey}
            onChange={handleChange}
            placeholder="Enter your API key"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-700"
          >
            Model
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={settings.settings.model}
            onChange={handleChange}
            placeholder="Enter model name (e.g. gpt-4o-mini)"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
