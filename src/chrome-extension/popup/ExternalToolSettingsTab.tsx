import { useState, useEffect } from "react";
import { ExternalToolSettings } from "../types/settings";
import {
  ExternalToolsStorage,
  defaultExternalToolSettings,
} from "../storage/externalToolSettings";
import { Input } from "../components/Input";

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
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        External Tool Settings
      </h2>

      <div className="mb-4">
        <h3 className="text-md font-medium mb-2 text-gray-200">Brave Search</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            API Key
          </label>
          <Input
            type="password"
            value={settings.braveSearch.apiKey}
            onChange={handleBraveSearchApiKeyChange}
            className="w-full"
            placeholder="Enter Brave Search API Key"
          />
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-gray-200/80 text-gray-900 rounded-md hover:bg-gray-300/80 disabled:bg-gray-500/40 disabled:text-gray-400"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        {saveStatus === "success" && (
          <span className="ml-2 text-green-400">Settings saved!</span>
        )}
        {saveStatus === "error" && (
          <span className="ml-2 text-red-400">Failed to save settings</span>
        )}
      </div>
    </div>
  );
};
