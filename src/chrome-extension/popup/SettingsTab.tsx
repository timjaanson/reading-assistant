import React, { useEffect, useState } from "react";
import { defaultSettings, SettingsStorage } from "../storage/settings";
import { UserSettings } from "../types/settings";

export const SettingsTab = () => {
  const [userLoadedSettings, setUserLoadedSettings] =
    useState<UserSettings>(defaultSettings);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserSettings = async () => {
      const settings = await SettingsStorage.loadSettings();
      setUserLoadedSettings(settings);
      setSelectedProviderIndex(
        settings.activeProviderSettings
          ? settings.settings.findIndex(
              (s) => s.provider === settings.activeProviderSettings!.provider
            )
          : 0
      );
    };
    loadUserSettings();
  }, []);

  const handleProviderSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedProviderIndex(Number(e.target.value));
  };

  const handleProviderFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setUserLoadedSettings((prev) => {
      const newSettingsArray = [...prev.settings];
      const updatedProvider = {
        ...newSettingsArray[selectedProviderIndex],
        [name]: value,
      };
      newSettingsArray[selectedProviderIndex] = updatedProvider;
      const isActive =
        prev.activeProviderSettings?.provider === updatedProvider.provider;
      return {
        ...prev,
        settings: newSettingsArray,
        activeProviderSettings: isActive
          ? updatedProvider
          : prev.activeProviderSettings,
      };
    });
  };

  const handleActiveProviderChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setUserLoadedSettings((prev) => ({
      ...prev,
      activeProviderSettings: checked
        ? prev.settings[selectedProviderIndex]
        : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await SettingsStorage.saveSettings(userLoadedSettings);
      setError(null);
    } catch (err) {
      setError("Failed to save settings");
    }
    setIsLoading(false);
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
            value={selectedProviderIndex}
            onChange={handleProviderSelectChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {userLoadedSettings.settings.map((setting, index) => (
              <option key={setting.provider} value={index}>
                {setting.provider}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="activeProvider"
            type="checkbox"
            checked={
              userLoadedSettings.activeProviderSettings?.provider ===
              userLoadedSettings.settings[selectedProviderIndex].provider
            }
            onChange={handleActiveProviderChange}
            className="mr-2"
          />
          <label
            htmlFor="activeProvider"
            className="text-sm font-medium text-gray-700"
          >
            Active Provider
          </label>
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
            value={
              userLoadedSettings.settings[selectedProviderIndex].apiKey || ""
            }
            onChange={handleProviderFieldChange}
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
            value={
              userLoadedSettings.settings[selectedProviderIndex].model || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter model name (e.g. gpt-4o-mini)"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {"url" in userLoadedSettings.settings[selectedProviderIndex] && (
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700"
            >
              URL
            </label>
            <input
              type="text"
              id="url"
              name="url"
              value={
                userLoadedSettings.settings[selectedProviderIndex].url || ""
              }
              onChange={handleProviderFieldChange}
              placeholder="Enter URL"
              className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

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
