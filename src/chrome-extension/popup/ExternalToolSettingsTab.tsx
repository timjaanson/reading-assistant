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
  const [selectedToolIndex, setSelectedToolIndex] = useState<number>(0);
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
        setSelectedToolIndex(
          loadedSettings.search.active
            ? loadedSettings.search.options.findIndex(
                (tool) => tool.id === loadedSettings.search.active!.id
              )
            : 0
        );
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

  const handleToolSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToolIndex(Number(e.target.value));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prev) => {
      const newOptions = [...prev.search.options];
      newOptions[selectedToolIndex] = {
        ...newOptions[selectedToolIndex],
        apiKey: value,
      };

      return {
        ...prev,
        search: {
          ...prev.search,
          options: newOptions,
        },
      };
    });
  };

  const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;

    setSettings((prev) => {
      // If unchecking, set active to null
      if (!checked) {
        return {
          ...prev,
          search: {
            ...prev.search,
            active: null,
          },
        };
      }

      // If checking, set currently selected tool as active
      return {
        ...prev,
        search: {
          ...prev.search,
          active: prev.search.options[selectedToolIndex],
        },
      };
    });
  };

  // Get the currently selected tool
  const selectedTool = settings.search.options[selectedToolIndex] || null;

  // Check if the selected tool is active
  const isSelectedToolActive = settings.search.active?.id === selectedTool?.id;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-200">
        External Tool Settings
      </h2>

      <div className="mb-4">
        <h3 className="text-md font-medium mb-2 text-gray-200">Search Tools</h3>

        <div className="space-y-2 mb-3">
          <label
            htmlFor="searchTool"
            className="block text-sm font-medium text-gray-200"
          >
            Select Search Tool
          </label>
          <select
            id="searchTool"
            value={selectedToolIndex}
            onChange={handleToolSelectChange}
            className="block w-full rounded-md border border-gray-700 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[#1f1f1f]/50 text-gray-200"
          >
            {settings.search.options.map((tool, index) => (
              <option key={tool.id} value={index}>
                {tool.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-x-2 mb-3">
          <div className="flex">
            <input
              id="activeTool"
              type="checkbox"
              checked={isSelectedToolActive}
              onChange={handleActiveChange}
              className="mr-2"
            />
            <label
              htmlFor="activeTool"
              className="text-sm font-medium text-gray-200"
            >
              Active Tool
            </label>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-200 mb-1">
            API Key
          </label>
          <Input
            type="password"
            value={selectedTool?.apiKey || ""}
            onChange={handleApiKeyChange}
            className="w-full"
            placeholder={`Enter ${selectedTool?.name} API Key`}
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
