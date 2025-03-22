export interface BraveSearchResponse {
  type: string;
  web: Search;
}

export interface Search {
  type: "search";
  results: SearchResult[];
  family_friendly: boolean;
}

export interface SearchResult {
  type: "search_result";
  subtype: string;
  is_live: boolean;
  title: string;
  url: string;
  page_age: string;
  age: string;
  is_source_local: boolean;
  is_source_both: boolean;
  description: string;
  profile: Profile;
  language: string;
  family_friendly: boolean;
  meta_url: MetaUrl;
  thumbnail: Thumbnail;
  extra_snippets: string[];
}

export interface Profile {
  name: string;
  url: string;
  long_name: string;
  img: string;
}

export interface MetaUrl {
  scheme: string;
  netloc: string;
  hostname: string;
  favicon: string;
  path: string;
}

export interface Thumbnail {
  src: string;
  original: string;
  logo: boolean;
}

export interface MinifiedSearchResult {
  title: string;
  url: string;
  description: string;
  page_age: string;
  age: string;
  profile: {
    name?: string;
    long_name?: string;
  };
  thumbnail: {
    src?: string;
    logo?: boolean;
  };
}
