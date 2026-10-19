from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    SendMessageResponse,
)
from app.services.chat_history_service import ChatHistoryService
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/conversations", tags=["conversations"])
ai_service = AIService()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate = ConversationCreate(),
    db: Session = Depends(get_db),
):
    """Create a new conversation session."""
    conversation = ChatHistoryService.create_conversation(db, title=payload.title)
    return conversation


@router.get("", response_model=List[ConversationResponse])
def list_conversations(db: Session = Depends(get_db)):
    """List all conversations ordered by newest activity first."""
    return ChatHistoryService.list_conversations(db)


@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get single conversation metadata."""
    conversation = ChatHistoryService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


@router.patch("/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: Session = Depends(get_db),
):
    """Rename a conversation title."""
    conversation = ChatHistoryService.rename_conversation(
        db, conversation_id, new_title=payload.title
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation and all of its associated messages."""
    deleted = ChatHistoryService.delete_conversation(db, conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return None


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    """Retrieve all messages in a conversation in chronological order."""
    conversation = ChatHistoryService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return ChatHistoryService.get_messages(db, conversation_id)


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
):
    """
    Save user message, call AIService to generate response,
    and persist both messages in the conversation.
    """
    user_text = payload.message.strip()
    if not user_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    conversation = ChatHistoryService.get_conversation(db, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    try:
        reply_text = await ai_service.chat(user_text)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service temporarily unavailable. Please try again.",
        )

    user_msg, assistant_msg = ChatHistoryService.add_user_message_and_reply(
        db=db,
        conversation_id=conversation_id,
        user_content=user_text,
        reply_content=reply_text,
    )

    return SendMessageResponse(
        user_message=MessageResponse.model_validate(user_msg),
        assistant_message=MessageResponse.model_validate(assistant_msg),
    )
