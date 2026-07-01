/**
 * Easebuzz UPI-intent mint + status + webhook verification for the DollerpayX
 * bridge.
 *
 * Easebuzz is a plaintext JSON/REST PG (no encrypted SPA, no HTML scraping).
 * The `upi://pay?...` deeplink is produced by a two-call server-to-server
 * chain, both driven from THIS bridge host (the lender's Easebuzz merchant
 * key/salt live here, never on the DollerpayX backend):
 *
 *   1. POST `${payBase}/payment/initiateLink`         → `access_key`
 *      (application/x-www-form-urlencoded, SHA-512 request hash)
 *   2. POST `${payBase}/webservice/submitInitiatePayment/` → `qr_link`
 *      (multipart/form-data, `paymentoption=upiview` + `upiQR=true`)
 *
 * Status is pulled with the Transaction (retrieve) API; the async S2S webhook
 * (configured in the Easebuzz dashboard → Account Settings → Webhook) is
 * verified with the PayU-style reverse hash and forwarded to DollerpayX.
 *
 * All hash sequences mirror the official `paywitheasebuzz-php-lib`:
 *   - request : key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt
 *   - retrieve: key|txnid|amount|email|phone|salt
 *   - reverse : salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
 */
import { createHash } from 'node:crypto';
function basesFor(env) {
    return env === 'prod'
        ? { pay: 'https://pay.easebuzz.in', dashboard: 'https://dashboard.easebuzz.in' }
        : { pay: 'https://testpay.easebuzz.in', dashboard: 'https://testdashboard.easebuzz.in' };
}
const INITIATE_HASH_SEQUENCE = [
    'key',
    'txnid',
    'amount',
    'productinfo',
    'firstname',
    'email',
    'udf1',
    'udf2',
    'udf3',
    'udf4',
    'udf5',
    'udf6',
    'udf7',
    'udf8',
    'udf9',
    'udf10',
];
const REVERSE_HASH_SEQUENCE = [
    'udf10',
    'udf9',
    'udf8',
    'udf7',
    'udf6',
    'udf5',
    'udf4',
    'udf3',
    'udf2',
    'udf1',
    'email',
    'firstname',
    'productinfo',
    'amount',
    'txnid',
    'key',
];
function sha512(input) {
    return createHash('sha512').update(input).digest('hex').toLowerCase();
}
/** Request hash for `initiateLink` (PayU-style forward hash). */
export function buildInitiateHash(params, salt) {
    const joined = INITIATE_HASH_SEQUENCE.map((f) => params[f] ?? '').join('|');
    return sha512(`${joined}|${salt}`);
}
/** Request hash for the Transaction (retrieve) API. */
export function buildRetrieveHash(params, salt) {
    const joined = [params.key, params.txnid, params.amount, params.email, params.phone].join('|');
    return sha512(`${joined}|${salt}`);
}
/**
 * Reverse hash for response / webhook verification. `payload` is the raw
 * Easebuzz response object (form-decoded webhook fields or retrieve `msg`).
 */
export function buildReverseHash(payload, salt) {
    const head = `${salt}|${payload['status'] ?? ''}`;
    const tail = REVERSE_HASH_SEQUENCE.map((f) => payload[f] ?? '').join('|');
    return sha512(`${head}|${tail}`);
}
/** Timing-independent-enough hex compare (lengths are fixed sha512 hex). */
export function verifyEasebuzzReverseHash(payload, salt) {
    const provided = String(payload['hash'] ?? '').toLowerCase();
    if (provided.length !== 128)
        return false;
    return buildReverseHash(payload, salt) === provided;
}
/** Convert integer paisa → Easebuzz rupee string (`"500.00"`). */
function paisaToRupeeString(paisa) {
    return (Math.round(paisa) / 100).toFixed(2);
}
/** Strip non-digits and cap to a 10-digit Indian mobile (best effort). */
function normalizePhone(raw) {
    const digits = (raw ?? '').replace(/\D/g, '');
    if (digits.length > 10)
        return digits.slice(-10);
    return digits || '9999999999';
}
function ensureEmail(raw) {
    const trimmed = (raw ?? '').trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : 'customer@dpxreal.com';
}
function ensureName(raw) {
    const cleaned = (raw ?? '').replace(/[^A-Za-z]/g, '');
    return cleaned || 'Customer';
}
/**
 * Build the Easebuzz `txnid` for a DollerpayX transaction. Easebuzz requires a
 * merchant-unique alphanumeric id; the DPX UUID (36 chars, dashes) is unsuitable
 * so we derive a compact, unique value and return it as the bridge
 * `pg_transaction_id`. The same value is what Easebuzz echoes in its webhook,
 * so webhook → DPX txn resolution stays stable.
 */
