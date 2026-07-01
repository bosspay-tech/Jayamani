/**
 * AirPay UPI-intent direct-mint helper — Node edition.
 *
 * Mirrors [`plugins/dollerpayx-bridge/includes/class-airpay-handler.php`](plugins/dollerpayx-bridge/includes/class-airpay-handler.php)
 * (`direct_mint_upi_intent`) line-for-line. Three POSTs to AirPay, a static
 * SPA-bundle cipher, and a JWT chain:
 *
 *   1. **Stage A** — POST `/pay/v4/index.php?token=<endpoint_token>` with the
 *      `merchant_id` + `encdata` + `checksum` + `privatekey` form fields the
 *      AirPay WC plugin already builds. Response is HTML (NOT a 302); the
 *      initial Bearer JWT lives at `<body data-token="…">`.
 *   2. **Stage B** — POST `/pay/payment_api.php` with
 *      `Authorization: Bearer <Stage-A token>` and an encrypted body of
 *      `{api_action:"config", is_mobile:true, api_type:"web"}`. The decrypted
 *      response carries a refreshed `response.token` used by Stage C.
 *   3. **Stage C** — POST `/pay/payment_api.php` with
 *      `Authorization: Bearer <Stage-B token>` and an encrypted body of
 *      `{api_action:"payment", chmod:"upi", action:"makePayment",
 *        sub_mode:"intent", customer_mobile_code, customer_mobile,
 *        upi_app:"other", api_type:"web"}`. The decrypted response holds the
 *      `upi://pay?…` deeplink at `response.next_action.url`.
 *
 * The cipher used for `encRequest` / `encResponse` is recovered from AirPay's
 * SPA bundle (chunks_37.js lines 1788-1792 — see
 * docs/AIRPAY-OFFLINE-DECOMPILE.md). Definition:
 *
 *   m = [1, 9, 18, 16, 1, 25]
 *   encrypt(plain): reverse plain, then byte[i] += m[i % 6] (mod 256), base64.
 *   decrypt(b64):   base64-decode, then byte[i] -= m[i % 6] (mod 256), reverse.
 *
 * The key is hardcoded in AirPay's SPA — same constant for every merchant on
 * the platform — so no per-MID configuration is required.
 *
 * No external deps; uses the platform `fetch` (Node 18+, Bun, Deno, Workers).
 */
const AIRPAY_API_URL = 'https://payments.airpay.co.in/pay/payment_api.php';
/** Static cipher key recovered from AirPay's SPA bundle. */
const SESSION_CIPHER_KEY = [1, 9, 18, 16, 1, 25];
const MOBILE_CHROME_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36';
const AIRPAY_MOBILE_BASE_HEADERS = {
    'user-agent': MOBILE_CHROME_UA,
    'accept-language': 'en-IN,en;q=0.9,hi;q=0.8',
    'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-site': 'same-origin',
};
function airpayInitMobileHeaders() {
    return {
        ...AIRPAY_MOBILE_BASE_HEADERS,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-dest': 'document',
        'sec-fetch-user': '?1',
    };
}
function airpayJsonMobileHeaders(bearer) {
    return {
        ...AIRPAY_MOBILE_BASE_HEADERS,
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        authorization: `Bearer ${bearer}`,
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
    };
}
/**
 * Encrypt an AirPay payment_api payload. Exported for unit tests; not part of
 * the public bridge surface.
 */
export function airpaySessionEncrypt(plaintext) {
    if (plaintext === '')
        return '';
    // The reference impl in the SPA does
    //   `s.split("").reverse().map((c, i) => fromCharCode(c.charCodeAt(0) + m[i%6])).join("")`
    // then `btoa(...)`. We use Buffer here for byte-correct output on UTF-8 inputs.
    const bytes = Buffer.from(plaintext, 'utf8');
    const reversed = Buffer.from(bytes).reverse();
    const shifted = Buffer.alloc(reversed.length);
    // Loop bound + the key tuple's `as const` typing make the bracket reads safe
    // at runtime; the explicit `as number` casts satisfy `noUncheckedIndexedAccess`.
    for (let i = 0; i < reversed.length; i += 1) {
        const b = reversed[i];
        const k = SESSION_CIPHER_KEY[i % SESSION_CIPHER_KEY.length];
        shifted[i] = (b + k) & 0xff;
    }
    return shifted.toString('base64');
}
/**
 * Decrypt an AirPay payment_api response. Returns `''` on any decode error
 * (caller treats empty string as a session-decrypt failure).
 */
