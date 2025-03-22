import { useState, useEffect } from "react";
import { ExternalToolSettings } from "../types/settings";
import {
  ExternalToolsStorage,
  defaultExternalToolSettings,
} from "../storage/externalToolSettings";

export const ExternalToolSettingsTab = () => {
  const [settings, setSettings] = useState<ExternalToolSettings>(
    defaultExternalToolSettings
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings =
          await ExternalToolsStorage.loadExternalToolSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error("Failed to load external tool settings", error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await ExternalToolsStorage.saveExternalToolSettings(settings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save external tool settings", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBraveSearchApiKeyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      braveSearch: {
        ...settings.braveSearch,
        apiKey: e.target.value,
      },
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">External Tool Settings</h2>

      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Brave Search</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={settings.braveSearch.apiKey}
            onChange={handleBraveSearchApiKeyChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter Brave Search API Key"
          />
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        {saveStatus === "success" && (
          <span className="ml-2 text-green-600">Settings saved!</span>
        )}
        {saveStatus === "error" && (
          <span className="ml-2 text-red-600">Failed to save settings</span>
        )}
      </div>
    </div>
  );
};
