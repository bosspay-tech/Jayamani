/**
 * SabPaisa UPI-intent direct-mint helper — Node edition.
 *
 * Mirrors [`plugins/bosspay-bridge/includes/class-sabpaisa-handler.php`](plugins/bosspay-bridge/includes/class-sabpaisa-handler.php)
 * (`direct_mint_upi_intent`) line-for-line. Two POSTs to SabPaisa:
 *
 *   1. GET/POST `/SabPaisa/sabPaisaInit?v=1` — seeds a `JSESSIONID` cookie and
 *      registers the transaction slot. SabPaisa binds `encData` + `clientTxnId`
 *      to the session on this call; a second POST with the same payload is
 *      rejected with HTTP 500 + a generic HTML body.
 *   2. POST `/rest/intent/confirmintentupiV1` with the session cookie — mints
 *      the NPCI-registered `upi://pay?...` deeplink and returns it as JSON.
 *
 * The returned deeplink typically carries SabPaisa's routing VPA (e.g.
 * `DIGI84.SBP@ypbiz`) as `pa` and an 18-digit numeric `tr` that NPCI recognizes
 * for reconciliation. Caller must cache this per order for at least 10 minutes
 * to avoid re-triggering the single-use `sabPaisaInit` binding.
 *
 * No external deps; uses the platform `fetch` (Node 18+, Bun, Deno, Workers).
 */
/**
 * `confirmintentupiV1` validates `payMode` as the **full catalogue object**, not
 * a bare string. Probe capture 2026-04-22 (clientCode DIGI84) and the
 * production WordPress plugin (`includes/class-sabpaisa-handler.php`
 * `$upi_intent_mode`) both use this exact shape. Sending the bare string
 * `"UPI INTENT"` causes SabPaisa to silently respond HTTP 400 + empty body —
 * no JSON, no message — which is what bricked Hairport's deeplink pool
 * 2026-04-28 after the URL-prefix fix exposed Phase 2.
 */
const UPI_INTENT_PAY_MODE = {
    paymodeId: 15,
    paymodeType: 'online',
    paymodeName: 'UPI INTENT',
    active: true,
    performanceFlag: false,
};
const AMOUNT_TYPE = 'INR';
/**
 * Browser fingerprint string SabPaisa expects on the Phase-2 payload (mobile
 * UA persona). The WordPress plugin has shipped the same opaque value for
 * months without rejection. Format observed in the probe:
 * `<lang>|<colorDepth>|<screenH>|<screenW>|<timezoneOffsetHours>`.
 */
const MOBILE_BROWSER_DETAILS = 'en-US|24|844|390|0';
/** Mobile Chrome persona so SabPaisa sees a phone browser, not the Node/WordPress default UA. */
const MOBILE_CHROME_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36';
const SABPAISA_MOBILE_BASE_HEADERS = {
    'user-agent': MOBILE_CHROME_UA,
    'accept-language': 'en-IN,en;q=0.9,hi;q=0.8',
    'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-site': 'same-origin',
};
function sabPaisaInitMobileHeaders(accept) {
    return {
        ...SABPAISA_MOBILE_BASE_HEADERS,
        accept,
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-dest': 'document',
        'sec-fetch-user': '?1',
    };
}
function sabPaisaConfirmJsonMobileHeaders(cookie) {
    return {
        ...SABPAISA_MOBILE_BASE_HEADERS,
        accept: 'application/json, text/plain, */*',
        'content-type': 'application/json',
        cookie,
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
    };
}
/**
 * Exported for unit-test coverage; not part of the public bridge surface.
 * Tests pin the `/SabPaisa/` prefix preservation behaviour because SabPaisa
 * silently answers a missing prefix with a 404 HTML page.
 */
