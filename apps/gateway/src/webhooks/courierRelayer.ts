import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

let settlementQueue: Queue | null = null;

export function getSettlementQueue(): Queue {
    if (!settlementQueue) {
        const redisConnection = new (IORedis as any)(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            lazyConnect: true,
            enableOfflineQueue: false,
        });
        settlementQueue = new Queue('settlement-buffer-queue', {
            connection: redisConnection,
        });
    }
    return settlementQueue;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_key'
);

export function verifyCourierHMAC(rawPayload: string, receivedSignature: string): boolean {
    const secret = process.env.COURIER_WEBHOOK_SECRET || 'test_secret_key';
    const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawPayload)
        .digest('hex');
    return computedSignature === receivedSignature;
}

export async function handleDeliveryDelivered(trackingId: string, carrierCode: string) {
    const deliveryTimestamp = new Date();
    const autoReleaseAt = new Date(deliveryTimestamp.getTime() + 48 * 60 * 60 * 1000); // +48 hours

    // 1. Update Escrow Order to 48-Hour Buffer
    const { data: order, error } = await supabase
        .from('escrow_orders')
        .update({
            status: 'DELIVERED_PENDING_BUFFER',
            delivery_timestamp: deliveryTimestamp.toISOString(),
            auto_release_at: autoReleaseAt.toISOString(),
            carrier_code: carrierCode,
        })
        .eq('tracking_id', trackingId)
        .select('*')
        .single();

    if (error || !order) {
        throw new Error(`Order with tracking ${trackingId} not found`);
    }

    // 2. Schedule Delayed BullMQ Settlement Job (48 hours = 172800000 ms)
    const queue = getSettlementQueue();
    await queue.add(
        'release-funds-job',
        { orderId: order.id },
        {
            delay: 48 * 60 * 60 * 1000,
            jobId: `settlement_${order.id}`,
            removeOnComplete: true,
        }
    );

    return order;
}