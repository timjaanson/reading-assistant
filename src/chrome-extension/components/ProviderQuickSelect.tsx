import { useEffect, useRef, useState } from "react";
import { Tooltip } from "./Tooltip";
import { SettingsStorage } from "../storage/providerSettings";
import { Provider, ProviderSettings } from "../types/settings";
import { SlidersHorizontal } from "lucide-react";

type ProviderQuickSelectProps = {
  disabled?: boolean;
};

export const ProviderQuickSelect = ({
  disabled = false,
}: ProviderQuickSelectProps) => {
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const providerIconRef = useRef<HTMLButtonElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadProviderSettings();
      setProviderSettings(settings);
    };
    loadSettings();
  }, []);

  const handleProviderSelect = async (index: number | null) => {
    try {
      const newSettings = await SettingsStorage.setActiveProvider(index);
      setProviderSettings(newSettings);
    } catch (error) {
      console.error("Failed to set active provider:", error);
    }
    setShowProviderDropdown(false);
  };

  const getProviderDisplayName = (provider: Provider) => {
    return provider.name || provider.provider;
  };

  if (!providerSettings) return null;

  return (
    <div className="relative">
      <Tooltip
        position="top"
        disabled={showProviderDropdown}
        target={
          <button
            ref={providerIconRef}
            type="button"
            disabled={disabled}
            onClick={() => setShowProviderDropdown(!showProviderDropdown)}
            className={`p-0.5 rounded cursor-pointer ${
              providerSettings.active
                ? "text-gray-400 hover:text-gray-200"
                : "text-red-500 hover:text-red-400"
            }`}
          >
            <SlidersHorizontal className="text-foreground p-1" />
          </button>
        }
        className="w-auto"
      >
        {providerSettings.active
          ? `${providerSettings.active.model}`
          : "None Selected"}
      </Tooltip>

      {showProviderDropdown && (
        <div
          ref={providerDropdownRef}
          className="absolute right-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto p-2 bg-black/95 text-xs text-gray-200 rounded-sm shadow-lg z-20"
        >
          <ul>
            {providerSettings.all.map((provider, index) => (
              <li key={`${provider.provider}-${provider.model}-${index}`}>
                <button
                  type="button"
                  onClick={() => handleProviderSelect(index)}
                  className={`w-full text-left cursor-pointer px-2 py-1 text-xs rounded hover:bg-gray-400/20 ${
                    providerSettings.active?.provider === provider.provider &&
                    providerSettings.active?.model === provider.model
                      ? "bg-gray-200/10 font-semibold"
                      : ""
                  }`}
                >
                  {provider.model} ({getProviderDisplayName(provider)})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
