import { useEffect, useState } from "react";
import { SettingsStorage } from "../storage/providerSettings";
import { FlatModelsList, Model, ProviderId } from "../types/settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { SquareFunction } from "lucide-react";

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

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await SettingsStorage.loadFlatModelsList();
      const activeModel = await SettingsStorage.getActiveModel();
      setAvailableModels(settings);
      setActiveModel(activeModel);
    };
    loadSettings();
  }, []);

  const handleModelSelect = async (value: string) => {
    const [providerId, modelId] = value.split("::");
    try {
      await SettingsStorage.setActiveModel(providerId as ProviderId, modelId);
      const updatedModels = await SettingsStorage.loadFlatModelsList();
      setAvailableModels(updatedModels);

      const updatedActiveModel = await SettingsStorage.getActiveModel();
      setActiveModel(updatedActiveModel);
    } catch (error) {
      console.error("Failed to set active provider:", error);
    }
  };

  if (!availableModels) return null;

  // Group models by provider
  const modelsByProvider = availableModels.models.reduce((acc, model) => {
    if (!acc[model.providerId]) {
      acc[model.providerId] = {
        providerName: model.providerName,
        models: [],
      };
    }
    acc[model.providerId].models.push(model);
    return acc;
  }, {} as Record<string, { providerName: string; models: typeof availableModels.models }>);

  const currentValue = activeModel
    ? `${activeModel.providerId}::${activeModel.modelId}`
    : undefined;

  return (
    <div className="flex space-x-1">
      {/* <Label htmlFor="model-quick-select">Model</Label> */}
      <Select
        value={currentValue}
        onValueChange={handleModelSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-auto" size="sm">
          <SelectValue id="model-quick-select" placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(modelsByProvider).map(
            ([providerId, { providerName, models }]) => (
              <SelectGroup key={providerId}>
                <SelectLabel>{providerName}</SelectLabel>
                {models.map((model) => (
                  <SelectItem
                    key={`${model.providerId}-${model.modelId}`}
                    value={`${model.providerId}::${model.modelId}`}
                  >
                    <div className="flex items-center gap-2">
                      {model.name}
                      {model.enableToolCalls && (
                        <SquareFunction className="h-4 w-4" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
