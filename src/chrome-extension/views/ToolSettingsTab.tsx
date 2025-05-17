import { useState, useEffect } from "react";
import { ToolSettings, MCPServer } from "../types/settings";
import {
  ToolsSettingsStorage,
  defaultExternalToolSettings,
} from "../storage/toolSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CircleX } from "lucide-react";

export const ExternalToolSettingsTab = () => {
  const [settings, setSettings] = useState<ToolSettings>(
    defaultExternalToolSettings
  );
  const [selectedSearchToolIndex, setSelectedSearchToolIndex] =
    useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [mcpHeadersInputs, setMcpHeadersInputs] = useState<string[]>([]);
  const [mcpHeadersErrors, setMcpHeadersErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await ToolsSettingsStorage.loadToolSettings();

        setSettings(loadedSettings);
        setSelectedSearchToolIndex(
          loadedSettings.search.active
            ? loadedSettings.search.options.findIndex(
                (tool) => tool.id === loadedSettings.search.active!.id
              )
            : 0
        );

        // Initialize headers inputs with pretty-formatted JSON strings
        const formattedHeaders = loadedSettings.mcp.servers.map((server) =>
          JSON.stringify(server.headers, null, 2)
        );
        setMcpHeadersInputs(formattedHeaders);
        setMcpHeadersErrors(loadedSettings.mcp.servers.map(() => ""));
      } catch (error) {
        console.error("Failed to load external tool settings", error);
        // On error, fall back to defaults
        setSettings(defaultExternalToolSettings);
        setMcpHeadersInputs(
          defaultExternalToolSettings.mcp.servers.map(() =>
            JSON.stringify({}, null, 2)
          )
        );
        setMcpHeadersErrors(
          defaultExternalToolSettings.mcp.servers.map(() => "")
        );
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    // First validate all JSON inputs
    let isValid = true;
    const newErrors = [...mcpHeadersErrors];

    for (let i = 0; i < mcpHeadersInputs.length; i++) {
      try {
        JSON.parse(mcpHeadersInputs[i]);
        newErrors[i] = "";
      } catch (e) {
        newErrors[i] = "Invalid JSON format";
        isValid = false;
      }
    }

    setMcpHeadersErrors(newErrors);

    if (!isValid) {
      setSaveStatus("error");
      return;
    }

    const updatedSettings = { ...settings };
    for (let i = 0; i < updatedSettings.mcp.servers.length; i++) {
      try {
        updatedSettings.mcp.servers[i].headers = JSON.parse(
          mcpHeadersInputs[i]
        );
      } catch (e) {
        // This shouldn't happen as we've already validated
        console.error("Error parsing JSON headers", e);
      }
    }

    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await ToolsSettingsStorage.saveToolSettings(updatedSettings);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save external tool settings", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToolSelectChange = (value: string) => {
    setSelectedSearchToolIndex(Number(value));
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSettings((prev) => {
      const newOptions = [...prev.search.options];
      newOptions[selectedSearchToolIndex] = {
        ...newOptions[selectedSearchToolIndex],
        apiKey: value,
      };

      return {
        ...prev,
        search: {
          ...prev.search,
          options: newOptions,
        },
      };
    });
  };

  const handleActiveChange = (checked: boolean) => {
    setSettings((prev) => {
      if (!checked) {
        return {
          ...prev,
          search: {
            ...prev.search,
            active: null,
          },
        };
      }

      // If checking, set currently selected tool as active
      return {
        ...prev,
        search: {
          ...prev.search,
          active: prev.search.options[selectedSearchToolIndex],
        },
      };
    });
  };

  // MCP Server handlers
  const handleAddMCPServer = () => {
    setSettings((prev) => ({
      ...prev,
      mcp: {
        ...prev.mcp,
        servers: [
          ...prev.mcp.servers,
          {
            active: false,
            name: "New Server",
            url: "",
            headers: {},
          },
        ],
      },
    }));

    // Add empty headers input for the new server
    setMcpHeadersInputs((prev) => [...prev, JSON.stringify({}, null, 2)]);
    setMcpHeadersErrors((prev) => [...prev, ""]);
  };

  const handleDeleteMCPServer = (index: number) => {
    if (confirm("Are you sure you want to delete this server?")) {
      setSettings((prev) => {
        const newServers = [...prev.mcp.servers];
        newServers.splice(index, 1);
        return {
          ...prev,
          mcp: {
            ...prev.mcp,
            servers: newServers,
          },
        };
      });

      // Remove the corresponding headers input
      setMcpHeadersInputs((prev) => {
        const newInputs = [...prev];
        newInputs.splice(index, 1);
        return newInputs;
      });

      setMcpHeadersErrors((prev) => {
        const newErrors = [...prev];
        newErrors.splice(index, 1);
        return newErrors;
      });
    }
  };

  const handleMCPServerChange = (
    index: number,
    field: keyof MCPServer,
    value: any
  ) => {
    setSettings((prev) => {
      const newServers = [...prev.mcp.servers];
      newServers[index] = {
        ...newServers[index],
        [field]: value,
      };
      return {
        ...prev,
        mcp: {
          ...prev.mcp,
          servers: newServers,
        },
      };
    });
  };

  const handleHeadersChange = (serverIndex: number, value: string) => {
    setMcpHeadersInputs((prev) => {
      const newInputs = [...prev];
      newInputs[serverIndex] = value;
      return newInputs;
    });

    // Validate JSON as user types
    try {
      JSON.parse(value);
      setMcpHeadersErrors((prev) => {
        const newErrors = [...prev];
        newErrors[serverIndex] = "";
        return newErrors;
      });
    } catch (e) {
      setMcpHeadersErrors((prev) => {
        const newErrors = [...prev];
        newErrors[serverIndex] = "Invalid JSON format";
        return newErrors;
      });
    }
  };

  // Get the currently selected tool
  const selectedTool = settings.search.options[selectedSearchToolIndex] || null;

  // Check if the selected tool is active
  const isSelectedToolActive = settings.search.active?.id === selectedTool?.id;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Tool Settings</h2>

      {/* Internal Tools Section */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Internal Tools</h3>

        <Card>
          <CardContent>
            <div className="flex items-center mb-3">
              <Switch
                checked={settings.extractActiveTab.active}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    extractActiveTab: { active: checked },
                  }))
                }
              />
              <Label className="font-medium ml-2">
                Extract Active Tab Content
              </Label>
            </div>

            <div className="flex items-center">
              <Switch
                checked={settings.memoryManagement.active}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    memoryManagement: { active: checked },
                  }))
                }
              />
              <Label className="font-medium ml-2">Memory Management</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-4">External Tool Settings</h2>

      <div className="mb-6">
        <h3 className="text-md font-medium mb-2">Search Tools</h3>

        <div className="space-y-2 mb-3">
          <Label htmlFor="searchTool" className="block text-sm font-medium">
            Select Search Tool
          </Label>
          <Select
            value={selectedSearchToolIndex.toString()}
            onValueChange={handleToolSelectChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a search tool" />
            </SelectTrigger>
            <SelectContent>
              {settings.search.options.map((tool, index) => (
                <SelectItem key={tool.id} value={index.toString()}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-x-2 mb-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="activeTool"
              checked={isSelectedToolActive}
              onCheckedChange={handleActiveChange}
            />
            <Label htmlFor="activeTool">Active</Label>
          </div>
        </div>

        <div className="mb-3">
          <Label htmlFor="apiKey" className="block text-sm font-medium mb-1">
            API Key
          </Label>
          <Input
            id="apiKey"
            type="password"
            value={selectedTool?.apiKey || ""}
            onChange={handleApiKeyChange}
            className="w-full"
            placeholder={`Enter ${selectedTool?.name} API Key`}
          />
        </div>
      </div>

      {/* MCP Servers Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium">MCP Servers</h3>
          <Button onClick={handleAddMCPServer}>+ Add Server</Button>
        </div>

        {settings.mcp.servers.length === 0 ? (
          <div className="text-sm py-2">
            No MCP servers configured. Click "Add Server" to add one.
          </div>
        ) : (
          <div className="space-y-6">
            {settings.mcp.servers.map((server, serverIndex) => (
              <Card key={serverIndex}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={server.active}
                        onCheckedChange={(checked) =>
                          handleMCPServerChange(serverIndex, "active", checked)
                        }
                      />
                      <Label>Active</Label>
                    </div>
                    <button
                      onClick={() => handleDeleteMCPServer(serverIndex)}
                      className="cursor-pointer opacity-80 hover:opacity-100"
                    >
                      <CircleX size={16} className="text-destructive" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 py-0">
                  <div>
                    <Label className="block text-sm font-medium mb-1">
                      Name
                    </Label>
                    <Input
                      type="text"
                      value={server.name}
                      onChange={(e) =>
                        handleMCPServerChange(
                          serverIndex,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full"
                      placeholder="Server name"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-1">
                      URL
                    </Label>
                    <Input
                      type="text"
                      value={server.url}
                      onChange={(e) =>
                        handleMCPServerChange(
                          serverIndex,
                          "url",
                          e.target.value
                        )
                      }
                      className="w-full"
                      placeholder="http://localhost:8080/sse"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-1">
                      Headers (JSON format)
                    </Label>
                    <div className="relative">
                      <Textarea
                        value={mcpHeadersInputs[serverIndex] || "{}"}
                        rows={3}
                        onChange={(e) =>
                          handleHeadersChange(serverIndex, e.target.value)
                        }
                        className="w-full resize-y font-mono text-sm"
                        placeholder='{ "X-API-Key": "your-api-key" }'
                      />
                      {mcpHeadersErrors[serverIndex] && (
                        <div className="text-red-400 text-xs mt-1">
                          {mcpHeadersErrors[serverIndex]}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleSaveSettings} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
      {saveStatus === "success" && (
        <span className="ml-2 text-green-400">Settings saved!</span>
      )}
      {saveStatus === "error" && (
        <span className="ml-2 text-red-400">Failed to save settings</span>
      )}
    </div>
  );
};
