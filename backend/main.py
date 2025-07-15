from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from ai_service import ask_ai, generate_notes, generate_quiz, generate_flashcards
import os
import logging
from io import BytesIO
from PyPDF2 import PdfReader
from pydantic import BaseModel
from models import Folder, AIRequest, NotesRequest, Space, ChatMessage
import uuid
from dotenv import load_dotenv
import sqlite3
from contextlib import contextmanager
import traceback
from typing import List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)

# Initialize environment variables
load_dotenv()

# Database setup
DB_PATH = 'studybuddy.db'

@contextmanager
def get_db():
    try:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        yield conn
    finally:
        if conn:
            conn.close()

def init_db():
    try:
        # Ensure the database file exists
        if not os.path.exists(DB_PATH):
            open(DB_PATH, 'w').close()

        with get_db() as conn:
            # Create tables if they don't exist
            conn.execute('''
                CREATE TABLE IF NOT EXISTS folders (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    user_id TEXT NOT NULL
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS files (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    folder_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    FOREIGN KEY (folder_id) REFERENCES folders(id)
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS spaces (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    name TEXT NOT NULL,
                    folder_id TEXT NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (folder_id) REFERENCES folders(id)
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    space_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (space_id) REFERENCES spaces(id)
                )
            ''')
            conn.commit()
            logging.info("Database initialized successfully")
    except Exception as e:
        logging.error(f"Database initialization error: {str(e)}")
        logging.error(traceback.format_exc())
        raise

# Initialize the database
init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        with BytesIO(file_bytes) as pdf_file:
            reader = PdfReader(pdf_file)
            text = []
            for page in reader.pages:
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
                except Exception as e:
                    logging.error(f"Page extraction error: {str(e)}")
                    continue
            return " ".join(text) if text else "NO_READABLE_CONTENT"
    except Exception as e:
        logging.error(f"PDF processing failed: {str(e)}")
        logging.error(traceback.format_exc())
        return "PDF_PROCESSING_ERROR"

@app.post("/upload/{folder_id}")
async def upload_file(folder_id: str, file: UploadFile = File(...)):
    try:
        logging.info(f"Received file: {file.filename} for folder: {folder_id}")
        
        # Verify folder exists
        with get_db() as conn:
            folder = conn.execute(
                "SELECT id FROM folders WHERE id = ?",
                (folder_id,)
            ).fetchone()
            
            if not folder:
                raise HTTPException(404, "Folder not found")

        # Read and process the file
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(400, "Empty file")

        extracted_text = extract_text_from_pdf(file_bytes)
        if extracted_text in ["NO_READABLE_CONTENT", "PDF_PROCESSING_ERROR"]:
            raise HTTPException(400, f"Failed to extract text from PDF: {extracted_text}")

        # Generate file ID and save to database
        file_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute(
                "INSERT INTO files (id, name, folder_id, content) VALUES (?, ?, ?, ?)",
                (file_id, file.filename, folder_id, extracted_text)
            )
            conn.commit()

        logging.info(f"File uploaded successfully: {file_id}")
        return {
            "id": file_id,
            "name": file.filename,
            "content_preview": extracted_text[:200] if len(extracted_text) > 200 else extracted_text
        }
    except HTTPException as he:
        logging.error(f"HTTP error during upload: {str(he)}")
        raise
    except Exception as e:
        logging.error(f"Upload failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to upload file: {str(e)}")

# Endpoints
@app.post("/folders")
async def create_folder(folder: Folder):
    folder_id = str(uuid.uuid4())
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO folders (id, name, user_id) VALUES (?, ?, ?)",
                (folder_id, folder.name, folder.user_id)
            )
            conn.commit()
        return {"id": folder_id}
    except Exception as e:
        raise HTTPException(500, f"Failed to create folder: {str(e)}")

