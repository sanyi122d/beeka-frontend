from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessage(BaseModel):
    id: Optional[str] = None
    space_id: str
    role: str  # 'user' | 'ai' | 'system'
    content: str
    timestamp: datetime

class Space(BaseModel):
    id: Optional[str] = None
    type: str  # 'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve'
    name: str
    folder_id: str
    notes: Optional[str] = None
    messages: Optional[List[ChatMessage]] = None

class Folder(BaseModel):
    id: Optional[str] = None
    name: str
    user_id: str
    spaces: Optional[List[Space]] = None

class AIRequest(BaseModel):
    question: str
    context: str

class NotesRequest(BaseModel):
    context: str
    