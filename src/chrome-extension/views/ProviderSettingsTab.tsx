import { useEffect, useState } from "react";
import { SettingsStorage } from "../storage/providerSettings";
import {
  Provider,
  ProviderSettings,
  Model,
  ModelOptions,
} from "../types/settings";
import { Input } from "@/components/ui/input";
import { Tooltip } from "../views-components/Tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

export const ProviderSettingsTab = () => {
  const [providerSettings, setProviderSettings] =
    useState<ProviderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "success" | "error" | "json-error"
  >("idle");

  useEffect(() => {
    setIsLoading(true);
    try {
      const loadUserSettings = async () => {
        const settings = await SettingsStorage.loadProviderSettings();
        setProviderSettings(settings);
      };
      loadUserSettings();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleProviderChange = (
    providerId: string,
    field: keyof Provider,
    value: string
  ) => {
    if (!providerSettings) return;

    setProviderSettings((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        all: prev.all.map((provider) => {
          if (provider.providerId !== providerId) return provider;

          let valueToSet = value;

          if (field === "providerOptions") {
            try {
              valueToSet = JSON.parse(value as string);
              setSaveStatus("idle");
            } catch (e) {
              setSaveStatus("json-error");
            }
          }

          return {
            ...provider,
            [field]: valueToSet,
          };
        }),
      };
    });
  };

  const handleModelChange = (
    providerId: string,
    modelIndex: number,
    field: keyof Model | "providerOptions",
    value: string | boolean
  ) => {
    if (!providerSettings) return;

    setProviderSettings((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        all: prev.all.map((provider) =>
          provider.providerId === providerId
            ? {
                ...provider,
                models: provider.models.map((model, index) => {
                  if (index !== modelIndex) return model;

                  // Handle special case for providerOptions which is now in the options object
                  if (
                    field === "providerOptions" &&
                    typeof value === "string"
                  ) {
                    try {
                      // Parse the JSON string for providerOptions
                      const providerOptions = JSON.parse(value);
                      setSaveStatus("idle");

                      // Update just the providerOptions in the options object
                      return {
                        ...model,
                        options: {
                          ...model.options,
                          providerOptions,
                        },
                      };
                    } catch (e) {
                      setSaveStatus("json-error");
                      return model;
                    }
                  }

                  // For other fields, update normally
                  return {
                    ...model,
                    [field]: value,
                  };
                }),
              }
            : provider
        ),
      };
    });
  };

  // Add a function to handle model option changes specifically
  const handleModelOptionChange = (
    providerId: string,
    modelIndex: number,
    optionField: keyof ModelOptions,
    value: number | undefined
  ) => {
    if (!providerSettings) return;

    setProviderSettings((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        all: prev.all.map((provider) =>
          provider.providerId === providerId
            ? {
                ...provider,
                models: provider.models.map((model, index) => {
                  if (index !== modelIndex) return model;

                  return {
                    ...model,
                    options: {
                      ...model.options,
                      [optionField]: value,
                    },
                  };
                }),
              }
            : provider
        ),
      };
    });
  };

  const handleDeleteModel = (providerId: string, modelId: string) => {
    if (!providerSettings) return;

    setProviderSettings((prev) => {
      if (!prev) return prev;

      // If the model being deleted is the active one, this might require special handling
      const isActiveModel =
        prev.active?.providerId === providerId &&
        prev.active?.modelId === modelId;

      return {
        ...prev,
        // If deleting the active model, remove the active reference
        ...(isActiveModel && { active: null }),
        all: prev.all.map((provider) =>
          provider.providerId === providerId
            ? {
                ...provider,
                models: provider.models.filter(
                  (model) => model.modelId !== modelId
                ),
              }
            : provider
        ),
      };
    });
  };

  const handleAddModel = (providerId: string) => {
    if (!providerSettings) return;

    setProviderSettings((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        all: prev.all.map((provider) =>
          provider.providerId === providerId
            ? {
                ...provider,
                models: [
                  ...provider.models,
                  {
                    modelId: "model",
                    name: "New",
                    enableToolCalls: false,
                    providerId: provider.providerId,
                    options: {
                      maxTokens: undefined,
                      temperature: undefined,
                      topK: undefined,
                      topP: undefined,
                      providerOptions: undefined,
                    },
                  },
                ],
              }
            : provider
        ),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerSettings) return;

    // Check for invalid JSON before submitting
    let hasJsonError = false;

    providerSettings.all.forEach((provider) => {
      // Check provider options
      const providerOptionsStr = document.getElementById(
        `${provider.providerId}-providerOptions`
      ) as HTMLTextAreaElement | null;

      if (providerOptionsStr && providerOptionsStr.value) {
        try {
          JSON.parse(providerOptionsStr.value);
        } catch (e) {
          hasJsonError = true;
        }
      }

      // Check model options
      provider.models.forEach((model) => {
        const modelOptionsStr = document.getElementById(
          `${model.modelId}-providerOptions`
        ) as HTMLTextAreaElement | null;

        if (modelOptionsStr && modelOptionsStr.value) {
          try {
            JSON.parse(modelOptionsStr.value);
          } catch (e) {
            hasJsonError = true;
          }
        }
      });
    });

    if (hasJsonError) {
      setSaveStatus("json-error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    setIsLoading(true);
    setSaveStatus("idle");

    try {
      // Save the updated settings
      const savedSettings = await SettingsStorage.saveProviderSettings(
        providerSettings
      );
      setProviderSettings(savedSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !providerSettings) {
    return <div className="p-4">Loading settings...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Provider & Model Settings</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Accordion collapsible type="single" className="w-full">
          {providerSettings.all.map((provider) => (
            <AccordionItem
              key={provider.providerId}
              value={provider.providerId}
            >
              <AccordionTrigger>
                {provider.name || provider.providerId}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 px-2">
                {/* Provider Name */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.providerId}-name`}>
                    Provider Name
                  </Label>
                  <Input
                    type="text"
                    id={`${provider.providerId}-name`}
                    value={provider.name || ""}
                    onChange={(e) =>
                      handleProviderChange(
                        provider.providerId,
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="Enter provider name"
                  />
                </div>

                {/* URL - only for openai-compatible and openrouter */}
                {["openai-compatible", "openrouter"].includes(
                  provider.providerId
                ) && (
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.providerId}-url`}>URL</Label>
                    <Input
                      type="text"
                      id={`${provider.providerId}-url`}
                      value={provider.url || ""}
                      onChange={(e) =>
                        handleProviderChange(
                          provider.providerId,
                          "url",
                          e.target.value
                        )
                      }
                      placeholder="Enter URL"
                    />
                  </div>
                )}

                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor={`${provider.providerId}-apiKey`}>
                    API Key
                  </Label>
                  <Input
                    type="password"
                    id={`${provider.providerId}-apiKey`}
                    value={provider.apiKey || ""}
                    onChange={(e) =>
                      handleProviderChange(
                        provider.providerId,
                        "apiKey",
                        e.target.value
                      )
                    }
                    placeholder="Enter your API key"
                  />
                </div>

                {/* Provider Options */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${provider.providerId}-providerOptions`}>
                      Provider Options
                    </Label>
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
                          Clicking here will open a new tab to Vercel's
                          documentation:
                        </p>
                        <p className="mb-1">
                          https://sdk.vercel.ai/providers/ai-sdk-providers
                        </p>
                      </Tooltip>
                    </div>
                  </div>
                  <Textarea
                    id={`${provider.providerId}-providerOptions`}
                    defaultValue={
                      provider.providerOptions
                        ? JSON.stringify(provider.providerOptions, null, 2)
                        : ""
                    }
                    onChange={(e) =>
                      handleProviderChange(
                        provider.providerId,
                        "providerOptions",
                        e.target.value
                      )
                    }
                    placeholder="Enter provider options as JSON"
                    rows={4}
                    className="resize-y min-h-[80px] font-mono"
                  />
                </div>

                {/* Models Section */}
                <div className="space-y-3 mt-4">
                  <h3 className="text-md font-medium">Models</h3>
                  {provider.models.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No models configured
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {provider.models.map((model, modelIndex) => (
                        <Card
                          key={`${provider.providerId}-model-${modelIndex}`}
                          className="p-4 relative"
                        >
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                            onClick={() =>
                              handleDeleteModel(
                                provider.providerId,
                                model.modelId
                              )
                            }
                            aria-label="Delete model"
                          >
                            ✕
                          </button>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label htmlFor={`${model.modelId}-modelId`}>
                                  Model ID
                                </Label>
                                <Input
                                  id={`${model.modelId}-modelId`}
                                  value={model.modelId}
                                  onChange={(e) =>
                                    handleModelChange(
                                      provider.providerId,
                                      modelIndex,
                                      "modelId",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Model ID"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`${model.modelId}-name`}>
                                  Name
                                </Label>
                                <Input
                                  id={`${model.modelId}-name`}
                                  value={model.name || ""}
                                  onChange={(e) =>
                                    handleModelChange(
                                      provider.providerId,
                                      modelIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Model name"
                                />
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`${model.modelId}-tools`}>
                                Tools
                              </Label>
                              <Switch
                                id={`${model.modelId}-tools`}
                                checked={model.enableToolCalls}
                                onCheckedChange={(checked) =>
                                  handleModelChange(
                                    provider.providerId,
                                    modelIndex,
                                    "enableToolCalls",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <Accordion
                              collapsible
                              type="single"
                              className="w-full"
                            >
                              <AccordionItem value="options">
                                <AccordionTrigger>
                                  Additional options
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2">
                                      <div className="col-span-6 space-y-1">
                                        <Label
                                          htmlFor={`${model.modelId}-maxTokens`}
                                        >
                                          Max Tokens
                                        </Label>
                                        <Input
                                          id={`${model.modelId}-maxTokens`}
                                          type="number"
                                          value={model.options.maxTokens || ""}
                                          onChange={(e) => {
                                            const value =
                                              e.target.value === ""
                                                ? undefined
                                                : Number(e.target.value);
                                            handleModelOptionChange(
                                              provider.providerId,
                                              modelIndex,
                                              "maxTokens",
                                              value
                                            );
                                          }}
                                          placeholder="Max tokens"
                                        />
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <Label
                                          htmlFor={`${model.modelId}-temperature`}
                                        >
                                          Temp
                                        </Label>
                                        <Input
                                          id={`${model.modelId}-temperature`}
                                          type="number"
                                          value={
                                            model.options.temperature || ""
                                          }
                                          onChange={(e) => {
                                            const value =
                                              e.target.value === ""
                                                ? undefined
                                                : Number(e.target.value);
                                            handleModelOptionChange(
                                              provider.providerId,
                                              modelIndex,
                                              "temperature",
                                              value
                                            );
                                          }}
                                          placeholder="0-1"
                                        />
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <Label
                                          htmlFor={`${model.modelId}-topP`}
                                        >
                                          Top P
                                        </Label>
                                        <Input
                                          id={`${model.modelId}-topP`}
                                          type="number"
                                          value={model.options.topP || ""}
                                          onChange={(e) => {
                                            const value =
                                              e.target.value === ""
                                                ? undefined
                                                : Number(e.target.value);
                                            handleModelOptionChange(
                                              provider.providerId,
                                              modelIndex,
                                              "topP",
                                              value
                                            );
                                          }}
                                          placeholder="0-1"
                                        />
                                      </div>
                                      <div className="col-span-2 space-y-1">
                                        <Label
                                          htmlFor={`${model.modelId}-topK`}
                                        >
                                          Top K
                                        </Label>
                                        <Input
                                          id={`${model.modelId}-topK`}
                                          type="number"
                                          value={model.options.topK || ""}
                                          onChange={(e) => {
                                            const value =
                                              e.target.value === ""
                                                ? undefined
                                                : Number(e.target.value);
                                            handleModelOptionChange(
                                              provider.providerId,
                                              modelIndex,
                                              "topK",
                                              value
                                            );
                                          }}
                                          placeholder="0-1"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label
                                        htmlFor={`${model.modelId}-providerOptions`}
                                      >
                                        Provider Options
                                      </Label>
                                      <Textarea
                                        id={`${model.modelId}-providerOptions`}
                                        defaultValue={
                                          model.options.providerOptions
                                            ? JSON.stringify(
                                                model.options.providerOptions,
                                                null,
                                                2
                                              )
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleModelChange(
                                            provider.providerId,
                                            modelIndex,
                                            "providerOptions",
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter provider options as JSON"
                                        rows={3}
                                        className="resize-y min-h-[60px] font-mono text-sm"
                                      />
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddModel(provider.providerId)}
                    className="mt-2"
                  >
                    Add Model
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

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
              Invalid JSON in options
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
