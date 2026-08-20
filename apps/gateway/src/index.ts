import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { sanitizeMessageContent } from './sanitizers/chatSanitizer.js';
import { verifyCourierHMAC, handleDeliveryDelivered } from './webhooks/courierRelayer.js';

dotenv.config();

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 4000;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_key'
);

// Express Route: Ingest Signed Courier Webhooks (LOG-01)
app.post('/webhooks/courier', async (req, res) => {
    const signature = req.headers['x-courier-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !verifyCourierHMAC(rawBody, signature)) {
        return res.status(401).json({ error: 'Invalid HMAC-SHA256 signature' });
    }

    const { trackingId, carrierCode, status } = req.body;

    if (status === 'DELIVERED') {
        try {
            const order = await handleDeliveryDelivered(trackingId, carrierCode);
            return res.status(200).json({ success: true, orderId: order.id, status: order.status });
        } catch (err: any) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(200).json({ status: 'ACKNOWLEDGED' });
});

// Map room conversations to active client WebSockets
const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket) => {
    let authenticatedUserId: string | null = null;
    let currentConversationId: string | null = null;

    ws.on('message', async (data: string) => {
        try {
            const payload = JSON.parse(data.toString());

            if (payload.type === 'AUTH') {
                const token = payload.token?.replace('Bearer ', '');
                const { data: { user }, error } = await supabase.auth.getUser(token);
                if (error || !user) {
                    ws.close(4001, 'Unauthorized');
                    return;
                }
                authenticatedUserId = user.id;
                ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId: user.id }));
                return;
            }

            if (payload.type === 'JOIN_ROOM') {
                currentConversationId = payload.conversationId;
                if (!rooms.has(currentConversationId!)) {
                    rooms.set(currentConversationId!, new Set());
                }
                rooms.get(currentConversationId!)!.add(ws);
                return;
            }

            if (payload.type === 'SEND_MESSAGE') {
                const { isFlagged, flagReason, sanitizedContent } = sanitizeMessageContent(payload.content);
                const { data: savedMsg } = await supabase
                    .from('messages')
                    .insert({
                        conversation_id: currentConversationId,
                        sender_id: authenticatedUserId,
                        content: sanitizedContent,
                        is_flagged: isFlagged,
                        flag_reason: flagReason,
                    })
                    .select('*')
                    .single();

                rooms.get(currentConversationId!)?.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'NEW_MESSAGE', message: savedMsg }));
                    }
                });
            }
        } catch (err: any) {
            ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
        }
    });

    ws.on('close', () => {
        if (currentConversationId && rooms.has(currentConversationId)) {
            rooms.get(currentConversationId)!.delete(ws);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Gateway & Courier Webhook microservice running on port ${PORT}`);
});