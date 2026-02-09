import express from 'express';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

import SensorData from '../models/SensorData.js';
import ScanHistory from '../models/ScanHistory.js';
import Alert from '../models/Alert.js';

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

        socket.on('talk:connect', (data) => {
            console.log('[TalkAgent] Received talk:connect data:', data);
            const requestedVoice = data?.voice || "Puck";
            console.log(`[TalkAgent] User ${socket.user?.id} requested Live API connection with voice: ${requestedVoice}`);

            const API_KEY = process.env.GEMINI_API_KEY;
            const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

            // Switch to v1alpha as it often has better support for new voices
            const URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

            try {
                geminiWs = new WebSocket(URL);

                geminiWs.on('open', () => {
                    const modelPath = MODEL.startsWith('models/') ? MODEL : `models/${MODEL}`;
                    console.log(`[TalkAgent] Connected to Gemini Bidi API (v1alpha) | Voice: ${requestedVoice} | Model: ${modelPath}`);
                    socket.emit('talk:status', { status: 'connecting' });

                    const setup = {
                        setup: {
                            model: modelPath,
                            generation_config: {
                                response_modalities: ["AUDIO"],
                                speech_config: {
                                    voice_config: {
                                        prebuilt_voice_config: {
                                            voice_name: requestedVoice
                                        }
                                    }
                                }
                            },
                            system_instruction: {
                                parts: [{ text: "You are the AgriGuard Intelligence System, a professional mycology and farm automation assistant. Never mention your underlying model or technologies like Gemini or Google. If asked who you are, say 'I am the AgriGuard AI.' You have full control over the web interface using tools. Use 'navigate_to' to help the user move between pages (e.g., Dashboard, Scan, History, Alerts, Devices). Use other tools to fetch data. Be concise, expert, and professional." }]
                            },
                            tools: [{
                                function_declarations: [
                                    {
                                        name: "navigate_to",
                                        description: "Navigate the user to a specific page on the AgriGuard platform.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                page: {
                                                    type: "STRING",
                                                    enum: ["dashboard", "scan", "history", "alerts", "devices", "analytics", "calendar", "settings"],
                                                    description: "The name of the page to navigate to."
                                                }
                                            },
                                            required: ["page"]
                                        }
                                    },
                                    {
                                        name: "get_latest_sensor_data",
                                        description: "Fetch the most recent reading for a specific sensor type.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                sensorType: {
                                                    type: "STRING",
                                                    enum: ["temperature", "humidity", "co2", "light", "soilMoisture"],
                                                    description: "The type of sensor to query."
                                                }
                                            },
                                            required: ["sensorType"]
                                        }
                                    },
                                    {
                                        name: "get_recent_scans",
                                        description: "Get the last 5 mushroom/crop analysis results from history.",
                                        parameters: { type: "OBJECT", properties: {} }
                                    },
                                    {
                                        name: "get_active_alerts",
                                        description: "List unresolved alerts, filtered by severity.",
                                        parameters: {
                                            type: "OBJECT",
                                            properties: {
                                                minSeverity: {
                                                    type: "STRING",
                                                    enum: ["low", "medium", "high", "critical"],
                                                    description: "Minimum severity level to include."
                                                }
                                            }
                                        }
                                    }
                                ]
                            }]
                        }
                    };
                    console.log('[TalkAgent] Handshake Setup:', JSON.stringify(setup, null, 2));
                    geminiWs.send(JSON.stringify(setup));
                });

                geminiWs.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());

                        // Verbose logging for handshake and errors
                        if (message.setupComplete || message.error || !message.serverContent) {
                            console.log('[TalkAgent] Gemini Response:', JSON.stringify(message, null, 2));
                        }

                        // Relay conversation content
                        if (message.serverContent || message.modelDraft || message.modelTurn) {
                            const payload = message.serverContent || message.modelDraft || message.modelTurn || message;
                            socket.emit('talk:response', payload);
                        }

                        // Handle Tool Calls
                        const toolCall = message.toolCall || message.serverContent?.toolCall;
                        if (toolCall) {
                            handleToolCall(geminiWs, toolCall, socket);
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

async function handleToolCall(geminiWs, toolCall, socket) {
    const responses = [];
    const userId = socket.user?.id;

    for (const call of toolCall.functionCalls) {
        let result = { error: "Function not found" };
        const { name, args, id } = call;

        console.log(`[TalkAgent] Executing tool: ${name}`, args);

        try {
            if (name === "navigate_to") {
                const pagePath = `/${args.page === 'dashboard' ? '' : args.page}`;
                console.log(`[TalkAgent] Navigation requested to: ${args.page} (${pagePath})`);

                // Emit action to frontend
                socket.emit('talk:action', { action: 'navigate', path: pagePath });

                result = { success: true, message: `Navigating to ${args.page} page now.` };
            }
            else if (name === "get_latest_sensor_data") {
                const data = await SensorData.findOne({
                    userId,
                    sensorType: args.sensorType
                }).sort({ createdAt: -1 });
                result = data ? { value: data.value, unit: data.unit, timestamp: data.createdAt } : { message: "No data found for this sensor type." };
            }
            else if (name === "get_recent_scans") {
                const scans = await ScanHistory.find({ userId })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('analysis createdAt');
                result = { scans: scans.map(s => ({ result: s.analysis, date: s.createdAt })) };
            }
            else if (name === "get_active_alerts") {
                const query = { userId, isResolved: false };
                if (args.minSeverity) {
                    const severities = ['low', 'medium', 'high', 'critical'];
                    const minIdx = severities.indexOf(args.minSeverity);
                    query.severity = { $in: severities.slice(minIdx) };
                }
                const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(10);
                result = { alerts: alerts.map(a => ({ title: a.title, severity: a.severity, message: a.message })) };
            }
        } catch (err) {
            console.error(`[TalkAgent] Tool error (${name}):`, err);
            result = { error: err.message };
        }

        responses.push({
            name,
            id,
            response: result
        });
    }

    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(JSON.stringify({
            toolResponse: {
                functionResponses: responses
            }
        }));
        console.log(`[TalkAgent] Sent tool responses for ${responses.length} calls`);
    }
}

// Keep existing router for any non-socket needs if necessary
router.get('/status', (req, res) => {
    res.json({ success: true, message: 'TalkAgent WebSocket Relay is active' });
});

export default router;