export function parseConfirmIntentUrl(initUrl) {
    // Derive the confirm URL from the init URL host so staging / production stay
    // symmetric. SabPaisa keeps these co-located on the same hostname AND under
    // the same deployment prefix — production paths look like
    //   `/SabPaisa/sabPaisaInit?v=1`           (Phase 1)
    //   `/SabPaisa/rest/intent/confirmintentupiV1`  (Phase 2)
    // so we replace ONLY the trailing path segment and keep any `/SabPaisa`
    // (or other) deployment prefix intact. Wiping `pathname` to a fixed
    // `/rest/intent/...` previously produced `https://securepay.sabpaisa.in/rest/...`
    // which SabPaisa answers with a generic 404 HTML page (regression seen on
    // Hairport mint warmer 2026-04-27).
    try {
        const u = new URL(initUrl);
        // initUrl pathname is `/SabPaisa/sabPaisaInit` (prod) or `/sabPaisaInit`
        // (rare staging). Swap only the last segment.
        u.pathname = u.pathname.replace(/\/[^/]*\/?$/, '/rest/intent/confirmintentupiV1');
        u.search = '';
        return u.toString();
    }
    catch {
        return 'https://securepay.sabpaisa.in/SabPaisa/rest/intent/confirmintentupiV1';
    }
}
function extractTrFromDeeplink(upiQrValue) {
    try {
        // `upi://pay?...` is not a valid http URL, but URLSearchParams on the
        // post-`?` fragment works fine.
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
/**
 * Extract all cookies from a `Set-Cookie` response header, formatted for the
 * next POST's `Cookie:` request header. SabPaisa gates `confirmintentupiV1`
 * on the JSESSIONID seeded by `sabPaisaInit` — without this the second POST
 * returns HTTP 500 with a generic HTML body.
 */
function cookieHeaderFromResponse(res) {
    // `headers.getSetCookie` is the canonical way to get multiple Set-Cookie
    // headers (Response headers otherwise collapse duplicates). Available on
    // Node 18+ / Bun / Deno / Workers.
    const raw = res.headers
        .getSetCookie?.();
    const headers = raw ?? [];
    if (headers.length === 0) {
        const single = res.headers.get('set-cookie');
        if (single)
            headers.push(single);
    }
    return headers
        .map((h) => h.split(';', 1)[0]?.trim() ?? '')
        .filter((c) => c.length > 0)
        .join('; ');
}
/** Two-POST chain. Pure function; safe to call from any runtime. */
export async function directMintUpiIntent(inputs) {
    const start = Date.now();
    const timeoutMs = inputs.timeoutMs ?? 8000;
    // Phase 1: sabPaisaInit to seed JSESSIONID. Non-200 here means the slot is
    // already consumed (re-mint of the same encData) or SabPaisa is rejecting
    // the request outright — surface the HTTP status + body snippet verbatim so
    // the caller can log/correlate.
    const form = new URLSearchParams();
    form.set('encData', inputs.encData);
    form.set('clientCode', inputs.clientCode);
    let cookie = '';
    try {
        const initRes = await fetchWithTimeout(inputs.initUrl, {
            method: 'POST',
            headers: sabPaisaInitMobileHeaders('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
            body: form.toString(),
            redirect: 'manual',
        }, timeoutMs);
        // SabPaisa responds with either 200 (HTML splash) or 3xx (redirect to SPA);
        // anything else is a failure. A cookie on 3xx is still usable because the
        // session was created before the redirect.
        if (initRes.status >= 400) {
            const body = await initRes.text().catch(() => '');
            const snippet = body.length > 300 ? body.slice(0, 300) + '…' : body;
            return {
                ok: false,
                error: `sabPaisaInit non-200 (http=${initRes.status}, body=${snippet})`,
            };
        }
        cookie = cookieHeaderFromResponse(initRes);
        if (!cookie) {
            return {
                ok: false,
                error: 'sabPaisaInit did not return any Set-Cookie (session not seeded)',
            };
        }
    }
    catch (err) {
        return {
            ok: false,
            error: `sabPaisaInit network error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
    // Phase 2: confirmintentupiV1 with the session cookie. Response is JSON —
    // we expect `tmpTransStatus === 'SUCCESS'` and a `upiQrValue` starting with
    // `upi://pay?`.
    //
    // Payload shape pinned to the probe capture from 2026-04-22 (clientCode
    // DIGI84) and **kept in lock-step with the WordPress plugin's
    // `class-sabpaisa-handler.php` `$intent_payload`**. SabPaisa rejects any
    // drift from this shape with a silent HTTP 400 + empty body (no error JSON
    // to debug from). Specifically:
    //   • `payMode` MUST be the full catalogue object, NOT the bare string.
    //   • `requestAmount` is in **rupees** (rounded int) — sending paisa makes
    //     SabPaisa's amount validator reject the request.
    //   • `udf1` / `browserDetails` / `mandateFlag` / `mandateCharges` /
    //     `activeMapping` are all required even though several are nullish.
    // Hairport pool warmer outage 2026-04-28 was caused by exactly this drift;
    // do not "simplify" the payload again without an end-to-end probe.
    const confirmUrl = parseConfirmIntentUrl(inputs.initUrl);
    const paidAmount = inputs.amountRupees.toFixed(2);
    const requestAmountRupees = Math.round(inputs.amountRupees);
    const payload = {
        clientId: inputs.clientId,
        paidAmount,
        clientTxnId: inputs.clientTxnId,
        clientName: inputs.clientName,
        clientCode: inputs.clientCode,
        requestAmount: requestAmountRupees,
        payeeEmail: inputs.email,
        payeeMobile: inputs.phone,
        amountType: AMOUNT_TYPE,
        payMode: UPI_INTENT_PAY_MODE,
        endPoint: inputs.endpointJson,
        udf1: null,
        browserDetails: MOBILE_BROWSER_DETAILS,
        mandateFlag: false,
        mandateCharges: 0,
        activeMapping: null,
    };
    try {
        const confirmRes = await fetchWithTimeout(confirmUrl, {
            method: 'POST',
            headers: sabPaisaConfirmJsonMobileHeaders(cookie),
            body: JSON.stringify(payload),
        }, timeoutMs);
        const body = await confirmRes.text();
        if (confirmRes.status !== 200) {
            const snippet = body.length > 300 ? body.slice(0, 300) + '…' : body;
            return {
                ok: false,
                error: `confirmintentupiV1 non-200 (http=${confirmRes.status}, body=${snippet})`,
            };
        }
        let parsed;
        try {
            parsed = JSON.parse(body);
        }
        catch {
            return {
                ok: false,
                error: `confirmintentupiV1 non-JSON body: ${body.slice(0, 300)}`,
            };
        }
        const obj = parsed;
        const status = typeof obj.tmpTransStatus === 'string' ? obj.tmpTransStatus : '';
        const upiQrValue = typeof obj.upiQrValue === 'string' ? obj.upiQrValue : '';
        if (status !== 'SUCCESS' || !upiQrValue.toLowerCase().startsWith('upi://pay?')) {
            return {
                ok: false,
                error: `confirmintentupiV1 unexpected response (status=${status}, qr=${upiQrValue.slice(0, 80)})`,
            };
        }
        return {
            ok: true,
            upiQrValue,
            intentTr: extractTrFromDeeplink(upiQrValue),
            mintedAt: Math.floor(Date.now() / 1000),
            latencyMs: Date.now() - start,
        };
    }
    catch (err) {
        return {
            ok: false,
            error: `confirmintentupiV1 network error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
//# sourceMappingURL=sabpaisaDirectMint.js.map