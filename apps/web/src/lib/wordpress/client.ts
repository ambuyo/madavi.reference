// WordPress REST API client
export const wpBaseUrl = "https://cms.madavi.co";
export const wpApiUrl = `${wpBaseUrl}/wp-json/wp/v2`;


export async function wpFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 10_000
): Promise<T> {
  const url = `${wpApiUrl}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    console.error(`${isTimeout ? "Timeout" : "Error"} fetching from WordPress API at ${url}:`, error);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
