import { logger } from '../lib/logger.js';
import { env } from '../lib/env.js';

// TON Mainnet or Testnet endpoint
const TONCENTER_ENDPOINT = env.TON_NETWORK === 'mainnet'
    ? 'https://toncenter.com/api/v2/jsonRPC'
    : 'https://testnet.toncenter.com/api/v2/jsonRPC';

interface TxVerificationResult {
    verified: boolean;
    amount?: bigint;
    from?: string;
    to?: string;
    timestamp?: number;
    error?: string;
}

interface TonCenterResponse {
    error?: { message: string };
    result?: Array<{
        in_msg?: { value?: string; source?: string; destination?: string };
        utime?: number;
    }>;
}

/**
 * Verify a TON transaction by its hash
 * @param txHash - Transaction hash (base64 or hex)
 * @param expectedAmount - Expected amount in nano TON
 * @param expectedTo - Expected recipient address
 */
export async function verifyTonTransaction(
    txHash: string,
    expectedAmount?: bigint,
    expectedTo?: string
): Promise<TxVerificationResult> {
    try {
        // Use TonCenter API to check transaction
        const response = await fetch(`${TONCENTER_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                jsonrpc: '2.0',
                method: 'getTransactions',
                params: {
                    hash: txHash,
                    limit: 1,
                },
            }),
        });

        const data = await response.json() as TonCenterResponse;

        if (data.error) {
            return { verified: false, error: data.error.message };
        }

        const tx = data.result?.[0];
        if (!tx) {
            return { verified: false, error: 'Transaction not found' };
        }

        // Extract transaction details
        const amount = BigInt(tx.in_msg?.value || 0);
        const from = tx.in_msg?.source;
        const to = tx.in_msg?.destination;
        const timestamp = tx.utime;

        // Verify expected values if provided
        if (expectedAmount && amount !== expectedAmount) {
            return {
                verified: false,
                error: `Amount mismatch: expected ${expectedAmount}, got ${amount}`,
                amount,
                from,
                to,
                timestamp,
            };
        }

        if (expectedTo && to !== expectedTo) {
            return {
                verified: false,
                error: `Recipient mismatch: expected ${expectedTo}, got ${to}`,
                amount,
                from,
                to,
                timestamp,
            };
        }

        logger.info({ txHash, amount: amount.toString(), from, to }, 'TON transaction verified');

        return {
            verified: true,
            amount,
            from,
            to,
            timestamp,
        };
    } catch (error: any) {
        logger.error({ txHash, error: error.message }, 'Failed to verify TON transaction');
        return { verified: false, error: error.message };
    }
}

/**
 * Get transaction link for TON Explorer
 */
export function getTonExplorerLink(txHash: string): string {
    const isMainnet = env.TON_NETWORK === 'mainnet';
    const baseUrl = isMainnet
        ? 'https://tonscan.org/tx/'
        : 'https://testnet.tonscan.org/tx/';
    return `${baseUrl}${txHash}`;
}

/**
 * Verify withdrawal was actually sent on-chain
 */
export async function verifyWithdrawalOnChain(
    txHash: string,
    expectedAmountNano: bigint,
    expectedRecipient: string
): Promise<{ success: boolean; message: string }> {
    const result = await verifyTonTransaction(txHash, expectedAmountNano, expectedRecipient);

    if (!result.verified) {
        return {
            success: false,
            message: result.error || 'Transaction verification failed',
        };
    }

    return {
        success: true,
        message: `Verified: ${Number(result.amount) / 1e9} TON sent to ${result.to}`,
    };
}
