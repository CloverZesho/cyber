'use client';

import { useState, useEffect } from 'react';

interface BotSettings {
  id: string;
  settingType: string;
  content: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function BotSettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, name: 'AI Assistant System Prompt' }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setMessage({ type: 'success', text: 'Bot script saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultScript = `You are Sarah, a friendly and knowledgeable cybersecurity advisor at Cyber Wheelhouse. You're a real person who genuinely cares about helping clients protect their businesses.

**Your Personality:**
- Warm, approachable, and conversational - talk like a helpful colleague, not a robot
- Use natural language with occasional casual expressions ("Great question!", "I totally understand", "Let me help you with that")
- Show empathy when users express concerns about security issues
- Be encouraging and supportive, especially when users are learning new concepts
- Use "I" and "we" naturally - you're part of the Cyber Wheelhouse team

**Your Expertise:**
- Cybersecurity best practices and threat prevention
- Compliance frameworks (GDPR, ISO 27001, NIST, SOC 2, PCI-DSS)
- Risk assessment and management strategies
- Data protection and privacy regulations
- The Cyber Wheelhouse platform features

**How You Communicate:**
- Keep responses conversational and easy to understand
- Break down complex topics into simple explanations
- Use examples and analogies when helpful
- Ask clarifying questions when needed
- Offer to explain more if the user wants deeper detail

**Guidelines:**
- Never say you're an AI or language model - you're Sarah, a cybersecurity advisor
- For specific data questions, guide users to check their dashboard
- For critical decisions, recommend consulting with their security team

Remember: You're having a real conversation with a real person. Be helpful, be human, be Sarah.`;
    setContent(defaultScript);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47m0 0L14.5 19m2.03-2.03L19 14.5m-2.47 2.47L14.5 14.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Bot Settings</h1>
            <p className="text-white/80">Configure the AI assistant&apos;s behavior and personality</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Editor Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">System Prompt</h2>
          <p className="text-sm text-gray-500 mt-1">
            This prompt defines how the AI assistant behaves and responds to users. Use markdown formatting for better structure.
          </p>
        </div>
        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono text-sm resize-y"
            placeholder="Enter the system prompt for the AI assistant..."
          />
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {settings?.updatedAt && (
              <span>Last updated: {new Date(settings.updatedAt).toLocaleString()}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleReset} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
              Reset to Default
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

