'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '../hooks/use-chat';
import { ChatHeader } from './chat-header';
import { ChatMessage } from './chat-message';
import { ChatEmptyState } from './chat-empty-state';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';

export function ChatInterface() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    clearChat,
    clearError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message whenever messages change or loading begins
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSelectPrompt = (promptText: string) => {
    sendMessage(promptText);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-50 font-sans text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Header */}
      <ChatHeader onClearChat={clearChat} hasMessages={messages.length > 0} />

      {/* Main Conversation Area */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          tabIndex={0}
          aria-label="Conversation message stream"
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 focus:outline-none"
        >
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end">
            {messages.length === 0 ? (
              <ChatEmptyState onSelectPrompt={handleSelectPrompt} />
            ) : (
              <section
                aria-live="polite"
                aria-relevant="additions text"
                className="flex flex-col gap-2"
              >
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && <TypingIndicator />}

                <div ref={messagesEndRef} aria-hidden="true" />
              </section>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 py-2 sm:px-6">
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 shadow-xs dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 focus:outline-none focus:ring-1 focus:ring-red-500"
                aria-label="Dismiss error notification"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="border-t border-zinc-200/80 bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => sendMessage()}
              isLoading={isLoading}
              placeholder="Ask AI Chat anything... (Press Enter to send, Shift+Enter for new line)"
            />
            <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
              AI may produce inaccurate information about people, places, or facts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
