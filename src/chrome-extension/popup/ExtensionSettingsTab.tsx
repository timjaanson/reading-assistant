import { useState, useEffect, ChangeEvent } from "react";
import { Tooltip } from "../components/Tooltip";

import { ExtensionSettings } from "../types/extensionSettings";
import {
  getExtensionSettings,
  setExtensionSettings,
} from "../storage/extensionSettings";
import { tryCatch } from "../util/try-catch";
import { Input } from "@/components/ui/input";
import { CodeBlock } from "../components/CodeBlock";
import { ThemeToggle } from "../components/ThemeToggle";
import { useTheme } from "../theme/theme-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ExtensionSettingsTab = () => {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [allowedUrlsInput, setAllowedUrlsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const { theme } = useTheme();

  useEffect(() => {
    getExtensionSettings().then((storedSettings: ExtensionSettings) => {
      setSettings(storedSettings);
      setAllowedUrlsInput(
        storedSettings.whenSelectingText.hoveringTooltip.allowedUrls.join(", ")
      );
    });
  }, []);

  if (!settings) return <div className="p-4">Loading...</div>;

  const handleTooltipActiveChange = (checked: boolean) => {
    const newSettings = {
      ...settings,
      whenSelectingText: {
        ...settings.whenSelectingText,
        hoveringTooltip: {
          ...settings.whenSelectingText.hoveringTooltip,
          active: checked,
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

  const handleContextMenuActiveChange = (checked: boolean) => {
    const newSettings = {
      ...settings,
      whenSelectingText: {
        ...settings.whenSelectingText,
        contextMenu: {
          ...settings.whenSelectingText.contextMenu,
          active: checked,
        },
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
    <div className="p-4 overflow-x-hidden">
      <h2 className="text-lg font-semibold mb-4">Extension Settings</h2>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current theme: {theme}</span>
              <ThemeToggle />
            </div>
            <div className="text-xs mt-1">
              Light theme applies in bright environments, Dark theme is designed
              for low-light settings, and System follows your device preference.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>When Selecting Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Hovering Tooltip</h4>
            <div className="flex items-center space-x-2 mb-2">
              <Switch
                id="hover-tooltip"
                checked={settings.whenSelectingText.hoveringTooltip.active}
                onCheckedChange={handleTooltipActiveChange}
              />
              <Label htmlFor="hover-tooltip">Enable Hovering Tooltip</Label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Allowed urls (comma separated, supports wildcards with *):
                <Tooltip>
                  <p className="mb-1">
                    Comma separated values that determine where the tooltip is
                    shown.
                  </p>
                  <p className="mb-1">
                    Supports wildcards with * for matching multiple URLs.
                  </p>
                  <p className="mb-1">
                    The value "PDF" is a special case which allows tooltip when
                    viewing PDFs.
                  </p>
                  <p className="mb-1">
                    Example: <CodeBlock>PDF, *wikipedia.org/*</CodeBlock>
                  </p>
                </Tooltip>
                <Input
                  type="text"
                  value={allowedUrlsInput}
                  onChange={handleFileTypesChange}
                  className="w-full mt-1"
                />
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              Right-click Context Menu
            </h4>
            <div className="flex items-center space-x-2">
              <Switch
                id="context-menu"
                checked={settings.whenSelectingText.contextMenu.active}
                onCheckedChange={handleContextMenuActiveChange}
              />
              <Label htmlFor="context-menu">Enable Context Menu</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-center">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-4 py-2 rounded-md"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        {saveStatus === "success" && (
          <span className="ml-2 text-green-500">Settings saved!</span>
        )}
        {saveStatus === "error" && (
          <span className="ml-2 text-destructive">Failed to save settings</span>
        )}
      </div>
    </div>
  );
};

export default ExtensionSettingsTab;
