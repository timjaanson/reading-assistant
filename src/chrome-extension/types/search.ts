export type SearchOptions = {
  resultCount?: number;
  includeAnswer?: boolean;
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  timeRange?: "year" | "month" | "week" | "day";
  days?: number;
  include_domains?: string[];
  exclude_domains?: string[];
};
