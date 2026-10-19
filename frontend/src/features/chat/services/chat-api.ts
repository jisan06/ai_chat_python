import { ChatRequest, ChatResponse, ChatApiError } from '../types/chat';

/**
 * Service to manage all HTTP interactions with the AI Chat Backend.
 */
class ChatApiService {
  private get baseUrl(): string {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Sends a user message to the backend FastAPI /api/chat endpoint.
   *
   * @param message Text message to send to the AI
   * @param signal Optional AbortSignal for request cancellation
   * @returns Promise with ChatResponse containing the AI reply
   * @throws ChatApiError on communication or validation failures
   */
  async sendMessage(message: string, signal?: AbortSignal): Promise<ChatResponse> {
    const trimmed = message.trim();
    if (!trimmed) {
      throw {
        message: 'Message cannot be empty.',
        statusCode: 400,
      } as ChatApiError;
    }

    const payload: ChatRequest = { message: trimmed };
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        let userFriendlyMessage = 'An unexpected error occurred while communicating with the server.';

        if (response.status === 400) {
          userFriendlyMessage = 'Invalid message request. Please check your input.';
        } else if (response.status === 404) {
          userFriendlyMessage = 'The chat service endpoint could not be found.';
        } else if (response.status === 429) {
          userFriendlyMessage = 'Too many requests. Please wait a moment before sending another message.';
        } else if (response.status === 502 || response.status === 503) {
          userFriendlyMessage = 'The AI provider is temporarily unavailable. Please try again shortly.';
        } else if (response.status >= 500) {
          userFriendlyMessage = 'The server encountered an error. Please try again later.';
        }

        throw {
          message: userFriendlyMessage,
          statusCode: response.status,
        } as ChatApiError;
      }

      const data: ChatResponse = await response.json();

      if (!data || typeof data.reply !== 'string') {
        throw {
          message: 'Received an invalid response format from the server.',
          statusCode: 502,
        } as ChatApiError;
      }

      return data;
    } catch (err: unknown) {
      // If error already formatted as ChatApiError, rethrow it
      if (err && typeof err === 'object' && 'statusCode' in err && 'message' in err) {
        throw err;
      }

      // Handle aborted fetch
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw {
          message: 'Request was cancelled.',
        } as ChatApiError;
      }

      // Handle network errors (e.g. backend down, CORS blocked, offline)
      throw {
        message: 'Unable to reach the AI chat server. Please ensure the backend is running.',
      } as ChatApiError;
    }
  }
}

export const chatApi = new ChatApiService();
