import { useEffect, useState } from "react";
import {
  defaultProviderSettings,
  SettingsStorage,
} from "../storage/providerSettings";
import { ProviderSettings } from "../types/settings";
import { Input } from "@/components/ui/input";
import { Tooltip } from "../components/Tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ProviderSettingsTab = () => {
  const [loadedProviderSettings, setLoadedProviderSettings] =
    useState<ProviderSettings>(defaultProviderSettings);
  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(0);
  const [providerOptionsText, setProviderOptionsText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "success" | "error" | "json-error"
  >("idle");

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

  useEffect(() => {
    // Update the providerOptionsText when the selected provider changes
    const currentOptions =
      loadedProviderSettings.all[selectedProviderIndex]?.providerOptions;
    setProviderOptionsText(
      currentOptions ? JSON.stringify(currentOptions, null, 2) : ""
    );
  }, [selectedProviderIndex, loadedProviderSettings]);

  const handleProviderSelectChange = (value: string) => {
    setSelectedProviderIndex(Number(value));
  };

  const handleProviderFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const handleSwitchChange = (name: string, checked: boolean) => {
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

  const handleActiveProviderChange = (checked: boolean) => {
    setLoadedProviderSettings((prev) => ({
      ...prev,
      active: checked ? prev.all[selectedProviderIndex] : null,
    }));
  };

  const handleProviderOptionsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setProviderOptionsText(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus("idle");

    // Validate and parse providerOptions
    try {
      const providerOptions = providerOptionsText
        ? JSON.parse(providerOptionsText)
        : {};

      // Update the provider settings with the parsed JSON before saving
      const newSettingsArray = [...loadedProviderSettings.all];
      const updatedProvider = {
        ...newSettingsArray[selectedProviderIndex],
        providerOptions,
      };
      newSettingsArray[selectedProviderIndex] = updatedProvider;

      const updatedSettings = {
        ...loadedProviderSettings,
        all: newSettingsArray,
        active:
          loadedProviderSettings.active?.provider === updatedProvider.provider
            ? updatedProvider
            : loadedProviderSettings.active,
      };

      // Save the updated settings
      await SettingsStorage.saveProviderSettings(updatedSettings);
      setLoadedProviderSettings(updatedSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      if (providerOptionsText && err instanceof SyntaxError) {
        setSaveStatus("json-error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    }
    setIsLoading(false);
  };

  if (isLoading && loadedProviderSettings === defaultProviderSettings) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="p-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select
            value={selectedProviderIndex.toString()}
            onValueChange={handleProviderSelectChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {loadedProviderSettings.all.map((setting, index) => (
                <SelectItem key={setting.provider} value={index.toString()}>
                  {setting.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="activeProvider"
              checked={
                loadedProviderSettings.active?.provider ===
                loadedProviderSettings.all[selectedProviderIndex].provider
              }
              onCheckedChange={(checked) => handleActiveProviderChange(checked)}
            />
            <Label htmlFor="activeProvider">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="enableToolCalls"
              checked={
                loadedProviderSettings.all[selectedProviderIndex]
                  .enableToolCalls
              }
              onCheckedChange={(checked) =>
                handleSwitchChange("enableToolCalls", checked)
              }
            />
            <Label htmlFor="enableToolCalls">Enable Tool Calls</Label>
          </div>
        </div>

        {"name" in loadedProviderSettings.all[selectedProviderIndex] && (
          <div className="space-y-2">
            <Label htmlFor="name">Custom provider name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={
                loadedProviderSettings.all[selectedProviderIndex].name || ""
              }
              onChange={handleProviderFieldChange}
              placeholder="Enter provider name"
            />
          </div>
        )}

        {"url" in loadedProviderSettings.all[selectedProviderIndex] && (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              type="text"
              id="url"
              name="url"
              value={
                loadedProviderSettings.all[selectedProviderIndex].url || ""
              }
              onChange={handleProviderFieldChange}
              placeholder="Enter URL"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            type="password"
            id="apiKey"
            name="apiKey"
            value={
              loadedProviderSettings.all[selectedProviderIndex].apiKey || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter your API key"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            type="text"
            id="model"
            name="model"
            value={
              loadedProviderSettings.all[selectedProviderIndex].model || ""
            }
            onChange={handleProviderFieldChange}
            placeholder="Enter model name"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="providerOptions">Provider Options</Label>
            <div
              onClick={() =>
                window.open(
                  "https://sdk.vercel.ai/providers/ai-sdk-providers",
                  "_blank"
                )
              }
            >
              <Tooltip className="cursor-pointer">
                <p className="mb-1">
                  Provider options are for Vercel's AI SDK.
                </p>
                <p className="mb-1">
                  Clicking here will open a new tab to Vercel's documentation:
                </p>
                <p className="mb-1">
                  https://sdk.vercel.ai/providers/ai-sdk-providers
                </p>
              </Tooltip>
            </div>
          </div>
          <Textarea
            id="providerOptions"
            name="providerOptions"
            value={providerOptionsText}
            onChange={handleProviderOptionsChange}
            placeholder="Enter provider options as JSON"
            rows={2}
            className="resize-y min-h-[80px] font-mono"
          />
        </div>

        <div className="flex items-center mt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
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
          {saveStatus === "json-error" && (
            <span className="ml-2 text-red-400 flex items-center">
              Invalid JSON in Provider Options
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
