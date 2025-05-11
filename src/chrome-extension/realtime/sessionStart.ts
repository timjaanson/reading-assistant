import { VOICE, MODEL, BASE_URL } from "../realtime/constants";
import { SettingsStorage } from "../storage/providerSettings";

export async function getOpenAIRealtimeSession() {
  try {
    const openAiProvider =
      await SettingsStorage.loadProviderSettingsByProviderId("openai");

    const openAiKey = openAiProvider?.apiKey;

    if (!openAiKey) {
      throw new Error("No OpenAI API key found");
    }

    const r = await fetch(`${BASE_URL}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE,
      }),
    });

    const res = (await r.json()) as SessionStartResponse;

    return res;
  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message };
  }
}

export type SessionStartResponse = {
  id: string;
  client_secret: {
    value: string;
  };
};