export function makeEasebuzzTxnId(dpxTxnId) {
    const base = (dpxTxnId ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
    const suffix = Date.now().toString(36).slice(-5).toUpperCase();
    return `DPX${base}${suffix}`;
}
/** Step 1 — POST `/payment/initiateLink` → `access_key` + hosted payment URL. */
export async function initiateEasebuzzLink(input) {
    const { config } = input;
    const bases = basesFor(config.env);
    const params = {
        key: config.key,
        txnid: input.txnid,
        amount: input.amount,
        productinfo: input.productinfo,
        firstname: input.firstname,
        email: input.email,
        phone: input.phone,
    };
    params['hash'] = buildInitiateHash({ ...params }, config.salt);
    const body = new URLSearchParams(params).toString();
    let res;
    try {
        res = await fetch(`${bases.pay}/payment/initiateLink`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body,
        });
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const text = await res.text().catch(() => '');
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        return { ok: false, error: `non-JSON initiateLink response (HTTP ${res.status})`, raw: text };
    }
    const status = json['status'];
    const data = json['data'];
    // Success shape: { status: 1, data: "<access_key>" }
    if ((status === 1 || status === '1' || status === true) && typeof data === 'string' && data) {
        return {
            ok: true,
            accessKey: data,
            paymentUrl: `${bases.pay}/pay/${data}`,
            raw: json,
        };
    }
    return {
        ok: false,
        error: typeof data === 'string' ? data : `initiateLink failed (status=${String(status)})`,
        raw: json,
    };
}
/**
 * Step 2 — POST `/webservice/submitInitiatePayment/` (multipart) → `qr_link`
 * (`upi://pay?...`). Empty `upiVA` + `upiQR=true` selects the intent/QR path.
 */
export async function submitEasebuzzInitiatePayment(input) {
    const bases = basesFor(input.config.env);
    const form = new FormData();
    form.set('paymentoption', 'upiview');
    form.set('access_key', input.accessKey);
    form.set('upiVA', '');
    form.set('upiQR', 'true');
    // Device metadata — Easebuzz accepts neutral values for server-side mint.
    form.set('deviceIdentifier', 'dollerpayx-bridge');
    form.set('canvasFingerprint', '');
    let res;
    try {
        res = await fetch(`${bases.pay}/webservice/submitInitiatePayment/`, {
            method: 'POST',
            body: form,
        });
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const text = await res.text().catch(() => '');
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        return {
            ok: false,
            error: `non-JSON submitInitiatePayment response (HTTP ${res.status})`,
            raw: text,
        };
    }
    const qrLink = json['qr_link'];
    if (typeof qrLink === 'string' && qrLink.toLowerCase().startsWith('upi://')) {
        return { ok: true, upiIntent: qrLink, raw: json };
    }
    return {
        ok: false,
        error: typeof json['message'] === 'string' ? json['message'] : 'no qr_link in response',
        raw: json,
    };
}
/** Full mint chain: initiateLink → submitInitiatePayment. */
export async function mintEasebuzzUpiIntent(input) {
    const initiated = await initiateEasebuzzLink(input);
    if (!initiated.ok || !initiated.accessKey || !initiated.paymentUrl) {
        return { ok: false, error: initiated.error ?? 'initiateLink failed', txnid: input.txnid };
    }
    const submitted = await submitEasebuzzInitiatePayment({
        config: input.config,
        accessKey: initiated.accessKey,
    });
    return {
        ok: true,
        paymentUrl: initiated.paymentUrl,
        ...(submitted.ok && submitted.upiIntent ? { upiIntent: submitted.upiIntent } : {}),
        txnid: input.txnid,
    };
}
/** Map an Easebuzz transaction-status string onto the bridge's normalized enum. */
export function mapEasebuzzStatus(raw) {
    const s = (raw ?? '').toLowerCase();
    if (s === 'success')
        return 'success';
    if (s === 'pending' || s === 'initiated' || s === 'in progress')
        return 'pending';
    return 'failed';
}
/** Transaction (retrieve) API — pull the authoritative status for a `txnid`. */
export async function retrieveEasebuzzTransaction(input) {
    const { config } = input;
    const bases = basesFor(config.env);
    const params = {
        key: config.key,
        txnid: input.txnid,
        amount: input.amount,
        email: input.email,
        phone: input.phone,
    };
    params['hash'] = buildRetrieveHash({ key: config.key, txnid: input.txnid, amount: input.amount, email: input.email, phone: input.phone }, config.salt);
    let res;
    try {
        res = await fetch(`${bases.dashboard}/transaction/v1/retrieve`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(params).toString(),
        });
    }
    catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    const text = await res.text().catch(() => '');
    let json;
    try {
        json = JSON.parse(text);
    }
    catch {
        return { ok: false, error: `non-JSON retrieve response (HTTP ${res.status})`, raw: text };
    }
    // Easebuzz returns the txn under `msg` (sometimes `data`). Both are handled.
    const detail = (json['msg'] && typeof json['msg'] === 'object' ? json['msg'] : json['data']) ?? undefined;
    if (!detail || typeof detail !== 'object') {
        return { ok: false, error: 'retrieve returned no transaction detail', raw: json };
    }
    const d = detail;
    const statusText = typeof d['status'] === 'string' ? d['status'] : '';
    const amountRupees = Number(d['amount'] ?? 0);
    const amountPaisa = Number.isFinite(amountRupees) ? Math.round(amountRupees * 100) : 0;
    return { ok: true, statusText, amountPaisa, raw: json };
}
/**
 * Build the lender's `easebuzz` PGHandlers for `@dpx/bridge-node`.
 *
 * `createCollection` mints the UPI intent synchronously and returns it on
 * `upi_intent_url`, so DollerpayX classifies the PG as `collection_url_type:
 * 'deeplink'` and trusts the deeplink directly (no splash-page mining).
 *
 * `checkStatus` calls the Transaction (retrieve) API. It needs the exact
 * `amount`/`email`/`phone` used at initiate time to satisfy the retrieve hash;
 * those are kept in an in-process map populated by `createCollection`. For
 * single-instance lender bridges (the common deployment) this is sufficient;
 * the dashboard webhook is the authoritative push path and needs no stored
 * state because the reverse-hash payload carries every field.
 */
