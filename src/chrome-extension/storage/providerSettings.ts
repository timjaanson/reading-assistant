import {
  FlatModelsList,
  Model,
  Provider,
  ProviderId,
  ProviderSettings,
} from "../types/settings";
import { StorageKeys } from "./settings";

export const defaultProviderSettings: ProviderSettings = {
  all: [
    {
      providerId: "openai",
      name: "OpenAI",
      apiKey: "",
      providerOptions: {
        openai: {},
      },
      models: [
        {
          providerId: "openai",
          modelId: "gpt-4.1-mini",
          name: "GPT 4.1 Mini",
          enableToolCalls: true,
          options: {},
        },
      ],
    },
    {
      providerId: "anthropic",
      name: "Anthropic",
      apiKey: "",
      providerOptions: {
        anthropic: {},
      },
      models: [],
    },
    {
      providerId: "google",
      name: "Google",
      apiKey: "",
      providerOptions: {
        google: {},
      },
      models: [],
    },
    {
      providerId: "openrouter",
      name: "OpenRouter",
      url: "https://openrouter.ai/api/v1",
      apiKey: "",
      providerOptions: {
        openai: {},
      },
      models: [],
    },
    {
      providerId: "openai-compatible",
      name: "OpenAI Compatible",
      url: "https://custom.example-provider.com/v1",
      apiKey: "",
      providerOptions: {
        openai: {},
      },
      models: [],
    },
  ],
  active: null,
};

export class SettingsStorage {
  static async saveProviderSettings(
    settings: ProviderSettings
  ): Promise<ProviderSettings> {
    try {
      await chrome.storage.local.set({
        [StorageKeys.ProviderSettings]: settings,
      });
      return await this.loadProviderSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  static async loadProviderSettings(): Promise<ProviderSettings> {
    try {
      const result = await chrome.storage.local.get(
        StorageKeys.ProviderSettings
      );
      const providerSettings =
        (result[StorageKeys.ProviderSettings] as ProviderSettings) ||
        defaultProviderSettings;

      defaultProviderSettings.all.forEach((provider) => {
        if (
          !providerSettings.all.find(
            (p) => p.providerId === provider.providerId
          )
        ) {
          providerSettings.all.push(provider);
        }
      });
      return providerSettings;
    } catch (error) {
      console.error("Error loading settings:", error);
      throw error;
    }
  }

  static async loadProviderSettingsByProviderId(
    providerId: ProviderId
  ): Promise<Provider | undefined> {
    const providerSettings = await this.loadProviderSettings();
    return providerSettings.all.find(
      (provider) => provider.providerId === providerId
    );
  }

  static async loadFlatModelsList(): Promise<FlatModelsList> {
    const providerSettings = await this.loadProviderSettings();
    const activeModel = providerSettings.active;
    const models = providerSettings.all.flatMap((provider) =>
      provider.models.map((model) => ({
        ...model,
        active:
          model.modelId === activeModel?.modelId &&
          model.name === activeModel?.name,
        providerName: provider.name || "",
      }))
    );
    return {
      models,
      active: activeModel,
    };
  }

  static async updateProviderSettings(
    providerSettings: ProviderSettings
  ): Promise<ProviderSettings> {
    const currentSettings = await this.loadProviderSettings();
    const newSettings = {
      all: providerSettings.all,
      active: currentSettings.active,
    };
    await this.saveProviderSettings(newSettings);
    return newSettings;
  }

  static async findProviderById(providerId: ProviderId): Promise<Provider> {
    const currentSettings = await this.loadProviderSettings();
    const provider = currentSettings.all.find(
      (provider) => provider.providerId === providerId
    );
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return provider;
  }

  static async findModelByProviderIdAndModelIdAndName(
    providerId: ProviderId,
    modelId: string,
    modelName: string
  ): Promise<Model | undefined> {
    const provider = await this.findProviderById(providerId);
    return provider.models.find(
      (model) => model.modelId === modelId && model.name === modelName
    );
  }

  static async getActiveModel(): Promise<Model | null> {
    const currentSettings = await this.loadProviderSettings();
    if (!currentSettings.active) {
      return null;
    }
    const activeModel = await this.findModelByProviderIdAndModelIdAndName(
      currentSettings.active.providerId,
      currentSettings.active.modelId,
      currentSettings.active.name
    );
    return activeModel || null;
  }

  static async setActiveModel(
    providerId: ProviderId,
    modelId: string,
    name: string
  ): Promise<ProviderSettings> {
    const currentSettings = await this.loadProviderSettings();
    let activeModel: Model | null = null;

    const model = await this.findModelByProviderIdAndModelIdAndName(
      providerId,
      modelId,
      name
    );

    if (!model) {
      throw new Error(
        `ModelId ${modelId}, modelName ${name} not found for provider ${providerId}`
      );
    }

    activeModel = model;

    const newSettings = {
      ...currentSettings,
      active: activeModel,
    };

    await this.saveProviderSettings(newSettings);
    return newSettings;
  }
}
