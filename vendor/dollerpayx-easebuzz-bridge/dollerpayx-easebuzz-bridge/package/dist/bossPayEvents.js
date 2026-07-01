/**
 * Forward journey telemetry to BossPay `POST /bridge/events/:txnId` (HMAC body).
 */
import { signBody, SIGNATURE_HEADER } from './hmac.js';
export function emitBridgeEvents(input) {
    if (!input.bridgeSecret || !input.bosspayApiBase || input.events.length === 0) {
        return;
    }
    const body = JSON.stringify({ events: input.events });
    const sig = signBody(body, input.bridgeSecret);
    const url = `${input.bosspayApiBase.replace(/\/+$/, '')}/bridge/events/${encodeURIComponent(input.txnId)}`;
    void fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            [SIGNATURE_HEADER]: sig,
        },
        body,
    }).catch(() => undefined);
}
const CLIENT_EVENT_RE = /^client_[a-z0-9_]{1,40}$/;
/** Map `GET .../upi/:txnId/beacon?e=page_loaded` into `client_page_loaded`. */
export function emitClientBeacon(input) {
    const safe = input.e.replace(/[^a-z0-9_]/gi, '').toLowerCase();
    const eventName = `client_${safe || 'beacon'}`;
    if (!CLIENT_EVENT_RE.test(eventName)) {
        return;
    }
    let details;
    if (input.d) {
        try {
            details = JSON.parse(input.d);
        }
        catch {
            details = { raw: input.d.slice(0, 200) };
        }
    }
    emitBridgeEvents({
        bosspayApiBase: input.bosspayApiBase,
        bridgeSecret: input.bridgeSecret,
        txnId: input.txnId,
        events: [{ event: eventName, details }],
    });
}
//# sourceMappingURL=bossPayEvents.js.map