import { useState, useEffect, ChangeEvent } from "react";

import { ExtensionSettings } from "../types/extensionSettings";
import {
  getExtensionSettings,
  setExtensionSettings,
} from "../storage/extensionSettings";

const ExtensionSettingsTab = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [allowedUrlsInput, setAllowedUrlsInput] = useState("");

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
    setExtensionSettings(newSettings);
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
    setExtensionSettings(newSettings);
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
    setExtensionSettings(newSettings);
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
    </div>
  );
};

export default ExtensionSettingsTab;
