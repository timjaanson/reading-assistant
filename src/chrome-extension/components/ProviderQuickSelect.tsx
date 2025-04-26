import { useEffect, useRef, useState } from "react";
import { Tooltip } from "./Tooltip";
import { SettingsStorage } from "../storage/providerSettings";
import { FlatModelsList, Model, ProviderId } from "../types/settings";
import { SlidersHorizontal } from "lucide-react";

type ProviderQuickSelectProps = {
  disabled?: boolean;
};

export const ProviderQuickSelect = ({
  disabled = false,
}: ProviderQuickSelectProps) => {
  const [availableModels, setAvailableModels] = useState<FlatModelsList | null>(
    null
  );
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [showModelsDropdown, setShowModelsDropdown] = useState(false);
  const modelsIconRef = useRef<HTMLButtonElement>(null);
  const modelsDropdownRef = useRef<HTMLDivElement>(null);

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
    } catch (error) {
      console.error("Failed to set active provider:", error);
    }
    setShowModelsDropdown(false);
  };

  if (!availableModels) return null;

  return (
    <div className="relative">
      <Tooltip
        position="top"
        disabled={showModelsDropdown}
        target={
          <button
            ref={modelsIconRef}
            type="button"
            disabled={disabled}
            onClick={() => setShowModelsDropdown(!showModelsDropdown)}
            className={`p-0.5 rounded cursor-pointer ${
              availableModels.active
                ? "text-gray-400 hover:text-gray-200"
                : "text-red-500 hover:text-red-400"
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
        <div
          ref={modelsDropdownRef}
          className="absolute right-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto p-2 bg-black/95 text-xs text-gray-200 rounded-sm shadow-lg z-20"
        >
          <ul>
            {availableModels.models.map((model, index) => (
              <li key={`${model.providerId}-${model.modelId}-${index}`}>
                <button
                  type="button"
                  onClick={() =>
                    handleModelSelect(model.providerId, model.modelId)
                  }
                  className={`w-full text-left cursor-pointer px-2 py-1 text-xs rounded hover:bg-gray-400/20 ${
                    availableModels.active?.providerId === model.providerId &&
                    availableModels.active?.modelId === model.modelId
                      ? "bg-gray-200/10 font-semibold"
                      : ""
                  }`}
                >
                  {model.name} ({model.providerName})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
