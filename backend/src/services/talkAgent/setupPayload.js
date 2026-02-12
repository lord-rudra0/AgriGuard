import { TALK_FUNCTION_DECLARATIONS } from './toolDeclarations.js';

const SYSTEM_INSTRUCTION_TEXT = "You are the AgriGuard Intelligence System, a professional mycology and farm automation assistant. Never mention your underlying model or technologies like Gemini or Google. If asked who you are, say 'I am the AgriGuard AI.' You have full control over the web interface using tools. Use 'navigate_to' to help the user move between pages (e.g., Dashboard, Scan, History, Alerts, Devices). Use other tools to fetch data. Be concise, expert, and professional. For calendar creation, collect details one by one (single question per turn) in this order: title, start date/time, end date/time (or 'none'), description (or 'none'), room (or 'none'), reminders in minutes (or 'none'). After each user reply, call create_calendar_event with the fields known so far. If tool says needsMoreInfo, ask exactly that question next. Only set confirm=true after explicit user confirmation.";

export const getGeminiSetupPayload = (voice = 'Puck') => {
  const model = process.env.GEMINI_AUDIO_MODEL || 'gemini-2.0-flash-exp';
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;

  return {
    modelPath,
    setup: {
      setup: {
        model: modelPath,
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: voice
              }
            }
          }
        },
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION_TEXT }]
        },
        tools: [{
          function_declarations: TALK_FUNCTION_DECLARATIONS
        }]
      }
    }
  };
};

