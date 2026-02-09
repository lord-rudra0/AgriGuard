import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Volume2, Loader2, Sparkles, MessageCircle, Settings, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const availableVoices = [
    { name: 'Puck', desc: 'Upbeat and friendly (Default voice)', gender: 'Male' },
    { name: 'Charon', desc: 'Informative, calm, and professional', gender: 'Male' },
    { name: 'Kore', desc: 'Firm, focused, and professional', gender: 'Female' },
    { name: 'Fenrir', desc: 'Excitable, warm, and approachable', gender: 'Male' },
    { name: 'Aoede', desc: 'Breezy, bright, and youthful', gender: 'Female' },
    { name: 'Leda', desc: 'Youthful and clear', gender: 'Female' },
    { name: 'Zephyr', desc: 'Bright and clear', gender: 'Female' },
    { name: 'Orus', desc: 'Firm and steady', gender: 'Male' }
];

const TalkAgent = () => {
    const { socket, connected } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [status, setStatus] = useState('disconnected'); // 'connected' | 'error' | 'disconnected'
    const [response, setResponse] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(() => {
        const stored = localStorage.getItem('agriGuard_voice');
        const isValid = availableVoices.some(v => v.name === stored);
        return isValid ? stored : 'Puck';
    });
    const [showSettings, setShowSettings] = useState(false);

    // Auto-restart session if voice is changed while active
    useEffect(() => {
        if (status === 'connected' && isOpen) {
            console.log(`[TalkAgent] Voice changed to ${selectedVoice} during active session. Restarting...`);
            closeAgent();
            // Wait a small bit for cleanup before restarting
            setTimeout(() => {
                setIsOpen(true);
                setStatus('connecting');
                console.log(`[TalkAgent] Auto-restarting with voice: ${selectedVoice}`);
                socket.emit('talk:connect', { voice: selectedVoice });
                startMic();
            }, 300);
        }
    }, [selectedVoice]);

    // Audio Refs
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);
    const playbackContextRef = useRef(null);
    const nextPlaybackTimeRef = useRef(0);
    const isListeningRef = useRef(false);
    const pcmChunkCountRef = useRef(0);

    // Close on route change
    const location = useLocation();
    useEffect(() => {
        if (isOpen) closeAgent();
    }, [location]);

    // Handle Socket Events
    useEffect(() => {
        if (!socket) return;

        const onStatus = ({ status: s, error, code, reason }) => {
            setStatus(s);
            if (s === 'error') setResponse(error || 'Connection failed');
            if (s === 'disconnected' && code && code !== 1000) {
                setResponse(`Connection Error: ${reason || 'Unknown'} (Code: ${code})`);
            }
        };

        const onResponse = (content) => {
            console.log('[TalkAgent] Received response:', content);

            // Handle Audio Data - check modelTurn, modelDraft, and serverContent paths
            const audioData = content.modelTurn?.parts?.[0]?.inlineData?.data ||
                content.modelDraft?.parts?.[0]?.inlineData?.data ||
                content.serverContent?.modelDraft?.parts?.[0]?.inlineData?.data;

            if (audioData) {
                console.log('[TalkAgent] Playing audio chunk...', audioData.length);
                playAudioChunk(audioData);
            }

            // Handle turn complete
            if (content.turnComplete || content.generationComplete) {
                console.log('[TalkAgent] Turn complete');
            }
        };

        socket.on('talk:status', onStatus);
        socket.on('talk:response', onResponse);

        return () => {
            socket.off('talk:status', onStatus);
            socket.off('talk:response', onResponse);
        };
    }, [socket]);

    const initAudioContexts = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        }
        if (!playbackContextRef.current) {
            playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        // Interaction required to resume audio contexts in some browsers
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        if (playbackContextRef.current.state === 'suspended') await playbackContextRef.current.resume();
    };

    const handleMicClick = () => {
        if (!isOpen) {
            setIsOpen(true);
            setStatus('connecting');
            console.log(`[TalkAgent] Emitting connect with voice: ${selectedVoice}`);
            socket.emit('talk:connect', { voice: selectedVoice });
            startMic();
        } else {
            closeAgent();
        }
    };

    const startMic = async () => {
        try {
            console.log('[TalkAgent] Starting mic...');
            await initAudioContexts();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            console.log('[TalkAgent] Mic stream acquired');

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!isListeningRef.current) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                const uint8 = new Uint8Array(pcmData.buffer);
                let binary = '';
                for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
                const base64Chunk = btoa(binary);

                socket.emit('talk:audio', base64Chunk);

                pcmChunkCountRef.current++;
                if (pcmChunkCountRef.current % 50 === 0) {
                    console.log(`[TalkAgent] Audio heartbeat: sent ${pcmChunkCountRef.current} chunks`);
                }
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);

            isListeningRef.current = true;
            setIsListening(true);
            setResponse('');
        } catch (err) {
            console.error("[TalkAgent] Mic error:", err);
            setResponse(`Microphone error: ${err.message}`);
        }
    };

    const playAudioChunk = (base64) => {
        if (!playbackContextRef.current) return;

        setIsSpeaking(true);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;

        const audioBuffer = playbackContextRef.current.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = playbackContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackContextRef.current.destination);

        // Schedule playback to avoid gaps
        const startTime = Math.max(playbackContextRef.current.currentTime, nextPlaybackTimeRef.current);
        source.start(startTime);
        nextPlaybackTimeRef.current = startTime + audioBuffer.duration;

        source.onended = () => {
            if (playbackContextRef.current.currentTime >= nextPlaybackTimeRef.current - 0.1) {
                setIsSpeaking(false);
            }
        };
    };

    const closeAgent = () => {
        setIsOpen(false);
        setIsListening(false);
        setIsSpeaking(false);
        socket.emit('talk:disconnect');

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        nextPlaybackTimeRef.current = 0;
    };

    return (
        <>
            {/* Header Button (Always Visible) */}
            <button
                onClick={handleMicClick}
                className={`relative h-9 w-9 inline-flex items-center justify-center rounded-md transition-colors ${isOpen
                    ? 'text-white bg-indigo-500 hover:bg-indigo-600'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50/70 dark:hover:bg-gray-800/60'
                    }`}
                title="Talk to AgriGuard"
            >
                {!isOpen && (
                    <>
                        <span className="absolute -inset-4 rounded-full animate-[ping_2.5s_linear_infinite] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-md"></span>
                        <span className="absolute -inset-2 rounded-full animate-[ping_2s_linear_infinite] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 opacity-50 blur-sm" style={{ animationDelay: '0.4s' }}></span>
                        <span className="absolute inset-0 rounded-md animate-[pulse_1.5s_ease-in-out_infinite] bg-gradient-to-tr from-indigo-500 to-fuchsia-500 opacity-40 blur-[2px]"></span>
                    </>
                )}
                <Mic className={`relative z-10 w-5 h-5 ${isListening && status === 'connected' ? 'animate-pulse' : ''}`} />
            </button>

            {/* Immersive Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md transition-opacity duration-300" onClick={closeAgent} />
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden flex flex-col items-center p-8 md:p-12 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={closeAgent} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-6 h-6" /></button>

                        <div className="relative mb-12 flex items-center justify-center h-48 w-48">
                            {(isListening || isSpeaking) && (
                                <>
                                    <div className={`absolute inset-0 rounded-full opacity-0 animate-[ping_3s_linear_infinite] ${isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ animationDelay: '0s' }} />
                                    <div className={`absolute inset-0 rounded-full opacity-0 animate-[ping_3s_linear_infinite] ${isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ animationDelay: '1s' }} />
                                    <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                </>
                            )}
                            <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform ${isListening ? 'scale-110' : ''} bg-white dark:bg-gray-900 border-4 border-transparent`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500 ${status === 'connected' ? (isSpeaking ? 'bg-emerald-500' : 'bg-indigo-500') : 'bg-gray-400'}`}>
                                    {isListening && status === 'connected' ? (
                                        <div className="flex gap-1 items-end h-8">
                                            <span className="w-1.5 h-3 bg-white rounded-full animate-[bounce_1s_infinite]"></span>
                                            <span className="w-1.5 h-6 bg-white rounded-full animate-[bounce_1.2s_infinite]"></span>
                                            <span className="w-1.5 h-4 bg-white rounded-full animate-[bounce_0.8s_infinite]"></span>
                                        </div>
                                    ) : (
                                        <Mic className="w-10 h-10 text-white" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-4 w-full min-h-[120px]">
                            {status === 'connecting' ? (
                                <h3 className="text-xl font-bold text-gray-400 animate-pulse">Establishing Link...</h3>
                            ) : status === 'connected' ? (
                                <>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                        Agent Online
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        {isSpeaking ? "Assistant is speaking..." : "Listening to your field query..."}
                                    </p>
                                    <div className="flex items-center gap-2 justify-center text-xs font-medium text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-800/50 py-1 px-3 rounded-full">
                                        <Volume2 className="w-3 h-3" />
                                        <span>Voice: {selectedVoice}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-red-500 font-medium">{response || "Connection required"}</p>
                            )}
                        </div>

                        {/* Voice Selection Settings */}
                        <div className={`w-full mt-6 transition-all duration-300 ${showSettings ? 'max-h-64 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            <div className="grid grid-cols-1 gap-2 p-2">
                                {availableVoices.map((voice) => (
                                    <button
                                        key={voice.name}
                                        onClick={() => {
                                            setSelectedVoice(voice.name);
                                            localStorage.setItem('agriGuard_voice', voice.name);
                                            setShowSettings(false);
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${selectedVoice === voice.name
                                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold flex items-center gap-2">
                                                {voice.name}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedVoice === voice.name ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                    {voice.gender}
                                                </span>
                                            </div>
                                            <div className={`text-xs ${selectedVoice === voice.name ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                {voice.desc}
                                            </div>
                                        </div>
                                        {selectedVoice === voice.name && <Sparkles className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className={`p-3 rounded-full transition-all ${showSettings ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-indigo-500'}`}
                                title="Voice Settings"
                            >
                                <Settings className={`w-6 h-6 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
                            </button>
                            <button
                                onClick={closeAgent}
                                className="px-8 py-3 rounded-full font-medium text-white shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 active:scale-95 transition-all flex-1"
                            >
                                Stop Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TalkAgent;
