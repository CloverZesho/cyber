'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

// SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export default function AIChatbot({ isOpen, onClose, userName }: AIChatbotProps) {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTextMode, setShowTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasGreeted = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const messagesRef = useRef<Message[]>([]);
  const isProcessingRef = useRef(false);

  // Start listening for voice input
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isProcessingRef.current) {
      try {
        setCurrentTranscript('');
        lastTranscriptRef.current = '';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, []);

  // Text-to-Speech function with auto-listen after speaking
  const speakText = useCallback(async (text: string, autoListenAfter: boolean = true) => {
    if (!text) return;

    setIsSpeaking(true);
    try {
      console.log('Fetching speech for:', text.substring(0, 50) + '...');
      const response = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        console.log('Got audio blob, size:', audioBlob.size);

        if (audioBlob.size === 0) {
          console.error('Empty audio blob received');
          setIsSpeaking(false);
          if (autoListenAfter) startListening();
          return;
        }

        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          console.log('Audio finished playing');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          // Auto-start listening after Sarah finishes speaking
          if (autoListenAfter) {
            setTimeout(() => {
              startListening();
            }, 500);
          }
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          if (autoListenAfter) startListening();
        };

        // Try to play - may fail due to autoplay policy
        try {
          await audio.play();
          console.log('Audio playing successfully');
        } catch (playError) {
          console.error('Autoplay blocked:', playError);
          setIsSpeaking(false);
          // Still start listening if autoplay is blocked
          if (autoListenAfter) startListening();
        }
      } else {
        const errorText = await response.text();
        console.error('Speech API error:', response.status, errorText);
        setIsSpeaking(false);
        if (autoListenAfter) startListening();
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      if (autoListenAfter) startListening();
    }
  }, [startListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  // Send message and get AI response
  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setIsListening(false);

    // Stop any ongoing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    const userMessage: Message = { role: 'user', content: userText.trim() };
    messagesRef.current = [...messagesRef.current, userMessage];
    setCurrentTranscript('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Add assistant message to history and speak it
      if (fullResponse) {
        messagesRef.current = [...messagesRef.current, { role: 'assistant', content: fullResponse }];
        isProcessingRef.current = false;
        setIsProcessing(false);
        // Speak the response (will auto-listen after)
        await speakText(fullResponse, true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      isProcessingRef.current = false;
      setIsProcessing(false);
      const errorMsg = 'Sorry, I encountered an error. Please try again.';
      await speakText(errorMsg, true);
    }
  }, [speakText]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let fullTranscript = '';

          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }

          // Update the displayed transcript
          setCurrentTranscript(fullTranscript);
          lastTranscriptRef.current = fullTranscript;

          // Clear existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Set a 2-second silence timeout to auto-send
          silenceTimeoutRef.current = setTimeout(() => {
            if (lastTranscriptRef.current.trim()) {
              const messageToSend = lastTranscriptRef.current.trim();
              recognition.stop();
              setIsListening(false);
              sendMessage(messageToSend);
              lastTranscriptRef.current = '';
            }
          }, 2000);
        };

        recognition.onerror = (e: Event) => {
          console.log('Speech recognition error:', e);
          setIsListening(false);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        };

        recognition.onend = () => {
          // Only update listening state, don't auto-send here
          // The silence timeout handles sending
          setIsListening(false);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        };

        recognitionRef.current = recognition as SpeechRecognitionInterface;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [sendMessage]);

  // Toggle listening - with greeting on first tap
  const toggleListening = useCallback(async () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      // Clear any pending timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setCurrentTranscript('');
      lastTranscriptRef.current = '';
      // Clear any pending timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // First time tapping? Say greeting first, then listen
      if (!hasGreeted.current) {
        hasGreeted.current = true;
        const greeting = `Hey ${userName}! I'm Sarah, your cybersecurity advisor. How can I help you today?`;
        // Speak greeting, then auto-listen after
        await speakText(greeting, true);
      } else {
        // Not first time, just start listening
        recognitionRef.current.start();
        setIsListening(true);
      }
    }
  }, [isListening, stopSpeaking, userName, speakText]);

  // Handle text input submit
  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      sendMessage(textInput);
      setTextInput('');
      setShowTextMode(false);
    }
  }, [textInput, sendMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar with controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        {/* Captions toggle (placeholder) */}
        <button
          type="button"
          className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          title="Captions"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
        {/* Share (placeholder) */}
        <button
          type="button"
          className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          title="Share"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        {/* Settings (placeholder) */}
        <button
          type="button"
          className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          title="Settings"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Main content area with animated orb */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Animated Orb */}
        <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
          {/* Outer glow */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300/30 via-blue-400/20 to-teal-300/30 blur-xl transition-all duration-500 ${
            isSpeaking ? 'scale-125 opacity-80' : isListening ? 'scale-110 opacity-70 animate-pulse' : 'scale-100 opacity-50'
          }`} />

          {/* Main orb */}
          <div className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl transition-transform duration-300 ${
            isListening ? 'scale-105' : isSpeaking ? 'scale-110' : 'scale-100'
          }`}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-200 via-blue-300 to-teal-200">
              {/* Flowing animation layers */}
              <div className={`absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-cyan-100/40 ${
                isSpeaking ? 'animate-spin-slow' : ''
              }`} style={{ animationDuration: '8s' }} />
              <div className={`absolute inset-0 bg-gradient-to-bl from-blue-200/50 via-transparent to-white/30 ${
                isListening ? 'animate-pulse' : ''
              }`} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />

              {/* Wave effect when speaking */}
              {isSpeaking && (
                <>
                  <div className="absolute inset-4 rounded-full border-4 border-white/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute inset-8 rounded-full border-4 border-white/15 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-12 rounded-full border-4 border-white/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                </>
              )}

              {/* Listening indicator */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-white/70 rounded-full animate-bounce"
                        style={{
                          height: `${20 + Math.random() * 30}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.6s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status text / Transcript - minimal, voice-focused */}
        <div className="text-center max-w-md px-4 min-h-[80px]">
          {isListening && currentTranscript && (
            <p className="text-xl text-gray-800 animate-fade-in font-medium">&quot;{currentTranscript}&quot;</p>
          )}
          {isListening && !currentTranscript && (
            <p className="text-xl text-cyan-500 animate-pulse font-medium">I&apos;m listening...</p>
          )}
          {isProcessing && (
            <p className="text-lg text-gray-400 animate-pulse">Thinking...</p>
          )}
          {isSpeaking && (
            <p className="text-xl text-cyan-600 font-medium">Sarah is speaking...</p>
          )}
          {!isListening && !isProcessing && !isSpeaking && (
            <p className="text-lg text-gray-400">Tap the microphone to talk to Sarah</p>
          )}
        </div>
      </div>

      {/* Text input mode */}
      {showTextMode && (
        <div className="absolute bottom-24 left-0 right-0 px-8">
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-base"
              autoFocus
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={!textInput.trim() || isProcessing}
              className="px-6 py-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Bottom control bar */}
      <div className="pb-8 pt-4 px-8">
        <div className="flex items-center justify-center gap-6">
          {/* Microphone button - Main */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              isListening
                ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/30'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } disabled:opacity-50`}
            title={isListening ? 'Stop listening' : 'Start speaking'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* More options / Text mode */}
          <button
            type="button"
            onClick={() => setShowTextMode(!showTextMode)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
              showTextMode ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Type instead"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="6" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="18" cy="12" r="2" />
            </svg>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
              }
              onClose();
            }}
            className="w-14 h-14 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-all duration-200"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

