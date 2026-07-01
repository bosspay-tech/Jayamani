/**
 * Pure handler functions — one per bridge endpoint. Each takes the parsed
 * request (body string for POSTs, query + path params for GETs, pre-verified
 * signature), validates with Zod, and dispatches to the lender's PGHandlers.
 *
 * These are framework-agnostic: the web-fetch and Express adapters both
 * reuse them after normalizing the inbound request into the same shape.
 */
import { z } from 'zod';
import { BridgeError, CallbackPayloadSchema, CollectRequestSchema, CollectResultSchema, PayoutRequestSchema, PayoutResultSchema, StatusResultSchema, } from './types.js';
import { directMintUpiIntent } from './sabpaisaDirectMint.js';
import { mintAirpayV4Intent } from './airpayV4Mint.js';
import { emitBridgeEvents } from './bossPayEvents.js';
/** Resolve the PG handlers for a given pg_type; throw 400 when missing. */
function resolvePg(ctx, pgType) {
    const pg = ctx.handlers[pgType];
    if (!pg) {
        throw new BridgeError(400, 'PG_NOT_CONFIGURED', `Unknown pg_type: ${pgType}`);
    }
    return pg;
}
/**
 * Parse a JSON body with a Zod schema; rethrow as a 400 BridgeError on any failure.
 *
 * The signature is `<S extends z.ZodTypeAny>` rather than `<T>(schema: z.ZodType<T>)`
 * because `z.ZodType<T>` unifies `T` with the schema's *input* type, which breaks
 * when the schema uses `.transform()` / `.preprocess()` (output type drifts from
 * input). `z.infer<S>` always gives the post-validation output type, which is
 * what every caller here actually wants.
 */
function parseBody(schema, body) {
    let json;
    try {
        json = JSON.parse(body);
    }
    catch {
        throw new BridgeError(400, 'INVALID_JSON', 'Request body is not valid JSON');
    }
    try {
        return schema.parse(json);
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            const issue = err.errors[0];
            const path = issue?.path?.length ? issue.path.join('.') : 'body';
            throw new BridgeError(400, 'INVALID_REQUEST', `${path}: ${issue?.message ?? 'invalid'}`);
        }
        throw err;
    }
}
/**
 * POST /bosspay/v1/collect
 *
 * Mirrors [`class-bridge-api.php::handle_collect`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * After a successful provider call, persists the `pg_transaction_id` → BossPay
 * txn mapping so the lender's PG webhook can later look it up when forwarding
 * the async callback.
 */
export async function handleCollect(ctx, body) {
    const parsed = parseBody(CollectRequestSchema, body);
    const pg = resolvePg(ctx, parsed.pg_type);
    const raw = await pg.createCollection(parsed);
    const result = CollectResultSchema.parse(raw);
    // Stash the UPI-intent mint bag alongside the callback mapping so
    // `/upi/{txnId}` can rehydrate the mint inputs without re-calling the lender.
    // `upi_qr_value=''` / `minted_at=0` signal "never minted yet" — the first
    // visit to /upi/{txnId} will mint and then call setUpiIntent() to cache.
    const upiIntentRecord = result.upi_intent_mint_inputs
        ? {
            inputs: result.upi_intent_mint_inputs,
            upi_qr_value: '',
            intent_tr: '',
            minted_at: 0,
        }
        : undefined;
    await ctx.txnStore.set(result.pg_transaction_id, {
        txn_id: parsed.txn_id,
        pg_type: parsed.pg_type,
        callback_url: buildCallbackUrl(ctx.bosspayApiBase, parsed.pg_type, parsed.txn_id),
        ...(upiIntentRecord ? { upi_intent: upiIntentRecord } : {}),
    });
    return result;
}
/**
 * POST /bosspay/v1/payout
 *
 * Mirrors [`class-bridge-api.php::handle_payout`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * If the lender's handlers do not implement `createPayout`, respond with 501
 * so BossPay's payout engine sees a clean "not implemented" signal.
 */
