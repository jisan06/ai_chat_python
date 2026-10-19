'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatApiError,
  Conversation,
} from '../types/chat';
import { chatApi } from '../services/chat-api';
import { generateId } from '@/lib/utils';

const STORAGE_ACTIVE_CONVERSATION_KEY = 'ai_chat_active_conversation_id';

export interface UseChatReturn {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isConversationsLoading: boolean;
  isMessagesLoading: boolean;
  error: string | null;
  conversationsError: string | null;
  sendMessage: (customMessage?: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  startNewChat: () => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
  loadConversations: () => Promise<void>;
}

export function useChat(): UseChatReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState<boolean>(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationsError, setConversationsError] = useState<string | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Fetch conversation history list from backend.
   */
  const loadConversations = useCallback(async () => {
    setIsConversationsLoading(true);
    setConversationsError(null);
    try {
      const list = await chatApi.getConversations();
      setConversations(list);
      return list;
    } catch (err: unknown) {
      const apiErr = err as ChatApiError;
      setConversationsError(apiErr.message || 'Failed to load conversation history.');
      return [];
    } finally {
      setIsConversationsLoading(false);
    }
  }, []);

  /**
   * Select and load an existing conversation session.
   */
  const selectConversation = useCallback(
    async (conversationId: string) => {
      if (currentConversationId === conversationId && !isMessagesLoading) {
        return;
      }

      setCurrentConversationId(conversationId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ACTIVE_CONVERSATION_KEY, conversationId);
      }

      setError(null);
      setIsMessagesLoading(true);

      try {
        const loadedMessages = await chatApi.getConversationMessages(conversationId);
        setMessages(loadedMessages);
      } catch (err: unknown) {
        const apiErr = err as ChatApiError;
        setError(apiErr.message || 'Failed to load messages for this conversation.');
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    },
    [currentConversationId, isMessagesLoading]
  );

  /**
   * Start a brand new chat (resets active conversation).
   */
  const startNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setError(null);
    setInput('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_CONVERSATION_KEY);
    }
  }, []);

  /**
   * Delete a conversation.
   */
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        await chatApi.deleteConversation(conversationId);
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));

        if (currentConversationId === conversationId) {
          startNewChat();
        }
      } catch (err: unknown) {
        const apiErr = err as ChatApiError;
        setError(apiErr.message || 'Failed to delete conversation.');
      }
    },
    [currentConversationId, startNewChat]
  );

  /**
   * Initial load: fetch conversations and restore last active conversation if present.
   */
  useEffect(() => {
    if (!isInitialMountRef.current) return;
    isInitialMountRef.current = false;

    let isSubscribed = true;

    async function init() {
      const list = await loadConversations();
      if (!isSubscribed) return;

      if (typeof window !== 'undefined') {
        const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_CONVERSATION_KEY);
        if (savedActiveId && list.some((c) => c.id === savedActiveId)) {
          selectConversation(savedActiveId);
        } else if (list.length > 0) {
          // Default to the most recent conversation if available
          selectConversation(list[0].id);
        }
      }
    }

    init();

    return () => {
      isSubscribed = false;
    };
  }, [loadConversations, selectConversation]);

  /**
   * Send a message to the active conversation (or creates one if in New Chat).
   */
  const sendMessage = useCallback(
    async (customMessage?: string): Promise<void> => {
      const messageText = (customMessage !== undefined ? customMessage : input).trim();

      if (!messageText || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (customMessage === undefined) {
        setInput('');
      }

      // Optimistic user message for immediate UI responsiveness
      const tempUserMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: messageText,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage]);

      try {
        let targetConversationId = currentConversationId;

        // If no active conversation, create one on the fly
        if (!targetConversationId) {
          const newConversation = await chatApi.createConversation();
          targetConversationId = newConversation.id;
          setCurrentConversationId(newConversation.id);

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_ACTIVE_CONVERSATION_KEY, newConversation.id);
          }
        }

        // Send message to the backend and persist both user & assistant messages
        const response = await chatApi.sendMessageToConversation(
          targetConversationId,
          messageText
        );

        // Replace optimistic message and append assistant message with authoritative DB records
        const persistedUserMessage: ChatMessage = {
          id: response.user_message.id,
          conversationId: response.user_message.conversation_id,
          role: 'user',
          content: response.user_message.content,
          createdAt: new Date(response.user_message.created_at),
        };

        const persistedAssistantMessage: ChatMessage = {
          id: response.assistant_message.id,
          conversationId: response.assistant_message.conversation_id,
          role: 'assistant',
          content: response.assistant_message.content,
          createdAt: new Date(response.assistant_message.created_at),
        };

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMessage.id),
          persistedUserMessage,
          persistedAssistantMessage,
        ]);

        // Refresh conversation list to capture updated title & sorting
        await loadConversations();
      } catch (err: unknown) {
        const apiError = err as ChatApiError;
        const errorMessage = apiError.message || 'An unexpected error occurred. Please try again.';
        setError(errorMessage);

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
    [currentConversationId, input, loadConversations]
  );

  const currentConversation =
    conversations.find((c) => c.id === currentConversationId) || null;

  return {
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    input,
    setInput,
    isLoading,
    isConversationsLoading,
    isMessagesLoading,
    error,
    conversationsError,
    sendMessage,
    selectConversation,
    startNewChat,
    deleteConversation,
    clearChat,
    clearError,
    loadConversations,
  };
}
