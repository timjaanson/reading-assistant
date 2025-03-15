import React, { useState } from "react";

export const SettingsTab = () => {
  const [settings, setSettings] = useState({
    provider: "openai",
    apiKey: "",
    model: "gpt-4o-mini",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>

      <form className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="provider"
            className="block text-sm font-medium text-gray-700"
          >
            Provider
          </label>
          <select
            id="provider"
            name="provider"
            value={settings.provider}
            onChange={handleChange}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-gray-700"
          >
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={settings.apiKey}
            onChange={handleChange}
            placeholder="Enter your API key"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="model"
            className="block text-sm font-medium text-gray-700"
          >
            Model
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={settings.model}
            onChange={handleChange}
            placeholder="Enter model name (e.g. gpt-4o-mini)"
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Save settings
            console.log("Settings saved:", settings);
          }}
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