@app.get("/validate-file/{file_id}")
async def validate_file(file_id: str):
    try:
        with get_db() as conn:
            file = conn.execute(
                "SELECT id, name FROM files WHERE id = ?", 
                (file_id,)
            ).fetchone()
        
        if not file:
            return {
                "valid": False, 
                "fileId": file_id, 
                "reason": "File not found"
            }
        return {
            "valid": True,
            "fileId": file["id"],
            "name": file["name"]
        }
    except Exception as e:
        raise HTTPException(500, f"Validation failed: {str(e)}")
@app.get("/debug/files")
async def debug_files():
    with get_db() as conn:
        files = conn.execute("SELECT id, name, LENGTH(content) as size FROM files").fetchall()
    return {"files": [dict(file) for file in files]}

@app.get("/file-content/{file_id}")
async def get_file_content(file_id: str):
    try:
        with get_db() as conn:
            file = conn.execute(
                "SELECT content FROM files WHERE id = ?", 
                (file_id,)
            ).fetchone()
            
            if not file:
                raise HTTPException(404, detail="File not found")
                
            return {"content": file["content"]}
            
    except sqlite3.Error as e:
        raise HTTPException(500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(500, detail=str(e))

@app.get("/folders/{folder_id}/resources")
async def get_resources(folder_id: str):
    try:
        with get_db() as conn:
            # Verify folder exists
            folder = conn.execute(
                "SELECT id FROM folders WHERE id = ?",
                (folder_id,)
            ).fetchone()
            if not folder:
                raise HTTPException(404, "Folder not found")
            
            # Get resources
            resources = conn.execute(
                "SELECT id, name FROM files WHERE folder_id = ?",
                (folder_id,)
            ).fetchall()
            
        return [dict(resource) for resource in resources]
    except Exception as e:
        raise HTTPException(500, f"Failed to get resources: {str(e)}")

# AI endpoints remain the same
@app.post("/ask")
async def ask_question(request: AIRequest):
    try:
        logging.info(f"Received question: {request.question[:100]}...")
        response = await ask_ai(request.question, request.context)
        logging.info("Successfully generated response")
        return {"response": response}
    except Exception as e:
        logging.error(f"Question error: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )

@app.post("/generate-notes")
async def generate_notes_endpoint(request: NotesRequest):
    if not request.context.strip():
        raise HTTPException(400, "No content provided for generating notes")
    
    try:
        notes = await generate_notes(request.context)
        return {"notes": notes}
    except Exception as e:
        logging.error(f"Notes generation failed: {str(e)}")
        raise HTTPException(500, f"Failed to generate notes: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

class ChatRequest(BaseModel):
    message: str
    context: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        logging.info(f"Received chat request: {request.message[:100]}...")
        response = await ask_ai(request.message, request.context)
        logging.info("Successfully generated chat response")
        return {"response": response}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chat request: {str(e)}"
        )

@app.get("/folders")
async def get_folders(user_id: str = "default"):
    try:
        with get_db() as conn:
            # Get folders
            folders = conn.execute(
                "SELECT id, name FROM folders WHERE user_id = ?",
                (user_id,)
            ).fetchall()
            
            # Get spaces for each folder
            result = []
            for folder in folders:
                spaces = conn.execute(
                    "SELECT id, type, name, notes FROM spaces WHERE folder_id = ?",
                    (folder["id"],)
                ).fetchall()
                
                result.append({
                    "id": folder["id"],
                    "name": folder["name"],
                    "spaces": [dict(space) for space in spaces]
                })
            
            return result
    except Exception as e:
        raise HTTPException(500, f"Failed to get folders: {str(e)}")

@app.post("/spaces")
async def create_space(space: Space):
    space_id = str(uuid.uuid4())
    try:
        logging.info(f"Creating space: {space.dict()}")
        with get_db() as conn:
            # Verify folder exists
            folder = conn.execute(
                "SELECT id FROM folders WHERE id = ?",
                (space.folder_id,)
            ).fetchone()
            if not folder:
                logging.error(f"Folder not found: {space.folder_id}")
                raise HTTPException(404, "Folder not found")
            
            # Create space
            try:
                conn.execute(
                    "INSERT INTO spaces (id, type, name, folder_id, notes) VALUES (?, ?, ?, ?, ?)",
                    (space_id, space.type, space.name, space.folder_id, space.notes)
                )
                conn.commit()
            except sqlite3.Error as e:
                logging.error(f"Database error while creating space: {str(e)}")
                logging.error(traceback.format_exc())
                raise HTTPException(500, f"Database error: {str(e)}")
            
            logging.info(f"Space created successfully: {space_id}")
            return {
                "id": space_id,
                "type": space.type,
                "name": space.name,
                "folder_id": space.folder_id,
                "notes": space.notes
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Failed to create space: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to create space: {str(e)}")

@app.get("/spaces/{space_id}")
async def get_space(space_id: str):
    try:
        with get_db() as conn:
            space = conn.execute(
                "SELECT id, type, name, folder_id, notes FROM spaces WHERE id = ?",
                (space_id,)
            ).fetchone()
            
            if not space:
                raise HTTPException(404, "Space not found")
                
            return dict(space)
    except Exception as e:
        raise HTTPException(500, f"Failed to get space: {str(e)}")

@app.put("/spaces/{space_id}")
async def update_space(space_id: str, space_update: dict):
    try:
        logging.info(f"Updating space {space_id}: {space_update}")
        with get_db() as conn:
            # Verify space exists
            space = conn.execute(
                "SELECT id FROM spaces WHERE id = ?",
                (space_id,)
            ).fetchone()
            if not space:
                logging.error(f"Space not found: {space_id}")
                raise HTTPException(404, "Space not found")
            
            # Update space
            try:
                update_fields = []
                params = []
                for key, value in space_update.items():
                    if key in ['name', 'notes']:  # Only allow updating these fields
                        update_fields.append(f"{key} = ?")
                        params.append(value)
                
                if update_fields:
                    query = f"UPDATE spaces SET {', '.join(update_fields)} WHERE id = ?"
                    params.append(space_id)
                    conn.execute(query, params)
                    conn.commit()
            except sqlite3.Error as e:
                logging.error(f"Database error while updating space: {str(e)}")
                logging.error(traceback.format_exc())
                raise HTTPException(500, f"Database error: {str(e)}")
            
            # Get updated space
            updated_space = conn.execute(
                "SELECT id, type, name, folder_id, notes FROM spaces WHERE id = ?",
                (space_id,)
            ).fetchone()
            
            if not updated_space:
                raise HTTPException(404, "Space not found after update")
            
            return {
                "id": updated_space[0],
                "type": updated_space[1],
                "name": updated_space[2],
                "folder_id": updated_space[3],
                "notes": updated_space[4]
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Failed to update space: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to update space: {str(e)}")

@app.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str):
    try:
        with get_db() as conn:
            # Delete all files in the folder
            conn.execute("DELETE FROM files WHERE folder_id = ?", (folder_id,))
            # Delete all spaces in the folder
            conn.execute("DELETE FROM spaces WHERE folder_id = ?", (folder_id,))
            # Delete the folder
            conn.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
            conn.commit()
        return {"message": "Folder and all its contents deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete folder: {str(e)}")

@app.delete("/files/{file_id}")
async def delete_file(file_id: str):
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM files WHERE id = ?", (file_id,))
            conn.commit()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete file: {str(e)}")

@app.delete("/spaces/{space_id}")
async def delete_space(space_id: str):
    try:
        with get_db() as conn:
            conn.execute("DELETE FROM spaces WHERE id = ?", (space_id,))
            conn.commit()
        return {"message": "Space deleted successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to delete space: {str(e)}")

@app.delete("/clear-all")
async def clear_all_data(user_id: str = "default"):
    try:
        with get_db() as conn:
            # Get all folders for the user
            folders = conn.execute(
                "SELECT id FROM folders WHERE user_id = ?",
                (user_id,)
            ).fetchall()
            
            # Delete all files and spaces for each folder
            for folder in folders:
                conn.execute("DELETE FROM files WHERE folder_id = ?", (folder["id"],))
                conn.execute("DELETE FROM spaces WHERE folder_id = ?", (folder["id"],))
            
            # Delete all folders for the user
            conn.execute("DELETE FROM folders WHERE user_id = ?", (user_id,))
            conn.commit()
        return {"message": "All data cleared successfully"}
    except Exception as e:
        raise HTTPException(500, f"Failed to clear data: {str(e)}")

@app.post("/generate-quiz")
async def generate_quiz_endpoint(request: Request):
    try:
        # Parse request body
        body = await request.json()
        file_ids = body.get("file_ids", [])
        options = body.get("options", {})

        if not file_ids:
            raise HTTPException(status_code=400, detail="No file IDs provided")

        # Validate question types
        question_types = options.get("question_types", {})
        if not any(question_types.values()):
            raise HTTPException(status_code=400, detail="At least one question type must be selected")

        # Get content from all selected files from the database
        content = []
        with get_db() as conn:
            for file_id in file_ids:
                file = conn.execute(
                    "SELECT content FROM files WHERE id = ?",
                    (file_id,)
                ).fetchone()
                
                if not file:
                    raise HTTPException(status_code=404, detail=f"File {file_id} not found")
                
                content.append(file["content"])

        # Combine all content
        combined_content = "\n\n".join(content)

        # Generate quiz
        quiz = await generate_quiz(combined_content, options)
        return {"quiz": quiz}

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Quiz generation failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-flashcards")
async def generate_flashcards_endpoint(request: Request):
    try:
        # Parse request body
        body = await request.json()
        file_ids = body.get("file_ids", [])
        options = body.get("options", {})
        num_flashcards = options.get("num_flashcards", 5)

        if not file_ids:
            raise HTTPException(status_code=400, detail="No file IDs provided")

        # Get content from all selected files from the database
        content = []
        with get_db() as conn:
            for file_id in file_ids:
                file = conn.execute(
                    "SELECT content FROM files WHERE id = ?",
                    (file_id,)
                ).fetchone()
                
                if not file:
                    raise HTTPException(status_code=404, detail=f"File {file_id} not found")
                
                content.append(file["content"])

        # Combine all content
        combined_content = "\n\n".join(content)

        # Generate flashcards
        flashcards = await generate_flashcards(combined_content, num_flashcards)
        return {"flashcards": flashcards}

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Flashcard generation failed: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/spaces/{space_id}/messages")
async def add_message(space_id: str, message: ChatMessage):
    message_id = str(uuid.uuid4())
    try:
        with get_db() as conn:
            # Verify space exists
            space = conn.execute(
                "SELECT id FROM spaces WHERE id = ?",
                (space_id,)
            ).fetchone()
            if not space:
                raise HTTPException(404, "Space not found")
            
            # Add message
            conn.execute(
                """
                INSERT INTO chat_messages (id, space_id, role, content, timestamp)
                VALUES (?, ?, ?, ?, ?)
                """,
                (message_id, space_id, message.role, message.content, datetime.now())
            )
            conn.commit()
            
            return {
                "id": message_id,
                "space_id": space_id,
                "role": message.role,
                "content": message.content,
                "timestamp": datetime.now()
            }
    except Exception as e:
        logging.error(f"Failed to add message: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to add message: {str(e)}")

@app.get("/spaces/{space_id}/messages")
async def get_messages(space_id: str):
    try:
        with get_db() as conn:
            messages = conn.execute(
                """
                SELECT id, space_id, role, content, timestamp
                FROM chat_messages
                WHERE space_id = ?
                ORDER BY timestamp ASC
                """,
                (space_id,)
            ).fetchall()
            
            return [dict(msg) for msg in messages]
    except Exception as e:
        logging.error(f"Failed to get messages: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to get messages: {str(e)}")


@app.delete("/spaces/{space_id}/messages")
async def delete_messages(space_id: str):
    try:
        with get_db() as conn:
            conn.execute(
                "DELETE FROM chat_messages WHERE space_id = ?",
                (space_id,)
            )
            conn.commit()
        return {"message": "Messages deleted successfully"}
    except Exception as e:
        logging.error(f"Failed to delete messages: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(500, f"Failed to delete messages: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)