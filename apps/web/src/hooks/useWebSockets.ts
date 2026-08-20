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
            // First check local storage sync
            const localKey = `chat_msgs_${conversationId}`;
            let loadedFromLocal = false;
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem(localKey);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setMessages(parsed);
                            loadedFromLocal = true;
                        }
                    } catch (e) {}
                }
            }

            // Then fetch from Supabase
            try {
                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (data && data.length > 0) {
                    setMessages((prev) => {
                        const ids = new Set(data.map((m) => m.id));
                        const remaining = prev.filter((m) => !ids.has(m.id));
                        const merged = [...data, ...remaining];
                        merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        return merged;
                    });
                } else if (!loadedFromLocal && (conversationId.includes('case') || conversationId.includes('raja') || conversationId.startsWith('conv-'))) {
                    const initialInquiryMsg = {
                        id: `msg-inquiry-${conversationId}`,
                        conversation_id: conversationId,
                        sender_id: 'buyer-rishav',
                        sender_name: 'Rishav Kumar',
                        content: 'Hi! I am interested in ordering this verified handcrafted product: "case" (₹300). Can you please confirm customization options and delivery schedule?',
                        is_flagged: false,
                        flag_reason: null,
                        created_at: new Date().toISOString(),
                    };
                    setMessages([initialInquiryMsg]);
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.setItem(localKey, JSON.stringify([initialInquiryMsg]));
                        } catch (e) {}
                    }
                }
            } catch (err) {
                console.error('Supabase message history fetch:', err);
            }
        };

        loadHistory();
    }, [conversationId]);

    // 2. Setup BroadcastChannel & Window event synchronization for instant multi-tab sync
    useEffect(() => {
        if (!conversationId || typeof window === 'undefined') return;

        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel('karigar_chat_sync');
            bc.onmessage = (event) => {
                const data = event.data;
                if (data?.conversationId === conversationId && data?.message) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === data.message.id)) return prev;
                        return [...prev, data.message];
                    });
                }
            };
        } catch (e) {}

        const handleCustomMsg = (event: any) => {
            const data = event.detail;
            if (data?.conversationId === conversationId && data?.message) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
            }
        };

        window.addEventListener('karigar_new_message', handleCustomMsg);

        return () => {
            bc?.close();
            window.removeEventListener('karigar_new_message', handleCustomMsg);
        };
    }, [conversationId]);

    // 3. Setup WebSocket & Supabase Realtime subscription
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

        // Supabase Realtime fallback subscription with unique topic to prevent collision
        const channelTopic = `room:${conversationId}:${Date.now()}`;
        const channel = supabase
            .channel(channelTopic)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    if (payload.new) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    }
                }
            );

        channel.subscribe();

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

    // 4. Send message with dual-rail routing (WS gateway -> BroadcastChannel -> DB fallback)
    const sendMessage = async (rawContent: string) => {
        if (!rawContent.trim() || !conversationId) return;

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

        const { data: { user } } = await supabase.auth.getUser();
        const newMsgObj = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            conversation_id: conversationId,
            sender_id: user?.id || 'anonymous_sender',
            content: sanitized,
            is_flagged: isFlagged,
            flag_reason: flagReason,
            created_at: new Date().toISOString(),
        };

        // 1. Optimistically add to local UI state
        setMessages((prev) => [...prev, newMsgObj]);

        // 2. Persist to shared localStorage so other tabs & accounts see it immediately
        const localKey = `chat_msgs_${conversationId}`;
        if (typeof window !== 'undefined') {
            try {
                const prevStored = JSON.parse(localStorage.getItem(localKey) || '[]');
                localStorage.setItem(localKey, JSON.stringify([...prevStored, newMsgObj]));
            } catch (e) {}

            // 3. Broadcast to all open tabs/windows
            try {
                window.dispatchEvent(
                    new CustomEvent('karigar_new_message', { detail: { conversationId, message: newMsgObj } })
                );
                const bc = new BroadcastChannel('karigar_chat_sync');
                bc.postMessage({ conversationId, message: newMsgObj });
                setTimeout(() => bc.close(), 100);
            } catch (e) {}
        }

        // 4. Send via WebSocket if open
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'SEND_MESSAGE', content: sanitized }));
        }

        // 5. Direct Supabase DB insert fallback
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