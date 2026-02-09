import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Volume2, Loader2, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const TalkAgent = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');

    // Close on route change
    const location = useLocation();
    useEffect(() => {
        setIsOpen(false);
    }, [location]);

    // Mock interaction for demo
    const handleMicClick = () => {
        if (!isOpen) {
            setIsOpen(true);
            startListening();
        } else {
            // If already open, toggle listening
            if (isListening) stopListening();
            else startListening();
        }
    };

    const startListening = () => {
        setIsListening(true);
        setIsSpeaking(false);
        setTranscript('');
        setResponse('');

        // Simulate listening delay
        setTimeout(() => {
            setTranscript("Is my tomato crop healthy?");
            stopListening();
        }, 2500);
    };

    const stopListening = () => {
        setIsListening(false);
        // Simulate processing -> speaking
        setTimeout(() => {
            setIsSpeaking(true);
            setResponse("Based on the latest scan, your tomato plants show early signs of potential blight. I recommend increasing airflow and monitoring humidity levels.");
        }, 1000);
    };

    const closeAgent = () => {
        setIsOpen(false);
        setIsListening(false);
        setIsSpeaking(false);
        setTranscript('');
        setResponse('');
    };

    return (
        <>
            {/* Header Button (Always Visible) */}
            <button
                onClick={handleMicClick}
                className={`relative p-2 rounded-full transition-all duration-300 ${isOpen
                        ? 'bg-red-500 text-white shadow-lg ring-4 ring-red-500/30'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800'
                    }`}
                title="Talk to AgriGuard"
            >
                <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                )}
            </button>

            {/* Immersive Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop Blur */}
                    <div
                        className="absolute inset-0 bg-white/80 dark:bg-gray-900/90 backdrop-blur-md transition-opacity duration-300"
                        onClick={closeAgent}
                    />

                    {/* Main Agent Card */}
                    <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden flex flex-col items-center p-8 md:p-12 animate-in fade-in zoom-in-95 duration-200">

                        {/* Close Button */}
                        <button
                            onClick={closeAgent}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Visualizer / Orb */}
                        <div className="relative mb-8">
                            {/* Dynamic Glow */}
                            <div className={`absolute inset-0 blur-3xl rounded-full transition-all duration-1000 ${isListening ? 'bg-indigo-500/40 scale-150' :
                                    isSpeaking ? 'bg-emerald-500/40 scale-125 animate-pulse' :
                                        'bg-gray-400/20 scale-100'
                                }`} />

                            {/* Core Orb */}
                            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-inner transition-all duration-500 ${isListening
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-500/50 scale-110'
                                    : isSpeaking
                                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/50'
                                        : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800'
                                }`}>
                                {isListening ? (
                                    <Mic className="w-12 h-12 text-white animate-bounce" />
                                ) : isSpeaking ? (
                                    <Volume2 className="w-12 h-12 text-white animate-pulse" />
                                ) : (
                                    <Mic className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                )}
                            </div>
                        </div>

                        {/* Status Text & Transcript */}
                        <div className="text-center space-y-4 w-full min-h-[120px]">
                            {isListening ? (
                                <>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                                        Listening...
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        {transcript || "Speak now"}
                                    </p>
                                </>
                            ) : isSpeaking ? (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                        Assistant
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                                        "{response}"
                                    </p>
                                </>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500">Tap the mic to start</p>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="mt-8 flex gap-4">
                            {isSpeaking && (
                                <button
                                    onClick={stopListening} // Stop speaking logic placeholder
                                    className="px-6 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Stop
                                </button>
                            )}
                            <button
                                onClick={() => isListening ? stopListening() : startListening()}
                                className={`px-8 py-3 rounded-full font-medium text-white shadow-lg transition-transform active:scale-95 ${isListening
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110'
                                    }`}
                            >
                                {isListening ? 'Stop Listening' : 'Talk Again'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default TalkAgent;
