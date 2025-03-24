import { useState, useEffect, ChangeEvent } from "react";

import { ExtensionSettings } from "../types/extensionSettings";
import {
  getExtensionSettings,
  setExtensionSettings,
} from "../storage/extensionSettings";
import { tryCatch } from "../util/try-catch";

const ExtensionSettingsTab = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [allowedUrlsInput, setAllowedUrlsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    getExtensionSettings().then((storedSettings: ExtensionSettings) => {
      setSettings(storedSettings);
      setAllowedUrlsInput(
        storedSettings.whenSelectingText.hoveringTooltip.allowedUrls.join(", ")
      );
    });
  }, []);

  if (!settings) return <div className="p-4">Loading...</div>;

  const handleTooltipActiveChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...settings,
      whenSelectingText: {
        ...settings.whenSelectingText,
        hoveringTooltip: {
          ...settings.whenSelectingText.hoveringTooltip,
          active: e.target.checked,
        },
      },
    };
    setSettings(newSettings);
  };

  const handleFileTypesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAllowedUrlsInput(value);
    const allowedUrls = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    const newSettings = {
      ...settings,
      whenSelectingText: {
        ...settings.whenSelectingText,
        hoveringTooltip: {
          ...settings.whenSelectingText.hoveringTooltip,
          allowedUrls,
        },
      },
    };
    setSettings(newSettings);
  };

  const handleContextMenuActiveChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...settings,
      whenSelectingText: {
        ...settings.whenSelectingText,
        contextMenu: { active: e.target.checked },
      },
    };
    setSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setSaveStatus("idle");

    const result = await tryCatch(setExtensionSettings(settings));

    if (result.error) {
      console.error("Failed to save settings", result.error);
      setSaveStatus("error");
    } else {
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }

    setIsSaving(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Extension Settings</h2>
      <h3 className="text-md font-medium mb-2">When Selecting Text</h3>

      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Hovering Tooltip</h4>
        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={settings.whenSelectingText.hoveringTooltip.active}
            onChange={handleTooltipActiveChange}
            className="mr-2"
          />
          <span className="text-sm">Enable Hovering Tooltip</span>
        </label>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allowed urls (comma separated, supports wildcards with *):
            <input
              type="text"
              value={allowedUrlsInput}
              onChange={handleFileTypesChange}
              className="w-full p-2 border border-gray-300 rounded-md mt-1"
            />
          </label>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Right-click Context Menu</h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={settings.whenSelectingText.contextMenu.active}
            onChange={handleContextMenuActiveChange}
            className="mr-2"
          />
          <span className="text-sm">Enable Context Menu</span>
        </label>
      </div>

      <div className="mt-6">
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

export default ExtensionSettingsTab;
