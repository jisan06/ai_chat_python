'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage, ChatApiError } from '../types/chat';
import { chatApi } from '../services/chat-api';
import { generateId } from '@/lib/utils';

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  error: string | null;
  sendMessage: (customMessage?: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to avoid stale closure or race conditions
  const isSubmittingRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (customMessage?: string): Promise<void> => {
      const messageText = (customMessage !== undefined ? customMessage : input).trim();

      // Guard against empty message or concurrent submission
      if (!messageText || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);

      // If sending from input box, clear the input immediately
      if (customMessage === undefined) {
        setInput('');
      }

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: messageText,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await chatApi.sendMessage(messageText);

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.reply,
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: unknown) {
        const apiError = err as ChatApiError;
        const errorMessage = apiError.message || 'An unexpected error occurred. Please try again.';
        setError(errorMessage);

        // Optionally add an error message bubble so context is not lost in conversation view
        const errorAssistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: errorMessage,
          createdAt: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorAssistantMessage]);
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [input]
  );

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    sendMessage,
    clearChat,
    clearError,
  };
}
