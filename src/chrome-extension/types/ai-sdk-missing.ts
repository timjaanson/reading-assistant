type JSONValue = null | string | number | boolean | JSONObject | JSONArray;
type JSONObject = {
  [key: string]: JSONValue;
};
type JSONArray = JSONValue[];

export type ProviderOptions = Record<string, Record<string, JSONValue>>;
