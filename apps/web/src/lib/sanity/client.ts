import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";

// Lazy singleton — prevents eager createClient at module scope from crashing
// the process when SANITY_PROJECT_ID is not yet available (env sync, deploy race).
// Pattern matches the resilient approach in sanity/lib/client.ts.

let _client: SanityClient | null = null;
let _previewClient: SanityClient | null = null;

function createSanityClient(overrides: { useCdn: boolean; perspective: string }): SanityClient {
  const projectId = import.meta.env.SANITY_PROJECT_ID;
  if (!projectId) {
    // Never cache the error — transient env-missing (deploy race, env sync)
    // must recover without a process restart. Throw fresh each time so the
    // next call retries and succeeds when the env var appears.
    throw new Error("SANITY_PROJECT_ID not set");
  }

  return createClient({
    projectId,
    dataset: import.meta.env.SANITY_DATASET || "production",
    apiVersion: import.meta.env.SANITY_API_VERSION || "2024-01-01",
    ...overrides,
    token: import.meta.env.SANITY_READ_TOKEN,
    timeout: 10_000,
  });
}

function getClient(): SanityClient {
  if (!_client) {
    _client = createSanityClient({ useCdn: import.meta.env.PROD, perspective: "published" });
  }
  return _client;
}

function getPreviewClient(): SanityClient {
  if (!_previewClient) {
    _previewClient = createSanityClient({ useCdn: false, perspective: "previewDrafts" });
  }
  return _previewClient;
}

// Proxy exports — transparent to callers (sanityFetch calls .fetch() on these)
// but creation is deferred until first use.
// IMPORTANT: functions are bound to the real client instance so that
// ES2022 private fields (#httpRequest, etc.) resolve correctly.
// All introspection traps are delegated — @sanity/image-url checks
// 'config' in client before calling client.config(), which needs `has`.
function proxyClient(getter: () => SanityClient): SanityClient {
  return new Proxy({} as SanityClient, {
    get(_target, prop) {
      const real = getter();
      const value = (real as any)[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
    has(_target, prop) {
      return prop in getter();
    },
    ownKeys(_target) {
      return Reflect.ownKeys(getter());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(getter(), prop);
    },
  });
}

export const client: SanityClient = proxyClient(getClient);
export const previewClient: SanityClient = proxyClient(getPreviewClient);
