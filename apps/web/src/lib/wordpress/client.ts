// WordPress REST API client
export const wpBaseUrl = "https://cms.madavi.co";
export const wpApiUrl = `${wpBaseUrl}/wp-json/wp/v2`;

/** Maximum number of posts to cache (shared by build script and revalidate endpoint) */
export const CACHE_LIMIT = 150;
/** Posts per page when fetching from WP REST API */
export const PAGE_SIZE = 100;

export interface WpFetchOptions extends RequestInit {
  /** Number of retry attempts for transient errors (default: 3) */
  retries?: number;
  /** Base delay between retries in ms, doubles each attempt (default: 1000) */
  retryDelayMs?: number;
}

export async function wpFetch<T>(
  endpoint: string,
  options: WpFetchOptions = {},
  timeoutMs = 10_000,
): Promise<T> {
  const url = `${wpApiUrl}${endpoint}`;
  const { retries = 3, retryDelayMs = 1000, ...fetchOpts } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOpts,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...fetchOpts.headers,
        },
      });

      if (!response.ok) {
        // Don't retry client errors (4xx) — only server errors (5xx)
        if (response.status >= 500 && attempt < retries) {
          const delay = retryDelayMs * Math.pow(2, attempt);
          console.warn(
            `[wpFetch] ${response.status} from ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(
          `WordPress API error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTimeout = error instanceof Error && error.name === "AbortError";

      // Retry on timeout or network errors, not on parse errors
      if (
        (isTimeout || lastError.message.includes("fetch")) &&
        attempt < retries
      ) {
        const delay = retryDelayMs * Math.pow(2, attempt);
        console.warn(
          `[wpFetch] ${isTimeout ? "Timeout" : "Network error"} from ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      console.error(
        `${isTimeout ? "Timeout" : "Error"} fetching from WordPress API at ${url}:`,
        error,
      );
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw (
    lastError ?? new Error(`Failed to fetch ${url} after ${retries} retries`)
  );
}
