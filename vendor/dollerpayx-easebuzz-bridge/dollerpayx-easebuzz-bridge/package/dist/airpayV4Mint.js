/**
 * AirPay v4 mint — Node edition — DEPRECATED (ADR-022, @dpx/bridge-node
 * 3.3.0, 2026-05-28).
 *
 * ----------------------------------------------------------------------
 *  THIS BRIDGE-SIDE MINT FUNCTION IS A NO-OP. AirPay v4 mint moved to
 *  the DPX backend, which performs the full 3-stage AirPay SPA replay
 *  against `payments.airpay.co.in` server-to-server. WP / Node / Python
 *  lender bridges play NO role in AirPay mint anymore. Status polling
 *  (the `/api/verify` call) also runs on the DPX backend — no bridge
 *  involvement is required for any AirPay code path.
 * ----------------------------------------------------------------------
 *
 * Why the function stays exported (rather than being deleted):
 *   1. Backward-compat for lenders who pinned an older `@dpx/bridge-node`
 *      release and may import the name. They get a clear runtime error
 *      pointing them at the migration instead of a less-helpful
 *      `TypeError: mintAirpayV4Intent is not a function`.
 *   2. The type exports (`AirpayV4MintCreds`, `AirpayV4MintBuyer`,
 *      `AirpayV4MintInputs`, `AirpayV4MintOk`, `AirpayV4MintErr`,
 *      `AirpayV4MintResult`) remain stable so downstream TS code keeps
 *      type-checking during their bump.
 *
 * Migration:
 *   - Delete any lender-side wiring that called `mintAirpayV4Intent`.
 *     AirPay-routed transactions are now driven entirely from the DPX
 *     backend; the bridge has nothing to do with AirPay mint or
 *     verification.
 *
 * See `docs/DECISIONS.md` (ADR-022) and `apps/backend/src/lib/
 * airpay-v4-spa-replay.ts` in the DPX backend repository for the
 * authoritative implementation.
 */
/**
 * DEPRECATED — see file header. Returns a structured failure pointing
 * to ADR-022. Does NOT touch the network. Safe to call from CI without
 * any AirPay credentials.
 */
export async function mintAirpayV4Intent(_inputs) {
    return {
        ok: false,
        stage: 'deprecated',
        error: 'mintAirpayV4Intent removed in @dpx/bridge-node 3.3.0 (ADR-022). ' +
            'AirPay v4 mint now runs entirely on the DPX backend (3-stage SPA ' +
            'replay against payments.airpay.co.in). The lender bridge plays no ' +
            'role in AirPay mint or status polling. Delete the bridge-side call ' +
            'site; the DPX backend will handle the entire AirPay flow.',
        raw: {
            adr: 'ADR-022',
            replacement: 'apps/backend/src/lib/airpay-v4-spa-replay.ts::directMintAirpayUpiIntent',
            bridge_node_version: '3.3.0',
        },
    };
}
//# sourceMappingURL=airpayV4Mint.js.map