export async function handlePayout(ctx, body) {
    const parsed = parseBody(PayoutRequestSchema, body);
    const pg = resolvePg(ctx, parsed.pg_type);
    if (!pg.createPayout) {
        throw new BridgeError(501, 'PAYOUT_NOT_IMPLEMENTED', `pg_type '${parsed.pg_type}' does not implement createPayout`);
    }
    const raw = await pg.createPayout(parsed);
    return PayoutResultSchema.parse(raw);
}
/**
 * GET /bosspay/v1/status/:pgTxnId?pg_type=…
 *
 * Mirrors [`class-bridge-api.php::handle_status`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Resolves `pg_type` in this order:
 *   1. TxnStore mapping keyed by `:pgTxnId` (primary: true PG id),
 *   2. TxnStore mapping keyed by BossPay UUID (when BossPay calls with its UUID),
 *   3. `?pg_type=` query parameter (fallback).
 */
export async function handleStatus(ctx, params) {
    let mapping = await ctx.txnStore.get(params.pgTxnId);
    let pgTxnId = params.pgTxnId;
    if (!mapping) {
        mapping = await ctx.txnStore.getByBosspayTxnId(params.pgTxnId);
    }
    const pgType = mapping?.pg_type ?? params.pgType ?? '';
    if (!pgType) {
        throw new BridgeError(400, 'PG_TYPE_UNRESOLVED', 'Cannot determine pg_type for this transaction');
    }
    const pg = resolvePg(ctx, pgType);
    const raw = await pg.checkStatus({ pg_type: pgType, pg_txn_id: pgTxnId });
    return StatusResultSchema.parse(raw);
}
/**
 * GET /bosspay/v1/health
 *
 * Mirrors [`class-bridge-api.php::handle_health`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Reports the list of configured `pg_type` keys and whether each one's
 * `isAvailable()` resolves truthy (defaults to `true` when not provided).
 */
export async function handleHealth(ctx) {
    const pgTypes = Object.keys(ctx.handlers).filter((k) => !!ctx.handlers[k]);
    const pgStatus = {};
    await Promise.all(pgTypes.map(async (pgType) => {
        const handler = ctx.handlers[pgType];
        if (!handler) {
            pgStatus[pgType] = false;
            return;
        }
        if (!handler.isAvailable) {
            pgStatus[pgType] = true;
            return;
        }
        try {
            pgStatus[pgType] = await handler.isAvailable();
        }
        catch {
            pgStatus[pgType] = false;
        }
    }));
    return {
        status: 'ok',
        version: ctx.version,
        enabled_pgs: pgTypes,
        pg_status: pgStatus,
    };
}
/* --------------------------------------------------------------------------
 * POST /dpx-airpay/v1/mint-airpay-v4 — AirPay v4 poll-first direct mint
 * ------------------------------------------------------------------------ */
const MintAirpayV4RequestSchema = z.object({
    merchant_id: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1),
    secret: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    orderid: z.string().min(1),
    amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
    buyer_email: z.string().min(1),
    buyer_phone: z.string().min(1),
    buyer_firstname: z.string().optional(),
    buyer_lastname: z.string().optional(),
    chmod: z.string().optional(),
    /**
     * Lender bridge origin override — when DPX knows the lender's portal-
     * whitelisted domain (e.g. an explicit `airpay_source_domain` credential
     * on the lender_pg row) it can pass it here. Falls back to
     * `ctx.airpayV4SourceDomain`.
     */
    source_domain: z.string().url().optional(),
});
/**
 * Body-only POST. DPX HMAC-signs the JSON; we validate, call
 * {@link mintAirpayV4Intent} (which does the server-side POST to AirPay
 * from the bridge's whitelisted origin), and return the parsed URLs.
 * Always 200 OK at the HTTP layer — `ok: false` lives in the JSON
 * body so the WordPress / Express / Edge starters can log and surface
 * it uniformly.
 */
