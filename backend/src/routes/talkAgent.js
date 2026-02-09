import express from 'express';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

/**
 * Gemini Multimodal Live API Relay
 * This handles the transition from socket.io (client) -> WebSocket (Gemini)
 */
export const registerTalkSocket = (io) => {
    // Helper to attach listeners to a socket
    const handleTalkSocket = (socket) => {
        // Prevent multiple attachments
        if (socket.talkListenersAttached) return;
        socket.talkListenersAttached = true;

        let geminiWs = null;

        socket.on('talk:connect', () => {
            console.log(`[TalkAgent] User ${socket.user?.id} requested Live API connection`);

            const API_KEY = process.env.GEMINI_API_KEY;
            const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

            // Switch to v1beta as it is more stable for BidiGenerateContent
            const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

            try {
                geminiWs = new WebSocket(URL);

                geminiWs.on('open', () => {
                    console.log('[TalkAgent] Connected to Gemini Bidi API (v1beta)');
                    socket.emit('talk:status', { status: 'connecting' }); // Handshake phase

                    const setup = {
                        setup: {
                            model: `models/${MODEL}`,
                            generation_config: {
                                response_modalities: ["AUDIO"],
                                speech_config: {
                                    voice_config: {
                                        prebuilt_voice_config: {
                                            voice_name: "Puck"
                                        }
                                    }
                                }
                            },
                            system_instruction: {
                                parts: [{ text: "You are AgriGuard, an AI farm assistant. Be concise and friendly." }]
                            }
                        }
                    };
                    geminiWs.send(JSON.stringify(setup));
                    console.log('[TalkAgent] Sent setup message for:', MODEL);
                });

                geminiWs.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());

                        // Relay conversation content
                        if (message.serverContent || message.modelDraft || message.modelTurn) {
                            const payload = message.serverContent || message.modelDraft || message.modelTurn || message;
                            socket.emit('talk:response', payload);
                        }

                        if (message.setupComplete) {
                            console.log('[TalkAgent] Gemini Bidi setup complete');
                            socket.emit('talk:status', { status: 'connected' });
                        }
                    } catch (e) {
                        console.error('[TalkAgent] Error parsing Gemini message:', e);
                        console.log('[TalkAgent] Raw snippet:', data.toString().slice(0, 100));
                    }
                });

                geminiWs.on('error', (error) => {
                    console.error('[TalkAgent] Gemini WS Error:', error);
                    socket.emit('talk:status', { status: 'error', error: 'Gemini connection error' });
                });

                geminiWs.on('close', (code, reason) => {
                    const reasonStr = reason ? reason.toString() : 'No reason provided';
                    console.log(`[TalkAgent] Gemini connection closed: Code ${code}, Reason: ${reasonStr}`);
                    socket.emit('talk:status', {
                        status: 'disconnected',
                        code,
                        reason: reasonStr
                    });
                    geminiWs = null;
                });

            } catch (err) {
                console.error('[TalkAgent] Failed to connect to Gemini:', err);
                socket.emit('talk:status', { status: 'error', error: err.message });
            }
        });

        // Relay PCM audio chunks from client to Gemini
        let chunkCount = 0;
        socket.on('talk:audio', (pcmBase64) => {
            if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                chunkCount++;
                if (chunkCount % 20 === 0) {
                    console.log(`[TalkAgent] Relaying chunk ${chunkCount} (${Math.round(pcmBase64.length / 1024)}KB)`);
                }

                const chunk = {
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "audio/pcm;rate=16000",
                            data: pcmBase64
                        }]
                    }
                };
                geminiWs.send(JSON.stringify(chunk));
            }
        });

        socket.on('talk:disconnect', () => {
            if (geminiWs) {
                geminiWs.close();
                geminiWs = null;
            }
        });

        socket.on('disconnect', () => {
            if (geminiWs) {
                geminiWs.close();
                geminiWs = null;
            }
        });
    };

    // Attach to new connections
    io.on('connection', (socket) => {
        handleTalkSocket(socket);
    });

    // Attach to existing connections
    for (const [id, socket] of io.sockets.sockets) {
        handleTalkSocket(socket);
    }
};

// Keep existing router for any non-socket needs if necessary, but primary logic is now socket-based
router.get('/status', (req, res) => {
    res.json({ success: true, message: 'TalkAgent WebSocket Relay is active' });
});

export default router;
