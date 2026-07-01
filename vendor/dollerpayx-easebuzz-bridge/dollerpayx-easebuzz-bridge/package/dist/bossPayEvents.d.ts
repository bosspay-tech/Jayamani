/**
 * Forward journey telemetry to BossPay `POST /bridge/events/:txnId` (HMAC body).
 */
export type BridgeJourneyEvent = {
    event: string;
    occurred_at_ms?: number;
    details?: Record<string, unknown>;
};
export declare function emitBridgeEvents(input: {
    bosspayApiBase: string;
    bridgeSecret: string;
    txnId: string;
    events: BridgeJourneyEvent[];
}): void;
/** Map `GET .../upi/:txnId/beacon?e=page_loaded` into `client_page_loaded`. */
export declare function emitClientBeacon(input: {
    bosspayApiBase: string;
    bridgeSecret: string;
    txnId: string;
    e: string;
    d: string | null;
}): void;
//# sourceMappingURL=bossPayEvents.d.ts.map