export async function handleMintAirpayV4(ctx, body) {
    const parsed = parseBody(MintAirpayV4RequestSchema, body);
    const sourceDomain = parsed.source_domain ?? ctx.airpayV4SourceDomain;
    if (!sourceDomain) {
        return {
            ok: false,
            stage: 'validate',
            orderid: parsed.orderid,
            error: 'source_domain not configured (set `ctx.airpayV4SourceDomain` on the bridge or pass `source_domain` in the request body)',
        };
    }
    const result = await mintAirpayV4Intent({
        creds: {
            merchantId: parsed.merchant_id,
            username: parsed.username,
            password: parsed.password,
            secret: parsed.secret,
            clientId: parsed.client_id,
            clientSecret: parsed.client_secret,
        },
        buyer: {
            orderid: parsed.orderid,
            amountInr: parsed.amount,
            email: parsed.buyer_email,
            phone: parsed.buyer_phone,
            ...(parsed.buyer_firstname ? { firstName: parsed.buyer_firstname } : {}),
            ...(parsed.buyer_lastname ? { lastName: parsed.buyer_lastname } : {}),
            ...(parsed.chmod ? { chmod: parsed.chmod } : {}),
        },
        sourceDomain,
    });
    if (!result.ok) {
        return {
            ok: false,
            stage: result.stage,
            orderid: parsed.orderid,
            error: result.error,
        };
    }
    return {
        ok: true,
        orderid: parsed.orderid,
        upi_intent_url: result.upiIntentUrl,
        hosted_page_url: result.hostedPageUrl,
        ap_transactionid: result.apTransactionId,
        raw: {
            status: result.raw.status,
            location: result.raw.location,
            body_snippet: result.raw.bodySnippet,
            sent_orderid: result.raw.sentOrderid,
        },
    };
}
/* --------------------------------------------------------------------------
 * POST /dpx-airpay/v1/proxy — AirPay egress forward-proxy (ADR-024)
 *
 * For AirPay MIDs whose account enables a per-MID IP allow-list bound to the
 * lender's own server, DPX cannot reach AirPay directly. DPX still owns the
 * ENTIRE flow — OAuth key derivation, the byte-shift session cipher,
 * checksum + privatekey, status mapping — and only relays the raw HTTP here
 * so it egresses from THIS (whitelisted) host's IP.
 *
 * The bridge is a dumb relay: it does NOT understand the cipher and cannot
 * mint on its own. It is hardened with a strict host allow-list so a leaked
 * bridge secret can never be turned into a general-purpose SSRF proxy — only
 * `*.airpay.co.in` targets are reachable.
 * ------------------------------------------------------------------------ */
const AirpayProxyRequestSchema = z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST']),
    headers: z.record(z.string()).default({}),
    body: z.string().default(''),
    redirect: z.enum(['follow', 'manual']).default('follow'),
    timeout_ms: z.number().int().positive().max(60_000).default(10_000),
});
/** Hosts the proxy is allowed to reach. Defence-in-depth against SSRF even
 *  with a valid HMAC signature — AirPay is the only legitimate target. */
const AIRPAY_PROXY_ALLOWED_HOST_SUFFIX = '.airpay.co.in';
function isAllowedAirpayHost(rawUrl) {
    try {
        const u = new URL(rawUrl);
        if (u.protocol !== 'https:')
            return false;
        const host = u.hostname.toLowerCase();
        return host === 'airpay.co.in' || host.endsWith(AIRPAY_PROXY_ALLOWED_HOST_SUFFIX);
    }
    catch {
        return false;
    }
}
/**
 * Relay one AirPay request from the bridge's whitelisted IP. Returns the
 * upstream `{ status, body }` verbatim — DPX does all parsing/decryption.
 * Throws a 502 `BridgeError` for a disallowed host or upstream network
 * failure so DPX's transport maps it onto its existing `*_network` paths.
 */
