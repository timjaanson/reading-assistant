import { useEffect, useRef, useState } from "react";
import { Tooltip } from "./Tooltip";
import { SettingsStorage } from "../storage/providerSettings";
import { FlatModelsList, Model, ProviderId } from "../types/settings";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProviderQuickSelectProps = {
  disabled?: boolean;
  closed?: boolean;
  onToggle?: (isOpen: boolean) => void;
};

export const ProviderQuickSelect = ({
  disabled = false,
  closed = false,
  onToggle,
}: ProviderQuickSelectProps) => {
  const [availableModels, setAvailableModels] = useState<FlatModelsList | null>(
    null
  );
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const modelsIconRef = useRef<HTMLButtonElement>(null);
  const modelsDropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks ourselves
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showModelsDropdown &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        toggleDropdown(false);
      }
    };

    if (showModelsDropdown) {
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModelsDropdown]);

  // Handle closed prop from parent
  useEffect(() => {
    if (closed && showModelsDropdown) {
      setShowModelsDropdown(false);
    }
  }, [closed, showModelsDropdown]);

  const toggleDropdown = (isOpen: boolean) => {
    setShowModelsDropdown(isOpen);
    if (onToggle) {
      onToggle(isOpen);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadFlatModelsList();
      const activeModel = await SettingsStorage.getActiveModel();
      setAvailableModels(settings);
      setActiveModel(activeModel);
    };
    loadSettings();
  }, []);

  const handleModelSelect = async (providerId: ProviderId, modelId: string) => {
    try {
      await SettingsStorage.setActiveModel(providerId, modelId);
      const updatedModels = await SettingsStorage.loadFlatModelsList();
      setAvailableModels(updatedModels);

      const updatedActiveModel = await SettingsStorage.getActiveModel();
      setActiveModel(updatedActiveModel);
    } catch (error) {
      console.error("Failed to set active provider:", error);
    }
    toggleDropdown(false);
  };

  if (!availableModels) return null;

  return (
    <div className="relative" ref={containerRef}>
      <Tooltip
        position="top"
        disabled={showModelsDropdown}
        target={
          <button
            ref={modelsIconRef}
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown(!showModelsDropdown);
            }}
            className={`p-0.5 rounded cursor-pointer ${
              availableModels.active ? null : "text-destructive"
            }`}
          >
            <SlidersHorizontal className="text-foreground p-1" />
          </button>
        }
        className="w-auto"
      >
        {activeModel ? `${activeModel.name}` : "None Selected"}
      </Tooltip>

      {showModelsDropdown && (
        <Card
          ref={modelsDropdownRef}
          className="absolute right-0 bottom-full mb-1 w-64 max-h-72 overflow-y-auto z-20 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="py-2 px-0">
            <ul>
              {availableModels.models.map((model, index) => (
                <li key={`${model.providerId}-${model.modelId}-${index}`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelSelect(model.providerId, model.modelId);
                    }}
                    className={`w-full text-left cursor-pointer px-2 py-1 text-sm ${
                      availableModels.active?.providerId === model.providerId &&
                      availableModels.active?.modelId === model.modelId
                        ? " bg-primary/80 hover:bg-primary text-background dark:text-foreground font-semibold"
                        : "hover:bg-secondary text-foreground"
                    }`}
                  >
                    {model.name} ({model.providerName})
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
