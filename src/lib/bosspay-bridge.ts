/**
 * DollerpayX bridge inside the Next.js app (same pattern as educazi2).
 *
 * DollerpayX / WordPress call either:
 *   - https://<domain>/bosspay/v1/*
 *   - https://<domain>/wp-json/bosspay/v1/*
 */
import {
  createBossPayBridge,
  createWebFetchHandler,
  MemoryTxnStore,
  SupabaseTxnStore,
  type BossPayBridge,
  type HandlerContext,
  type TxnStore,
} from "@dpx/bridge-node";
import { createClient } from "@supabase/supabase-js";
import { createJayamaniEasebuzzHandlers } from "./easebuzz-bridge-handlers";

const DEFAULT_API_BASE = "https://dpxreal.com/backend-api";

type BridgeGlobals = typeof globalThis & {
  __jayamaniBridgeHandler?: ReturnType<typeof createWebFetchHandler>;
  __jayamaniBossPayBridge?: BossPayBridge;
};

const g = globalThis as BridgeGlobals;

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function getEasebuzzEnv() {
  return trimEnv(process.env.EASEBUZZ_ENV) === "test" ? "test" : "prod";
}

function getEasebuzzCredentials() {
  const key = trimEnv(process.env.EASEBUZZ_KEY);
  const salt = trimEnv(process.env.EASEBUZZ_SALT);
  if (!key || !salt) {
    throw new Error("EASEBUZZ_KEY and EASEBUZZ_SALT must be set in environment variables");
  }
  return { key, salt, env: getEasebuzzEnv() as "test" | "prod" };
}

function buildTxnStore(): TxnStore {
  const supabaseUrl =
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || trimEnv(process.env.SUPABASE_URL);
  const serviceRoleKey = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (supabaseUrl && serviceRoleKey) {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return new SupabaseTxnStore({ client });
  }

  return new MemoryTxnStore();
}

function buildHandlerContext(): HandlerContext {
  const { key, salt, env } = getEasebuzzCredentials();

  return {
    handlers: {
      easebuzz: createJayamaniEasebuzzHandlers({
        key,
        salt,
        env,
        productinfo: "Jayamani Collections Order",
      }),
    },
    txnStore: buildTxnStore(),
    bosspayApiBase: trimEnv(process.env.BOSSPAY_API_BASE) || DEFAULT_API_BASE,
    version: "1.0.0",
  };
}

function getBridgeSecret(): string {
  const secret = trimEnv(process.env.BOSSPAY_BRIDGE_SECRET);
  if (!secret) {
    throw new Error("BOSSPAY_BRIDGE_SECRET must be set for the DollerpayX bridge");
  }
  return secret;
}

/** Web Fetch handler for `/bosspay/v1/*` and `/wp-json/bosspay/v1/*`. */
export function getBridgeFetchHandler() {
  if (!g.__jayamaniBridgeHandler) {
    g.__jayamaniBridgeHandler = createWebFetchHandler({
      ctx: buildHandlerContext(),
      bridgeSecret: getBridgeSecret(),
    });
  }
  return g.__jayamaniBridgeHandler;
}

/** Bridge instance for Easebuzz webhook → DollerpayX callback forwarding. */
export function getBossPayBridge(): BossPayBridge {
  if (!g.__jayamaniBossPayBridge) {
    g.__jayamaniBossPayBridge = createBossPayBridge({
      bridgeSecret: getBridgeSecret(),
      bosspayApiBase: trimEnv(process.env.BOSSPAY_API_BASE) || DEFAULT_API_BASE,
      handlers: buildHandlerContext().handlers,
      txnStore: buildTxnStore(),
      version: "1.0.0",
    });
  }
  return g.__jayamaniBossPayBridge;
}
