import { ExternalToolsStorage } from "../storage/externalToolSettings";
import {
  BraveSearchResponse,
  MinifiedSearchResult,
  SearchResult,
} from "../types/brave-search";

const API_URL = "https://api.search.brave.com/res/v1/web/search";

// Queue system for rate limiting
class RequestQueue {
  private queue: Array<{
    resolve: (value: MinifiedSearchResult[]) => void;
    reject: (reason: Error) => void;
    query: string;
    count: number;
  }> = [];
  private processing = false;
  private maxQueueSize: number;
  private nextAllowedRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL_MS = 1000; // Minimum 1 second between requests

  constructor(maxQueueSize = 5) {
    this.maxQueueSize = maxQueueSize;
  }

  async enqueue(query: string, count: number): Promise<MinifiedSearchResult[]> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error("Search queue is full. Please try again later.");
    }

    return new Promise<MinifiedSearchResult[]>((resolve, reject) => {
      this.queue.push({ resolve, reject, query, count });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const request = this.queue.shift()!;

    try {
      // Wait until we're allowed to make the next request
      const now = Date.now();
      if (now < this.nextAllowedRequestTime) {
        const waitTime = this.nextAllowedRequestTime - now;
        console.log(
          `Waiting ${waitTime}ms before next request due to rate limit`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Default next request time based on minimum interval
      this.nextAllowedRequestTime = Date.now() + this.MIN_REQUEST_INTERVAL_MS;

      const result = await this.executeRequest(request.query, request.count);
      request.resolve(result);
    } catch (error) {
      request.reject(error as Error);
    }

    // Process the next request
    setTimeout(() => this.processQueue(), 0);
  }

  private async executeRequest(
    query: string,
    count: number
  ): Promise<MinifiedSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      count: count.toString(),
      safesearch: "off",
      units: "metric",
    });

    const externalToolSettings =
      await ExternalToolsStorage.loadExternalToolSettings();

    if (!externalToolSettings.braveSearch.apiKey) {
      throw new Error("Brave Search API key not found");
    }

    const response = await fetch(`${API_URL}?${params.toString()}`, {
      headers: {
        "X-Subscription-Token": externalToolSettings.braveSearch.apiKey,
      },
    });

    // Parse rate limit headers to determine when we can make the next request
    this.updateNextRequestTime(response.headers);

    // Handle rate limit exceeded error
    if (response.status === 429) {
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      let waitSeconds = 10; // Default fallback

      if (resetHeader) {
        const [secondsResetStr] = resetHeader.split(",");
        waitSeconds = parseInt(secondsResetStr.trim(), 10);
      }

      throw new Error(
        `Rate limit exceeded. Try again in ${waitSeconds} seconds.`
      );
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.ok) {
      console.log("brave search response ok");
    }

    const data: BraveSearchResponse = await response.json();
    const minifiedResults = mapResultsToMinified(data.web.results);

    return minifiedResults;
  }

  private updateNextRequestTime(headers: Headers) {
    // Get remaining rate limit and reset time from headers
    const resetHeader = headers.get("X-RateLimit-Reset");
    const remainingHeader = headers.get("X-RateLimit-Remaining");

    if (resetHeader && remainingHeader) {
      const [secondsResetStr] = resetHeader.split(",");
      const [remainingStr] = remainingHeader.split(",");

      const resetSeconds = parseInt(secondsResetStr.trim(), 10);
      const remaining = parseInt(remainingStr.trim(), 10);

      console.log(
        `Rate limit info - Remaining: ${remaining}, Reset in: ${resetSeconds}s`
      );

      // If we're about to run out of rate limit, use the reset time to schedule next request
      if (remaining <= 1) {
        const resetTime = Date.now() + resetSeconds * 1000;
        this.nextAllowedRequestTime = Math.max(
          this.nextAllowedRequestTime,
          resetTime
        );
        console.log(
          `Rate limit almost exhausted, next request scheduled for ${new Date(
            this.nextAllowedRequestTime
          )}`
        );
      }
    }
  }
}

// Create a singleton instance of the request queue
const requestQueue = new RequestQueue();

export const searchBrave = async (
  query: string,
  count: number = 5
): Promise<MinifiedSearchResult[]> => {
  // Use the queue to handle rate limiting
  return requestQueue.enqueue(query, count);
};

const mapResultsToMinified = (
  results: SearchResult[]
): MinifiedSearchResult[] => {
  return results.map((result) => {
    return {
      title: result.title,
      url: result.url,
      description: result.description,
      page_age: result.page_age,
      age: result.age,
      profile: {
        name: result.profile?.name,
        long_name: result.profile?.long_name,
      },
      thumbnail: {
        src: result.thumbnail?.src,
        logo: result.thumbnail?.logo,
      },
    };
  });
};