export async function handleAirpayProxy(_ctx, body) {
    const parsed = parseBody(AirpayProxyRequestSchema, body);
    if (!isAllowedAirpayHost(parsed.url)) {
        throw new BridgeError(502, 'PROXY_HOST_NOT_ALLOWED', `proxy target must be an https *.airpay.co.in host (got: ${parsed.url.slice(0, 80)})`);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), parsed.timeout_ms);
    try {
        const res = await fetch(parsed.url, {
            method: parsed.method,
            headers: parsed.headers,
            ...(parsed.method === 'POST' ? { body: parsed.body } : {}),
            redirect: parsed.redirect,
            signal: ctrl.signal,
        });
        const text = await res.text().catch(() => '');
        return { status: res.status, body: text };
    }
    catch (err) {
        throw new BridgeError(502, 'PROXY_UPSTREAM_FAILED', `AirPay upstream fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    finally {
        clearTimeout(timer);
    }
}
/* --------------------------------------------------------------------------
 * Callback helper (invoked from lender's PG webhook via bridge.forwardCallback)
 * ------------------------------------------------------------------------ */
/** Build the canonical callback URL BossPay expects. */
export function buildCallbackUrl(apiBase, pgType, txnId) {
    const base = apiBase.replace(/\/+$/, '');
    return `${base}/callbacks/${encodeURIComponent(pgType)}/${encodeURIComponent(txnId)}`;
}
/* --------------------------------------------------------------------------
 * GET /bosspay/v1/upi/:txnId — SabPaisa UPI-intent splash + direct-mint
 * ------------------------------------------------------------------------ */
/** Max age of a cached deeplink before we re-mint. Mirrors WP v1.9.1 cache TTL. */
const UPI_INTENT_CACHE_TTL_SECONDS = 10 * 60;
/** Deduplicate concurrent GETs for the same txn (BossPay preheat + customer click). */
const upiIntentInflight = new Map();
/**
 * GET /bosspay/v1/upi/:txnId
 *
 * Cache-first render of the SabPaisa UPI-intent deeplink splash. Mirrors
 * [`class-bridge-api.php::handle_upi_intent`](plugins/bosspay-bridge/includes/class-bridge-api.php)
 * (WP v1.9.1) line-for-line, including the 10-minute cache TTL that sidesteps
 * SabPaisa's single-use `sabPaisaInit` binding.
 *
 * Throws:
 *   - 404 if `txnId` has no mapping (or no UPI-intent bag stashed).
 *   - 500 if the fresh mint fails (body carries SabPaisa's snippet verbatim).
 */
export async function handleUpiIntent(ctx, params) {
    let inflight = upiIntentInflight.get(params.txnId);
    if (!inflight) {
        inflight = handleUpiIntentImpl(ctx, params);
        upiIntentInflight.set(params.txnId, inflight);
        void inflight.finally(() => {
            upiIntentInflight.delete(params.txnId);
        });
    }
    return inflight;
}
async function handleUpiIntentImpl(ctx, params) {
    const mapping = await ctx.txnStore.getByBosspayTxnId(params.txnId);
    if (!mapping || !mapping.upi_intent) {
        throw new BridgeError(404, 'UPI_INTENT_NOT_FOUND', `No UPI-intent mint inputs for txn_id=${params.txnId}`);
    }
    const jlog = (events) => {
        if (ctx.bridgeSecret) {
            emitBridgeEvents({
                bosspayApiBase: ctx.bosspayApiBase,
                bridgeSecret: ctx.bridgeSecret,
                txnId: params.txnId,
                events,
            });
        }
    };
    jlog([{ event: 'bridge_upi_get_received', details: { bridge: 'node' } }]);
    const nowSec = Math.floor(Date.now() / 1000);
    const cacheAgeSec = mapping.upi_intent.minted_at > 0 ? nowSec - mapping.upi_intent.minted_at : Infinity;
    const cachedQr = mapping.upi_intent.upi_qr_value;
    const cacheFresh = cachedQr.length > 0 &&
        cachedQr.toLowerCase().startsWith('upi://pay?') &&
        cacheAgeSec < UPI_INTENT_CACHE_TTL_SECONDS;
    let upiQrValue = '';
    let intentTr = '';
    let mintMs = 0;
    let source = 'mint';
    if (cacheFresh) {
        upiQrValue = cachedQr;
        intentTr = mapping.upi_intent.intent_tr;
        source = 'cache';
        jlog([{ event: 'bridge_cache_hit', details: { source: 'node_txn_store' } }]);
    }
    else {
        jlog([{ event: 'bridge_cache_miss', details: {} }]);
        const mintInputs = mapping.upi_intent.inputs;
        const mintStart = Date.now();
        const mint = await directMintUpiIntent({
            initUrl: mintInputs.action_url,
            encData: mintInputs.enc_data,
            clientCode: mintInputs.client_code,
            clientTxnId: mintInputs.client_txn_id,
            amountRupees: mintInputs.amount_rupees,
            email: mintInputs.email,
            phone: mintInputs.phone,
            clientId: mintInputs.sabpaisa_client_id,
            clientName: mintInputs.sabpaisa_client_name,
            endpointJson: mintInputs.sabpaisa_endpoint_json,
        });
        mintMs = Date.now() - mintStart;
        if (!mint.ok) {
            jlog([{ event: 'bridge_upi_mint_failed', details: { error: mint.error } }]);
            throw new BridgeError(500, 'UPI_INTENT_MINT_FAILED', `SabPaisa mint failed: ${mint.error}`);
        }
        jlog([{ event: 'bridge_upi_mint_ok', details: { mint_ms: mintMs } }]);
        upiQrValue = mint.upiQrValue;
        intentTr = mint.intentTr;
        if (ctx.txnStore.setUpiIntent) {
            await ctx.txnStore
                .setUpiIntent(params.txnId, {
                upi_qr_value: upiQrValue,
                intent_tr: intentTr,
                minted_at: mint.mintedAt,
            })
                .catch(() => {
                /* best-effort cache; a missed setUpiIntent just means the next visit
                   re-mints, which is still correct behavior. */
            });
        }
        source = 'mint';
    }
    const displayVpa = mapping.upi_intent.inputs.display_vpa ?? '';
    const displayPayee = mapping.upi_intent.inputs.display_payee_name ?? '';
    const amountRupees = mapping.upi_intent.inputs.amount_rupees.toFixed(2);
    jlog([{ event: 'bridge_upi_served', details: { source, mint_ms: mintMs } }]);
    return {
        html: renderUpiIntentSplash(upiQrValue, {
            amountRupees,
            displayVpa,
            displayPayee,
        }),
        source,
        mintMs,
        intentTr,
    };
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderUpiIntentSplash(upiQrValue, display) {
    const safeQr = escapeHtml(upiQrValue);
    const jsQr = JSON.stringify(upiQrValue);
    const amt = escapeHtml(display.amountRupees);
    const vpa = escapeHtml(display.displayVpa);
    const payee = escapeHtml(display.displayPayee);
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
<meta http-equiv="refresh" content="0; url=${safeQr}">
<title>Opening UPI app…</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{max-width:440px;width:100%;background:#1e293b;border-radius:16px;padding:32px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.4)}
  h1{font-size:20px;margin:0 0 8px;color:#f1f5f9}
  p{color:#94a3b8;font-size:14px;margin:4px 0}
  .amt{font-size:32px;font-weight:600;color:#60a5fa;margin:16px 0}
  .meta{background:#0f172a;border-radius:8px;padding:12px;margin-top:16px;font-size:12px}
  .meta b{color:#cbd5e1}
  a.btn{display:inline-block;margin-top:20px;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:500}
</style>
</head><body>
<div class="card">
  <h1>Opening your UPI app…</h1>
  <div class="amt">₹${amt}</div>
  <p>If your UPI app doesn't open automatically, tap the button below.</p>
  <a class="btn" href="${safeQr}">Open UPI app</a>
  <div class="meta">
    ${payee ? `<div><b>Payee:</b> ${payee}</div>` : ''}
    ${vpa ? `<div><b>VPA:</b> ${vpa}</div>` : ''}
  </div>
</div>
<script>
(function(){
  function beacon(ev,extra){
    try{
      var p=location.pathname||'';
      if(p.charAt(p.length-1)==='/')p=p.slice(0,-1);
      var u=p+'/beacon?e='+encodeURIComponent(ev);
      if(extra)u+='&d='+encodeURIComponent(JSON.stringify(extra));
      navigator.sendBeacon(u);
    }catch(_){}
  }
  beacon('page_loaded');
  window.addEventListener('beforeunload',function(){beacon('redirect_attempted');});
  document.addEventListener('visibilitychange',function(){
    beacon(document.hidden?'app_blur':'back_to_browser');
  });
})();
  // Immediate redirect — the meta-refresh is the fallback for browsers that
  // block top-frame script-driven navigation to non-http schemes.
  try { window.location.href = ${jsQr}; } catch (e) {}
</script>
</body></html>`;
}
/** Validate a forward-callback payload before signing + POSTing. */
export function validateCallbackPayload(payload) {
    return CallbackPayloadSchema.parse(payload);
}
//# sourceMappingURL=handlers.js.map