export function createEasebuzzHandlers(config) {
    const productinfo = config.productinfo ?? 'DollerpayX Collection';
    const retrieveParams = new Map();
    return {
        createCollection: async (req) => {
            const txnid = makeEasebuzzTxnId(req.txn_id);
            const amount = paisaToRupeeString(req.amount);
            const email = ensureEmail(req.customer_email);
            const phone = normalizePhone(req.customer_phone);
            const firstname = ensureName(req.payer_first_name);
            const mint = await mintEasebuzzUpiIntent({
                config,
                txnid,
                amount,
                firstname,
                email,
                phone,
                productinfo,
            });
            if (!mint.ok || !mint.paymentUrl) {
                throw new Error(`Easebuzz mint failed: ${mint.error ?? 'unknown error'}`);
            }
            retrieveParams.set(txnid, { amount, email, phone });
            return {
                payment_url: mint.paymentUrl,
                pg_transaction_id: txnid,
                mode: 's2s',
                ...(mint.upiIntent ? { upi_intent_url: mint.upiIntent } : {}),
            };
        },
        checkStatus: async (req) => {
            const params = retrieveParams.get(req.pg_txn_id);
            if (!params) {
                // No stored retrieve params (e.g. after a restart) — defer to the
                // authoritative webhook rather than send a hash-mismatching retrieve.
                return { status: 'pending', pg_transaction_id: req.pg_txn_id, amount: 0 };
            }
            const result = await retrieveEasebuzzTransaction({
                config,
                txnid: req.pg_txn_id,
                amount: params.amount,
                email: params.email,
                phone: params.phone,
            });
            if (!result.ok) {
                return { status: 'pending', pg_transaction_id: req.pg_txn_id, amount: 0 };
            }
            return {
                status: mapEasebuzzStatus(result.statusText ?? ''),
                pg_transaction_id: req.pg_txn_id,
                amount: result.amountPaisa ?? 0,
                ...(result.raw ? { raw_pg_response: result.raw } : {}),
            };
        },
        isAvailable: async () => Boolean(config.key && config.salt),
    };
}
/**
 * Verify an Easebuzz S2S webhook (form-decoded into `payload`) and forward the
 * terminal outcome to DollerpayX via `forwardCallback` (the bridge's
 * `forwardBossPayCallback`). Throws on a hash mismatch so the caller returns a
 * non-200 and Easebuzz retries. Non-terminal (`pending`) webhooks are ignored.
 */
export async function handleEasebuzzWebhook(payload, deps) {
    if (!verifyEasebuzzReverseHash(payload, deps.salt)) {
        throw new Error('Easebuzz webhook reverse-hash verification failed');
    }
    const txnid = String(payload['txnid'] ?? '');
    const mapped = mapEasebuzzStatus(String(payload['status'] ?? ''));
    if (mapped === 'pending') {
        return { outcome: 'ignored', status: mapped, txnid };
    }
    const amountRupees = Number(payload['amount'] ?? 0);
    const amountPaisa = Number.isFinite(amountRupees) ? Math.round(amountRupees * 100) : 0;
    await deps.forwardCallback({
        pgType: 'easebuzz',
        pgTransactionId: txnid,
        payload: {
            status: mapped === 'success' ? 'success' : 'failed',
            pg_transaction_id: txnid,
            amount: amountPaisa,
            metadata: {
                easepayid: payload['easepayid'] ?? '',
                mode: payload['mode'] ?? '',
                bank_ref_num: payload['bank_ref_num'] ?? '',
                easebuzz_status: payload['status'] ?? '',
            },
        },
    });
    return { outcome: 'forwarded', status: mapped, txnid };
}
//# sourceMappingURL=easebuzzMint.js.map