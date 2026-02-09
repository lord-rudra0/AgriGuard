import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Volume2, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const TalkAgent = () => {
    const { socket, connected } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [status, setStatus] = useState('disconnected'); // 'connected' | 'error' | 'disconnected'
    const [response, setResponse] = useState('');

    // Audio Refs
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);
    const playbackContextRef = useRef(null);
    const nextPlaybackTimeRef = useRef(0);

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
            if (content.modelDraft && content.modelDraft.parts) {
                // Future: handle incremental text if needed
            }

            // Handle Audio Data
            if (content.modelDraft?.parts?.[0]?.inlineData?.data) {
                const base64Data = content.modelDraft.parts[0].inlineData.data;
                playAudioChunk(base64Data);
            }

            // Handle turn complete
            if (content.turnComplete) {
                // Logic for end of assistant turn
            }
        };

        socket.on('talk:status', onStatus);
        socket.on('talk:response', onResponse);

        return () => {
            socket.off('talk:status', onStatus);
            socket.off('talk:response', onResponse);
        };
    }, [socket]);

    const initAudioContexts = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        }
        if (!playbackContextRef.current) {
            playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
    };

    const handleMicClick = () => {
        if (!isOpen) {
            setIsOpen(true);
            setStatus('connecting');
            socket.emit('talk:connect');
            startMic();
        } else {
            closeAgent();
        }
    };

    const startMic = async () => {
        try {
            initAudioContexts();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            // ScriptProcessor handles PCM conversion (bufferSize 4096 is stable)
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                if (!isListening) return;

                const inputData = e.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16 PCM
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Send as Base64 chunk
                const base64Chunk = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
                socket.emit('talk:audio', base64Chunk);
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);

            setIsListening(true);
            setResponse('');
        } catch (err) {
            console.error("Mic error:", err);
            setResponse("Microphone access denied.");
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
                                </>
                            ) : (
                                <p className="text-red-500 font-medium">{response || "Connection required"}</p>
                            )}
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={closeAgent}
                                className="px-8 py-3 rounded-full font-medium text-white shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 active:scale-95 transition-all"
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
