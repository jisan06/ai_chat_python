# Task: Implement Streaming AI Responses in My Existing AI Chat App

Act as a senior full-stack engineer. Add streaming AI responses to my existing application incrementally, without rebuilding the project.

## Existing technology stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: FastAPI and Python
- AI provider: Google Gemini through an existing AIProvider interface, GeminiProvider, provider factory, and AIService
- Database: SQLite using SQLAlchemy
- API style: REST
- Existing functionality: persistent conversations, message history, new chats, conversation switching, and non-streaming chat responses

## Phase 1: Inspect before coding

Inspect the actual project and identify:
- Existing Gemini provider implementation
- AIProvider interface
- AIService
- Chat history service and database models
- Existing FastAPI routes and response schemas
- Frontend chat hook, API service, and message components
- Installed Gemini SDK version

Present a short implementation plan before making changes.

Do not assume that file paths or method names match a generic template. Reuse the actual existing code and preserve current functionality.

## Phase 2: Implement provider-level streaming

Extend the provider abstraction with a streaming method that asynchronously yields text chunks.

Implement this in GeminiProvider using the installed Google Gen AI SDK's supported asynchronous streaming API.

Requirements:
- Reuse the configured Gemini model and existing API key.
- Do not expose the API key to the frontend.
- Keep provider-specific SDK logic inside GeminiProvider.
- Preserve the existing generate method so non-streaming requests continue to work.
- Handle provider errors appropriately.
- Check the installed SDK version and use its actual supported API rather than guessing method names.

## Phase 3: Add a streaming REST endpoint

Add a dedicated endpoint such as:

`POST /api/conversations/{conversation_id}/messages/stream`

Use FastAPI StreamingResponse and a clearly defined streaming format, preferably Server-Sent Events (SSE).

The request should contain the user message. The response should send text chunks progressively and finish with an explicit completion event.

Requirements:
- Preserve all existing REST endpoints.
- Reuse existing validation, chat history services, database models, and AI service.
- Save the user message and final assistant response to the correct conversation.
- Ensure streamed chunks are not saved as duplicate messages.
- Handle errors after streaming has begun using a documented SSE error event, because HTTP status codes can no longer be changed reliably after the response starts.
- Send an explicit completion event when successful.
- Avoid sending API keys, stack traces, or sensitive exception details.
- Use a consistent UTF-8 encoding and correctly frame SSE events.
- Ensure the response is not buffered unnecessarily.
- Handle client disconnects and close provider streams or other resources where appropriate.

Database requirements:
- Keep the existing SQLite database and stored conversations.
- Do not reset or recreate the database.
- Avoid holding a database transaction open during a long AI generation unnecessarily.
- Define safe behavior if generation fails after the user message has been saved.
- Do not save an incomplete assistant response as a successful final answer.

## Phase 4: Integrate frontend streaming

Update the existing chat API service and chat hook to consume the streaming endpoint using fetch and the ReadableStream API.

Requirements:
- Read the response body incrementally.
- Correctly parse SSE event boundaries, including events split across network chunks.
- Handle UTF-8 decoding safely.
- Append incoming text to the active assistant message as it arrives.
- Show a streaming indicator while the response is in progress.
- Prevent duplicate submissions.
- Preserve the active conversation ID and message order.
- Update the existing assistant message rather than creating a separate message for every chunk.
- Handle HTTP errors, SSE error events, and unexpected connection failures.
- Do not leave the UI stuck in a loading state.
- Allow the user to switch conversations safely without mixing responses between conversations.
- Handle cancellation or cleanup when appropriate.
- Refresh the conversation history after successful completion if needed.

Keep components focused on presentation and keep network logic inside the existing service and hook layers.

## Phase 5: Verification

Run the available lint, type-check, and backend tests.

Verify:
1. AI text appears before generation is complete.
2. Chunks are displayed in the correct order.
3. The final assistant response is stored once in SQLite.
4. User messages are persisted correctly.
5. Existing conversations still load after a page refresh.
6. Switching conversations does not mix messages.
7. Empty messages are rejected.
8. Provider failures and interrupted streams do not leave the UI loading forever.
9. Existing non-streaming endpoints continue working.
10. The Gemini API key remains exclusively on the backend.

Do not claim tests passed unless you actually ran them.

## Working rules

- Implement in small, reviewable steps.
- Preserve the existing architecture and code style.
- Do not introduce GraphQL, PostgreSQL, WebSockets, authentication, or unrelated features.
- Avoid unnecessary dependencies.
- Do not overwrite unrelated files.
- Explain the changed files and how to test the result.
- Keep the implementation understandable for a developer learning full-stack AI engineering.

Start by inspecting the project and proposing the plan. Then implement and verify the feature.