export function airpaySessionDecrypt(b64) {
    if (b64 === '')
        return '';
    let blob;
    try {
        blob = Buffer.from(b64, 'base64');
    }
    catch {
        return '';
    }
    if (blob.length === 0)
        return '';
    const shifted = Buffer.alloc(blob.length);
    for (let i = 0; i < blob.length; i += 1) {
        const b = blob[i];
        const k = SESSION_CIPHER_KEY[i % SESSION_CIPHER_KEY.length];
        shifted[i] = (b - k + 256) & 0xff;
    }
    return Buffer.from(shifted).reverse().toString('utf8');
}
/**
 * Extract the initial Bearer JWT from `<body data-token="…">` in the HTML
 * AirPay returns from the Stage-A POST. Exported for unit tests.
 */
export function extractDataToken(html) {
    if (!html)
        return '';
    // `[\s\S]` lets the regex span newlines, since the body tag often holds many
    // attributes and the data-token may not be on the first line.
    const m = html.match(/<body\b[^>]*\bdata-token=(["'])([\s\S]*?)\1/i);
    return m?.[2] ?? '';
}
function extractTrFromDeeplink(upiQrValue) {
    try {
        const qIdx = upiQrValue.indexOf('?');
        if (qIdx < 0)
            return '';
        const params = new URLSearchParams(upiQrValue.slice(qIdx + 1));
        return params.get('tr') ?? '';
    }
    catch {
        return '';
    }
}
async function fetchWithTimeout(url, init, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: ctrl.signal });
    }
    finally {
        clearTimeout(t);
    }
}
function bodySnippet(body) {
    const collapsed = body.replace(/\s+/g, ' ').trim();
    return collapsed.length > 300 ? collapsed.slice(0, 300) + '…' : collapsed;
}
/**
 * Drive the full AirPay UPI-intent mint server-side. Pure function; safe to
 * call from any runtime with `fetch` (Node 18+, Bun, Deno, Workers).
 */
