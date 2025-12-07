'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RealtimeVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function RealtimeVoiceChat({ isOpen, onClose, userName }: RealtimeVoiceChatProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Handle data channel messages
  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log('DataChannel event:', data.type);

      switch (data.type) {
        case 'session.created':
        case 'session.updated':
          console.log('Session ready');
          setConnectionState('connected');
          setConversationState('listening');
          break;

        case 'input_audio_buffer.speech_started':
          setConversationState('listening');
          setTranscript('');
          break;

        case 'input_audio_buffer.speech_stopped':
          setConversationState('thinking');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          setTranscript(data.transcript || '');
          break;

        case 'response.audio_transcript.delta':
          setAiResponse(prev => prev + (data.delta || ''));
          setConversationState('speaking');
          break;

        case 'response.done':
          setAiResponse('');
          setConversationState('listening');
          break;

        case 'error':
          // Ignore "active response in progress" errors - they're harmless
          if (data.error?.message?.includes('active response in progress')) {
            console.log('Ignoring duplicate response request');
            return;
          }
          console.error('Realtime API Error:', data.error);
          setError(data.error?.message || 'An error occurred');
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  }, [userName]);

  // Connect using WebRTC
  const connect = useCallback(async () => {
    try {
      setConnectionState('connecting');
      setError(null);

      // Get ephemeral token from our API
      const response = await fetch('/api/ai/realtime/session', { method: 'POST' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create session');
      }
      const data = await response.json();
      console.log('Session data received:', data);

      const secretValue = data.client_secret?.value || data.client_secret;
      if (!secretValue) {
        throw new Error('No client secret received');
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Create hidden audio element for playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      // Handle incoming audio track
      pc.ontrack = (e) => {
        console.log('Received audio track');
        audioEl.srcObject = e.streams[0];
      };

      // Add microphone track
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        console.log('DataChannel open');
        // Configure session
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: `You are Sarah, a friendly cybersecurity advisor at Cyber Wheelhouse.
Keep responses concise (1-2 sentences). Be warm and professional.`,
            voice: 'sage',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, silence_duration_ms: 700 },
          }
        }));
      };

      dc.onmessage = handleDataChannelMessage;

      // Create and set local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secretValue}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      console.log('WebRTC connected!');
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('disconnected');
    }
  }, [handleDataChannelMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    setConnectionState('disconnected');
    setConversationState('idle');
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    disconnect();
    onClose();
  }, [disconnect, onClose]);

  // Auto-connect when opened
  useEffect(() => {
    if (isOpen && connectionState === 'disconnected') {
      connect();
    }
    return () => {
      if (!isOpen) {
        disconnect();
      }
    };
  }, [isOpen, connectionState, connect, disconnect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col safe-area-inset-top safe-area-inset-bottom">
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10 safe-area-inset-top">
        <button
          type="button"
          onClick={handleClose}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          title="Close voice chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-4">
        {/* Error message */}
        {error && (
          <div className="absolute top-20 left-4 right-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg text-center text-sm">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-2 font-bold">&times;</button>
          </div>
        )}

        {/* Animated orb - smaller on mobile */}
        <div className="relative w-36 h-36 sm:w-48 sm:h-48 mb-6 sm:mb-8">
          <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
            connectionState === 'connecting' ? 'bg-gradient-to-br from-yellow-200 to-orange-300 animate-pulse' :
            conversationState === 'listening' ? 'bg-gradient-to-br from-cyan-300 to-blue-400' :
            conversationState === 'thinking' ? 'bg-gradient-to-br from-purple-300 to-indigo-400 animate-pulse' :
            conversationState === 'speaking' ? 'bg-gradient-to-br from-green-300 to-teal-400' :
            'bg-gradient-to-br from-gray-200 to-gray-300'
          }`}>
            {/* Ripple effects when speaking */}
            {conversationState === 'speaking' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-teal-300/50 animate-ping" />
                <div className="absolute inset-4 rounded-full border-4 border-teal-300/30 animate-ping animation-delay-200" />
              </>
            )}

            {/* Sound wave bars when listening */}
            {conversationState === 'listening' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 sm:w-2 bg-white/70 rounded-full animate-bounce"
                      style={{
                        height: `${16 + Math.random() * 24}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Thinking spinner */}
            {conversationState === 'thinking' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Status text - responsive sizing */}
        <div className="text-center max-w-sm sm:max-w-md px-4 min-h-[80px] sm:min-h-[100px]">
          {connectionState === 'connecting' && (
            <p className="text-lg sm:text-xl text-orange-500 animate-pulse font-medium">Connecting to Sarah...</p>
          )}
          {connectionState === 'connected' && conversationState === 'listening' && (
            <>
              <p className="text-lg sm:text-xl text-cyan-600 font-medium mb-2">
                {transcript || "I'm listening..."}
              </p>
              <p className="text-xs sm:text-sm text-gray-400">Speak naturally - Sarah will respond when you pause</p>
            </>
          )}
          {conversationState === 'thinking' && (
            <p className="text-lg sm:text-xl text-purple-500 animate-pulse font-medium">Thinking...</p>
          )}
          {conversationState === 'speaking' && (
            <p className="text-lg sm:text-xl text-teal-600 font-medium">{aiResponse || 'Sarah is speaking...'}</p>
          )}
          {connectionState === 'disconnected' && (
            <p className="text-base sm:text-lg text-gray-400">Connection closed</p>
          )}
        </div>

        {/* Reconnect button if disconnected */}
        {connectionState === 'disconnected' && (
          <button
            type="button"
            onClick={connect}
            className="mt-4 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors font-medium text-sm sm:text-base"
          >
            Reconnect to Sarah
          </button>
        )}
      </div>

      {/* Bottom indicator */}
      <div className="pb-6 sm:pb-8 text-center safe-area-inset-bottom">
        <p className="text-xs text-gray-400">
          {connectionState === 'connected' ? '🟢 Connected' : '⚪ Disconnected'}
        </p>
      </div>
    </div>
  );
}
