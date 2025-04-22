import { useEffect, useRef, useState } from "react";
import { Tooltip } from "./Tooltip";
import { SettingsStorage } from "../storage/providerSettings";
import { Provider, ProviderSettings } from "../types/settings";

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.28a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
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
