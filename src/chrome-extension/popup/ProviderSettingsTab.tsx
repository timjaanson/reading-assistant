import React, { useEffect, useState } from "react";
import {
  defaultProviderSettings,
  SettingsStorage,
} from "../storage/providerSettings";
import { ProviderSettings } from "../types/settings";

export const ProviderSettingsTab = () => {
  const [loadedProviderSettings, setLoadedProviderSettings] =
    useState<ProviderSettings>(defaultProviderSettings);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserSettings = async () => {
      const settings = await SettingsStorage.loadProviderSettings();
      setLoadedProviderSettings(settings);
      setSelectedProviderIndex(
        settings.active
          ? settings.all.findIndex(
              (s) => s.provider === settings.active!.provider
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
    setLoadedProviderSettings((prev) => {
      const newSettingsArray = [...prev.all];
      const updatedProvider = {
        ...newSettingsArray[selectedProviderIndex],
        [name]: value,
      };
      newSettingsArray[selectedProviderIndex] = updatedProvider;

      const isActive = prev.active?.provider === updatedProvider.provider;
      return {
        ...prev,
        all: newSettingsArray,
        active: isActive ? updatedProvider : prev.active,
      };
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLoadedProviderSettings((prev) => {
      const newSettingsArray = [...prev.all];
      const updatedProvider = {
        ...newSettingsArray[selectedProviderIndex],
        [name]: checked,
      };
      newSettingsArray[selectedProviderIndex] = updatedProvider;

      const isActive = prev.active?.provider === updatedProvider.provider;
      return {
        ...prev,
        all: newSettingsArray,
        active: isActive ? updatedProvider : prev.active,
      };
    });
  };

  const handleActiveProviderChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setLoadedProviderSettings((prev) => ({
      ...prev,
      active: checked ? prev.all[selectedProviderIndex] : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await SettingsStorage.saveProviderSettings(loadedProviderSettings);
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
            {loadedProviderSettings.all.map((setting, index) => (
              <option key={setting.provider} value={index}>
                {setting.provider}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="flex">
            <input
              id="activeProvider"
              type="checkbox"
              checked={
                loadedProviderSettings.active?.provider ===
                loadedProviderSettings.all[selectedProviderIndex].provider
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
          <div className="flex">
            <input
              id="enableToolCalls"
              name="enableToolCalls"
              type="checkbox"
              checked={
                loadedProviderSettings.all[selectedProviderIndex]
                  .enableToolCalls
              }
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label
              htmlFor="enableToolCalls"
              className="text-sm font-medium text-gray-700"
            >
              Enable Tool Calls
            </label>
          </div>
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
              loadedProviderSettings.all[selectedProviderIndex].apiKey || ""
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
              loadedProviderSettings.all[selectedProviderIndex].model || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter model name (e.g. gpt-4o-mini)"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {"url" in loadedProviderSettings.all[selectedProviderIndex] && (
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
                loadedProviderSettings.all[selectedProviderIndex].url || ""
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
