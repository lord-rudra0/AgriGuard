import express from 'express';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';
import { getGeminiSetupPayload } from '../services/talkAgent/setupPayload.js';
import { handleToolCall } from '../services/talkAgent/toolExecutor.js';

dotenv.config();

const router = express.Router();

const GEMINI_API_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

const relayAudioChunk = (geminiWs, pcmBase64) => {
  const chunk = {
    realtimeInput: {
      mediaChunks: [{
        mimeType: 'audio/pcm;rate=16000',
        data: pcmBase64
      }]
    }
  };
  geminiWs.send(JSON.stringify(chunk));
};

const attachSocketHandlers = (socket) => {
  if (socket.talkListenersAttached) return;
  socket.talkListenersAttached = true;

  let geminiWs = null;
  let chunkCount = 0;

  socket.on('talk:connect', (data) => {
    console.log('[TalkAgent] Received talk:connect data:', data);
    const requestedVoice = data?.voice || 'Puck';
    console.log(`[TalkAgent] User ${socket.user?.id} requested Live API connection with voice: ${requestedVoice}`);

    const apiKey = process.env.GEMINI_API_KEY;
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    try {
      geminiWs = new WebSocket(url);

      geminiWs.on('open', () => {
        const { modelPath, setup } = getGeminiSetupPayload(requestedVoice);
        console.log(`[TalkAgent] Connected to Gemini Bidi API (v1alpha) | Voice: ${requestedVoice} | Model: ${modelPath}`);
        socket.emit('talk:status', { status: 'connecting' });
        console.log('[TalkAgent] Handshake Setup:', JSON.stringify(setup, null, 2));
        geminiWs.send(JSON.stringify(setup));
      });

      geminiWs.on('message', (dataBuffer) => {
        try {
          const message = JSON.parse(dataBuffer.toString());

          if (message.setupComplete || message.error || !message.serverContent) {
            console.log('[TalkAgent] Gemini Response:', JSON.stringify(message, null, 2));
          }

          if (message.serverContent || message.modelDraft || message.modelTurn) {
            const payload = message.serverContent || message.modelDraft || message.modelTurn || message;
            socket.emit('talk:response', payload);
          }

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
          console.log('[TalkAgent] Raw snippet:', dataBuffer.toString().slice(0, 100));
        }
      });

      geminiWs.on('error', (error) => {
        console.error('[TalkAgent] Gemini WS Error:', error);
        socket.emit('talk:status', { status: 'error', error: 'Gemini connection error' });
      });

      geminiWs.on('close', (code, reason) => {
        const reasonStr = reason ? reason.toString() : 'No reason provided';
        console.log(`[TalkAgent] Gemini connection closed: Code ${code}, Reason: ${reasonStr}`);
        socket.emit('talk:status', { status: 'disconnected', code, reason: reasonStr });
        geminiWs = null;
      });
    } catch (err) {
      console.error('[TalkAgent] Failed to connect to Gemini:', err);
      socket.emit('talk:status', { status: 'error', error: err.message });
    }
  });

  socket.on('talk:audio', (pcmBase64) => {
    if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
      chunkCount += 1;
      if (chunkCount % 20 === 0) {
        console.log(`[TalkAgent] Relaying chunk ${chunkCount} (${Math.round(pcmBase64.length / 1024)}KB)`);
      }
      relayAudioChunk(geminiWs, pcmBase64);
    }
  });

  const closeGemini = () => {
    if (geminiWs) {
      geminiWs.close();
      geminiWs = null;
    }
  };

  socket.on('talk:disconnect', closeGemini);
  socket.on('disconnect', closeGemini);
};

/**
 * Gemini Multimodal Live API Relay
 * This handles the transition from socket.io (client) -> WebSocket (Gemini)
 */
export const registerTalkSocket = (io) => {
  io.on('connection', (socket) => {
    attachSocketHandlers(socket);
  });

  for (const [, socket] of io.sockets.sockets) {
    attachSocketHandlers(socket);
  }
};

router.get('/status', (req, res) => {
  res.json({ success: true, message: 'TalkAgent WebSocket Relay is active' });
});

export default router;