export async function directMintAirpayUpiIntent(inputs) {
    const start = Date.now();
    const timeoutMs = inputs.timeoutMs ?? 8000;
    if (!inputs.merchantId || !inputs.encdata || !inputs.checksum || !inputs.privatekey) {
        return {
            ok: false,
            stage: 'init',
            error: 'missing_inputs (merchantId/encdata/checksum/privatekey)',
        };
    }
    if (!inputs.customerMobile || !/^\d{6,15}$/.test(inputs.customerMobile)) {
        return {
            ok: false,
            stage: 'init',
            error: 'invalid_customer_mobile (digits only)',
        };
    }
    const customerMobileCode = inputs.customerMobileCode ?? '91';
    // -- Stage A: init POST → HTML body with `<body data-token="<JWT>">` ------
    const form = new URLSearchParams();
    form.set('privatekey', inputs.privatekey);
    form.set('merchant_id', inputs.merchantId);
    form.set('encdata', inputs.encdata);
    form.set('checksum', inputs.checksum);
    form.set('chmod', inputs.chmod ?? '');
    let stageBToken = '';
    try {
        const initRes = await fetchWithTimeout(inputs.initUrl, {
            method: 'POST',
            headers: airpayInitMobileHeaders(),
            body: form.toString(),
            redirect: 'manual',
        }, timeoutMs);
        if (initRes.status >= 400) {
            const body = await initRes.text().catch(() => '');
            return {
                ok: false,
                stage: 'init',
                error: `init non-2xx (http=${initRes.status}, body=${bodySnippet(body)})`,
            };
        }
        const html = await initRes.text();
        stageBToken = extractDataToken(html);
        if (!stageBToken) {
            return {
                ok: false,
                stage: 'init',
                error: 'no_data_token_in_html (AirPay init must return <body data-token="…">)',
            };
        }
    }
    catch (err) {
        return {
            ok: false,
            stage: 'init',
            error: `init network error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    // -- Stage B: payment_api `api_action=config` -----------------------------
    // Recovered from the live trace: this is the SPA's first XHR after page load.
    // Returns merchant config + a refreshed JWT in `response.token` for Stage C.
    const stageBPayload = JSON.stringify({
        api_action: 'config',
        is_mobile: true,
        api_type: 'web',
    });
    const stageBEnc = airpaySessionEncrypt(stageBPayload);
    let stageBEncResponse = '';
    let stageCToken = '';
    try {
        const r = await fetchWithTimeout(AIRPAY_API_URL, {
            method: 'POST',
            headers: airpayJsonMobileHeaders(stageBToken),
            body: JSON.stringify({ xApiType: 'web', encRequest: stageBEnc }),
            redirect: 'manual',
        }, timeoutMs);
        if (r.status !== 200) {
            const body = await r.text().catch(() => '');
            return {
                ok: false,
                stage: 'bootstrap',
                error: `bootstrap non-200 (http=${r.status}, body=${bodySnippet(body)})`,
            };
        }
        const envelope = (await r.json().catch(() => ({})));
        stageBEncResponse = typeof envelope.encResponse === 'string' ? envelope.encResponse : '';
        const plain = airpaySessionDecrypt(stageBEncResponse);
        if (!plain) {
            return {
                ok: false,
                stage: 'bootstrap',
                error: 'session_decrypt_failed',
                encResponses: [stageBEncResponse],
            };
        }
        let parsed;
        try {
            parsed = JSON.parse(plain);
        }
        catch {
            return {
                ok: false,
                stage: 'bootstrap',
                error: `bootstrap non-JSON plaintext: ${plain.slice(0, 200)}`,
                encResponses: [stageBEncResponse],
            };
        }
        const obj = parsed;
        if (typeof obj.response?.token === 'string' && obj.response.token.length > 0) {
            stageCToken = obj.response.token;
        }
        else {
            // Fall back to the bootstrap token; AirPay sometimes omits the refresh.
            // Stage C fails with 401 if this is wrong, surfaced via encResponses.
            stageCToken = stageBToken;
        }
    }
    catch (err) {
        return {
            ok: false,
            stage: 'bootstrap',
            error: `bootstrap network error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    // -- Stage C: payment_api `api_action=payment` (UPI INTENT mint) ---------
    const stageCPayload = JSON.stringify({
        api_action: 'payment',
        chmod: 'upi',
        action: 'makePayment',
        sub_mode: 'intent',
        customer_mobile_code: customerMobileCode,
        customer_mobile: inputs.customerMobile,
        upi_app: 'other',
        api_type: 'web',
    });
    const stageCEnc = airpaySessionEncrypt(stageCPayload);
    let stageCEncResponse = '';
    let upiQrValue = '';
    try {
        const r = await fetchWithTimeout(AIRPAY_API_URL, {
            method: 'POST',
            headers: airpayJsonMobileHeaders(stageCToken),
            body: JSON.stringify({ xApiType: 'web', encRequest: stageCEnc }),
            redirect: 'manual',
        }, timeoutMs);
        if (r.status !== 200) {
            const body = await r.text().catch(() => '');
            return {
                ok: false,
                stage: 'upi_intent_select',
                error: `upi_intent_select non-200 (http=${r.status}, body=${bodySnippet(body)})`,
                encResponses: [stageBEncResponse],
            };
        }
        const envelope = (await r.json().catch(() => ({})));
        stageCEncResponse = typeof envelope.encResponse === 'string' ? envelope.encResponse : '';
        const plain = airpaySessionDecrypt(stageCEncResponse);
        if (!plain) {
            return {
                ok: false,
                stage: 'upi_intent_select',
                error: 'session_decrypt_failed',
                encResponses: [stageBEncResponse, stageCEncResponse],
            };
        }
        // Prefer JSON path; regex is the resilience fallback.
        try {
            const parsed = JSON.parse(plain);
            const url = parsed.response?.next_action?.url;
            if (typeof url === 'string' && /^upi:\/\//i.test(url)) {
                upiQrValue = url;
            }
        }
        catch {
            /* fall through to regex */
        }
        if (!upiQrValue) {
            const m = plain.match(/upi:\/\/pay\?[^\s"'<>]+/i);
            if (m)
                upiQrValue = m[0];
        }
        if (!upiQrValue) {
            return {
                ok: false,
                stage: 'upi_intent_select',
                error: `no_upi_in_response (plaintext_preview=${plain.slice(0, 200)})`,
                encResponses: [stageBEncResponse, stageCEncResponse],
            };
        }
    }
    catch (err) {
        return {
            ok: false,
            stage: 'upi_intent_select',
            error: `upi_intent_select network error: ${err instanceof Error ? err.message : String(err)}`,
            encResponses: [stageBEncResponse],
        };
    }
    const intentTr = extractTrFromDeeplink(upiQrValue);
    return {
        ok: true,
        upiQrValue,
        intentTr,
        pgTransactionId: intentTr,
        mintedAt: Math.floor(Date.now() / 1000),
        latencyMs: Date.now() - start,
    };
}
//# sourceMappingURL=airpayDirectMint.js.map