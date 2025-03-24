import React, { useEffect, useState } from "react";
import {
  defaultProviderSettings,
  SettingsStorage,
} from "../storage/providerSettings";
import { ProviderSettings } from "../types/settings";
import { Input } from "../components/Input";

export const ProviderSettingsTab = () => {
  const [loadedProviderSettings, setLoadedProviderSettings] =
    useState<ProviderSettings>(defaultProviderSettings);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

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
    setSaveStatus("idle");
    try {
      await SettingsStorage.saveProviderSettings(loadedProviderSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
    }
    setIsLoading(false);
  };

  if (isLoading && loadedProviderSettings === defaultProviderSettings) {
    return <div className="p-4 text-gray-200">Loading settings...</div>;
  }

  return (
    <div className="p-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="provider"
            className="block text-sm font-medium text-gray-200"
          >
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={selectedProviderIndex}
            onChange={handleProviderSelectChange}
            className="block w-full rounded-md border border-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1f1f1f]/50 text-gray-200"
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
              className="text-sm font-medium text-gray-200"
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
              className="text-sm font-medium text-gray-200"
            >
              Enable Tool Calls
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-200"
          >
            API Key
          </label>
          <Input
            type="password"
            id="apiKey"
            name="apiKey"
            value={
              loadedProviderSettings.all[selectedProviderIndex].apiKey || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter your API key"
            className="block w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-200"
          >
            Model
          </label>
          <Input
            type="text"
            id="model"
            name="model"
            value={
              loadedProviderSettings.all[selectedProviderIndex].model || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter model name"
            className="block w-full"
          />
        </div>

        {"url" in loadedProviderSettings.all[selectedProviderIndex] && (
          <div className="space-y-2">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-200"
            >
              URL
            </label>
            <Input
              type="text"
              id="url"
              name="url"
              value={
                loadedProviderSettings.all[selectedProviderIndex].url || ""
              }
              onChange={handleProviderFieldChange}
              placeholder="Enter URL"
              className="block w-full"
            />
          </div>
        )}

        <div className="flex items-center mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-200/80 text-gray-900 rounded-md hover:bg-gray-300/80 disabled:bg-gray-500/40 disabled:text-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
          {saveStatus === "success" && (
            <span className="ml-2 text-green-400 flex items-center">
              Settings saved!
            </span>
          )}
          {saveStatus === "error" && (
            <span className="ml-2 text-red-400 flex items-center">
              Failed to save settings
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
