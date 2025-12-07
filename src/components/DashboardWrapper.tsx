'use client';

import { useState } from 'react';
import RealtimeVoiceChat from './RealtimeVoiceChat';

interface DashboardWrapperProps {
  children: React.ReactNode;
  userName: string;
}

export default function DashboardWrapper({ children, userName }: DashboardWrapperProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {children}

      {/* Realtime Voice AI Chat */}
      <RealtimeVoiceChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userName={userName}
      />

      {/* Floating Chat Button - Voice Icon */}
      {/* Position above mobile bottom nav (bottom-24) on mobile, normal position on desktop */}
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40 flex items-center justify-center group"
        title="Talk to Sarah - AI Voice Assistant"
      >
        {/* Microphone icon */}
        <svg className="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {/* Tooltip - hidden on mobile */}
        <span className="hidden lg:block absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Talk to Sarah
        </span>
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-25"></span>
      </button>
    </>
  );
}

