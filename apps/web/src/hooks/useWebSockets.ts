'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '../lib/supabaseClient';

// Client-side ingress sanitization regex (matches off-platform phone numbers, emails, UPI IDs)
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const UPI_REGEX = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;

export function useWebSockets(conversationId: string | null) {
    const [messages, setMessages] = useState<any[]>([]);
    const [warningBanner, setWarningBanner] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const supabase = createClient();

    // 1. Load initial message history for the conversation
    useEffect(() => {
        if (!conversationId) return;

        const loadHistory = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data && data.length > 0) {
                setMessages(data);
            }
        };

        loadHistory();
    }, [conversationId]);

    // 2. Setup WebSocket or Supabase Realtime subscription
    const connect = useCallback(async () => {
        if (!conversationId) return;

        const { data: { session } } = await supabase.auth.getSession();
        const wsUrl = process.env.NEXT_PUBLIC_GATEWAY_WS_URL || 'ws://localhost:4000';

        try {
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                if (session?.access_token) {
                    ws.send(JSON.stringify({ type: 'AUTH', token: session.access_token }));
                }
                ws.send(JSON.stringify({ type: 'JOIN_ROOM', conversationId }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEW_MESSAGE' && data.message) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === data.message.id)) return prev;
                            return [...prev, data.message];
                        });
                    }
                    if (data.type === 'MESSAGE_FLAGGED') {
                        setWarningBanner(data.warning);
                        setTimeout(() => setWarningBanner(null), 6000);
                    }
                } catch (e) {
                    console.error('WS message parse error:', e);
                }
            };

            ws.onerror = () => {
                setIsConnected(false);
            };

            ws.onclose = () => {
                setIsConnected(false);
            };
        } catch {
            setIsConnected(false);
        }

        // Supabase Realtime fallback subscription
        const channel = supabase
            .channel(`room:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
            }, (payload) => {
                if (payload.new) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            })
            .subscribe();

        return () => {
            socketRef.current?.close();
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    useEffect(() => {
        const cleanupPromise = connect();
        return () => {
            cleanupPromise.then((cleanup) => cleanup && cleanup());
        };
    }, [connect]);

    // 3. Send message with dual-rail routing (WS gateway -> DB fallback)
    const sendMessage = async (rawContent: string) => {
        if (!rawContent.trim()) return;

        // Ingress sanitization for contact info
        let sanitized = rawContent;
        let isFlagged = false;
        let flagReason: string | null = null;

        if (PHONE_REGEX.test(rawContent)) {
            isFlagged = true;
            flagReason = 'PHONE_NUMBER_DETECTED';
            sanitized = sanitized.replace(PHONE_REGEX, '[CONTACT_HIDDEN_FOR_SAFETY]');
        }
        if (EMAIL_REGEX.test(rawContent)) {
            isFlagged = true;
            flagReason = 'EMAIL_DETECTED';
            sanitized = sanitized.replace(EMAIL_REGEX, '[EMAIL_HIDDEN_FOR_SAFETY]');
        }
        if (UPI_REGEX.test(rawContent)) {
            isFlagged = true;
            flagReason = 'UPI_ID_DETECTED';
            sanitized = sanitized.replace(UPI_REGEX, '[OFFPLATFORM_PAYMENT_BLOCKED]');
        }

        if (isFlagged) {
            setWarningBanner('⚠️ Contact info redacted for buyer-maker safety and escrow compliance.');
            setTimeout(() => setWarningBanner(null), 6000);
        }

        // Send via WebSocket if open
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'SEND_MESSAGE', content: sanitized }));
            return;
        }

        // Direct Supabase DB insert fallback
        const { data: { user } } = await supabase.auth.getUser();
        const newMsgObj = {
            id: `msg-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: user?.id || 'anonymous_sender',
            content: sanitized,
            is_flagged: isFlagged,
            flag_reason: flagReason,
            created_at: new Date().toISOString(),
        };

        // Optimistically add to UI
        setMessages((prev) => [...prev, newMsgObj]);

        try {
            await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: user?.id,
                content: sanitized,
                is_flagged: isFlagged,
                flag_reason: flagReason,
            });
        } catch (err) {
            console.error('Direct message insert error:', err);
        }
    };

    return { messages, setMessages, sendMessage, isConnected, warningBanner };
}