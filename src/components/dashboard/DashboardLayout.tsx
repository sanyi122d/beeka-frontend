import { BookOpen, FolderPlus, Home, Menu, User, X, Plus, Eye, MessageSquare, FileText, HelpCircle, Brain, BookCheck, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AIChat from './AIChat';
import ResourceManager from './ResourceManager';
import NotesGenerator from './NotesGenerator';
import HomeView from './Home';
import QuizGenerator from './QuizGenerator';
import FlashcardGenerator from './FlashcardGenerator';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../../styles/flashcards.css';
import { redirectToStripeCheckout } from '../../services/stripeService';

interface Resource {
  id: string;
  name: string;
}

interface Folder {
  id: string;
  name: string;
  resources: Resource[];
  spaces: Space[];
}

interface Space {
  id: string;
  type: 'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve';
  name: string;
  notes?: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

function DebugView() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalConsole = console.log;
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalConsole(...args);
    };

    return () => {
      console.log = originalConsole; // Restore original console
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 bg-black text-white p-4 max-h-40 overflow-auto text-xs z-50">
      {logs.map((log, i) => <div key={i}>{log}</div>)}
    </div>
  );
}

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [showFilesList, setShowFilesList] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [showResources, setShowResources] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [pdfText, setPdfText] = useState('');
  const [notes, setNotes] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null);
  const [hoveredSpace, setHoveredSpace] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingSpace, setEditingSpace] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newSpaceName, setNewSpaceName] = useState('');
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showMobileAppModal, setShowMobileAppModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const testimonials = [
    {
      text: "Beeka AI has completely transformed how I prepare for exams. I've improved my grades significantly with much less stress.",
      author: "Sarah Johnson, Medical Student",
    },
    {
      text: "The AI chat feature feels like having a tutor available 24/7. It explains complex concepts in ways that actually make sense.",
      author: "Michael Chen, Computer Science Major",
    },
    {
      text: "The AI-powered quizzes are challenging but fair. They've helped me identify my weak areas and improve significantly.",
      author: "Alex Rodriguez, Business Student",
    },
    {
      text: "The flashcard system uses spaced repetition which helped me retain information long-term. Ace my finals thanks to Study Buddy!",
      author: "Jessica Patel, Law Student",
    },
    {
      text: "I love how Beeka AI adapts to my learning style. The personalized approach makes studying so much more effective.",
      author: "Emma Wilson, Psychology Major",
    },
    {
      text: "The note generation feature is incredible! It helped me organize my thoughts and create comprehensive study materials in minutes.",
      author: "David Kim, Engineering Student",
    },
  ];

  // Load folders from localStorage on component mount
  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex(prevIndex => (prevIndex + 1) % testimonials.length);
    }, 3000); // Change testimonial every 3 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const generateSpaceName = (type: string, content: string): string => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (type === 'chat') {
      return `Chat ${day}/${month}/${year} ${time}`;
    } else if (type === 'notes') {
      return `Note ${day}/${month}/${year} ${time}`;
    } else if (type === 'quiz') {
      return `Quiz ${day}/${month}/${year} ${time}`;
    } else if (type === 'flashcards') {
      return `FlashC ${day}/${month}/${year} ${time}`;
    } else if (type === 'solve') {
      return `Write ${day}/${month}/${year} ${time}`;
    }
    return `New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  const handleCreateFolder = async () => {
    if (folderName.trim()) {
      if (folders.some(folder => folder.name.toLowerCase() === folderName.toLowerCase())) {
        alert('A folder with that name already exists. Please use a different name.');
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: folderName, user_id: user?.uid || 'default' }),
        });
        if (!response.ok) throw new Error("Failed to create folder in backend");
        const data = await response.json();

        const newFolder: Folder = {
          id: data.id,
          name: folderName,
          resources: [],
          spaces: [],
        };
        setFolders([...folders, newFolder]);
        setFolderName('');
        setShowCreateFolder(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to create folder");
      }
    }
  };

  const handleHomeClick = () => {
    setSelectedFolder(null);
    setSelectedSpace(null);
    setShowFolderSidebar(false);
    setIsSidebarOpen(true);
  };

  const handleFolderClick = (folder: Folder) => {
    setSelectedFiles([]);
    setNotes('');
    setSelectedFolder(folder);
    setIsSidebarOpen(false);
    setShowResources(true);
    setShowFolderSidebar(true);
    setSelectedSpace(null);
  };

  const handleCreateSpace = async (type: 'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve') => {
    if (selectedFolder) {
      try {
        let spaceName = generateSpaceName(type, '');
        const requestBody = {
          type,
          name: spaceName,
          folder_id: selectedFolder.id,
        };
        const response = await fetch("http://localhost:8000/spaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || "Failed to create space");
        }
        const newSpace = await response.json();
        const updatedFolder = {
          ...selectedFolder,
          spaces: [...selectedFolder.spaces, newSpace]
        };
        setFolders(folders.map(folder =>
          folder.id === selectedFolder.id ? updatedFolder : folder
        ));
        setSelectedFolder(updatedFolder);
        setSelectedSpace(newSpace);
        setShowCreateSpace(false);
        setShowFolderSidebar(true);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to create space");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedFolder) {
      alert("Please select a folder first");
      return;
    }

    if (!file.type.includes('pdf')) {
      alert("Please upload PDF files only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8000/upload/${selectedFolder.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      console.log("Upload success:", data);

      const updatedFolder = {
        ...selectedFolder,
        resources: [
          ...selectedFolder.resources,
          { id: data.id, name: data.name },
        ],
      };

      setSelectedFolder(updatedFolder);
      setFolders(folders.map(folder =>
        folder.id === selectedFolder.id ? updatedFolder : folder
      ));

      setShowUploadModal(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSpaceClick = (space: Space) => {
    setSelectedSpace(space);
    setShowFolderSidebar(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      Array.from(e.dataTransfer.files).forEach(file => handleFileUpload(file));
    }
  };

  const handleSendMessage = async (message: string, context: string) => {
    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message, context }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to the AI service.");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error connecting to AI service:", error);
      throw error;
    }
  };

  const handleGenerateNotes = async (selectedFileIds: string[]) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const fileContents = await Promise.all(
          selectedFileIds.map(async (fileId) => {
            const response = await fetch(`http://localhost:8000/file-content/${fileId}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch content for file ID: ${fileId}`);
            }
            const data = await response.json();
            return data.content;
          })
        );

        const context = fileContents.join("\n\n---\n\n");

        const response = await fetch("http://localhost:8000/generate-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to generate notes");
        }

        const data = await response.json();
        
        if (!data.notes || data.notes.trim() === '') {
          throw new Error("Generated notes are empty");
        }
        
        if (selectedSpace && selectedSpace.type === 'notes') {
          // Get the first line of the notes for the space name
          const firstLine = data.notes.split('\n')[0].trim();
          const spaceName = firstLine.startsWith('#') ? firstLine.substring(1).trim() : firstLine;
          
          // Update the space in the database with new notes and name
          const updateResponse = await fetch(`http://localhost:8000/spaces/${selectedSpace.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...selectedSpace,
              name: spaceName,
              notes: data.notes
            }),
          });

          if (!updateResponse.ok) {
            throw new Error("Failed to update space with notes");
          }

          const updatedSpace = await updateResponse.json();
          setSelectedSpace(updatedSpace);
          
          if (selectedFolder) {
            const updatedSpaces = selectedFolder.spaces.map(space =>
              space.id === selectedSpace.id ? updatedSpace : space
            );
            
            const updatedFolder = { ...selectedFolder, spaces: updatedSpaces };
            setFolders(prev => prev.map(folder =>
              folder.id === selectedFolder.id ? updatedFolder : folder
            ));
          }
        }
        
        setNotes(data.notes);
        setShowFileSelector(false);
        return data.notes;
      } catch (error) {
        console.error(`Error generating notes (attempt ${retryCount + 1}/${maxRetries}):`, error);
        retryCount++;
        
        if (retryCount === maxRetries) {
          const errorMessage = "Failed to generate notes after multiple attempts. Please try again.";
          setNotes(errorMessage);
          throw new Error(errorMessage);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
      }
    }
  };

  const handleGenerateQuiz = async (selectedFileIds: string[], options: any) => {
    try {
      const response = await fetch("http://localhost:8000/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          file_ids: selectedFileIds,
          options: options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate quiz");
      }

      const data = await response.json();
      
      if (selectedSpace && selectedSpace.type === 'quiz') {
        const updatedSpace = { ...selectedSpace, notes: data.quiz };
        setSelectedSpace(updatedSpace);
        
        if (selectedFolder) {
          const updatedSpaces = selectedFolder.spaces.map(space =>
            space.id === selectedSpace.id ? updatedSpace : space
          );
          
          const updatedFolder = { ...selectedFolder, spaces: updatedSpaces };
          setFolders(prev => prev.map(folder =>
            folder.id === selectedFolder.id ? updatedFolder : folder
          ));
        }
      }
      
      return data.quiz;
    } catch (error) {
      console.error("Error generating quiz:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate quiz. Please try again.");
    }
  };

  const handleGenerateFlashcards = async (selectedFileIds: string[]) => {
    try {
      const response = await fetch("http://localhost:8000/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          file_ids: selectedFileIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate flashcards");
      }

      const data = await response.json();
      
      if (selectedSpace && selectedSpace.type === 'flashcards') {
        const updatedSpace = { ...selectedSpace, notes: data.flashcards };
        setSelectedSpace(updatedSpace);
        
        if (selectedFolder) {
          const updatedSpaces = selectedFolder.spaces.map(space =>
            space.id === selectedSpace.id ? updatedSpace : space
          );
          
          const updatedFolder = { ...selectedFolder, spaces: updatedSpaces };
          setFolders(prev => prev.map(folder =>
            folder.id === selectedFolder.id ? updatedFolder : folder
          ));
        }
      }
      
      return data.flashcards;
    } catch (error) {
      console.error("Error generating flashcards:", error);
      throw new Error(error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/folders/${folderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename folder");
      }

      setFolders(folders.map(folder =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      ));
      setEditingFolder(null);
    } catch (error) {
      console.error("Error renaming folder:", error);
      alert("Failed to rename folder. Please try again.");
    }
  };

  const handleRemoveFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to remove this folder? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove folder");
      }

      setFolders(folders.filter(folder => folder.id !== folderId));
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null);
        setShowFolderSidebar(false);
      }
    } catch (error) {
      console.error("Error removing folder:", error);
      alert("Failed to remove folder. Please try again.");
    }
  };

  const handleRenameSpace = async (spaceId: string, newName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename space");
      }

      setFolders(folders.map(folder => ({
        ...folder,
        spaces: folder.spaces.map(space =>
          space.id === spaceId ? { ...space, name: newName } : space
        )
      })));
      setEditingSpace(null);
    } catch (error) {
      console.error("Error renaming space:", error);
      alert("Failed to rename space. Please try again.");
    }
  };

  const handleRemoveSpace = async (spaceId: string) => {
    if (!window.confirm('Are you sure you want to remove this space? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove space");
      }

      setFolders(folders.map(folder => ({
        ...folder,
        spaces: folder.spaces.filter(space => space.id !== spaceId)
      })));
      if (selectedSpace?.id === spaceId) {
        setSelectedSpace(null);
      }
    } catch (error) {
      console.error("Error removing space:", error);
      alert("Failed to remove space. Please try again.");
    }
  };

  const updateSpaceName = async (spaceId: string, content: string) => {
    if (!selectedSpace) return;

    const newName = generateSpaceName(selectedSpace.type, content);
    if (newName === selectedSpace.name) return;

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedSpace,
          name: newName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update space name");
      }

      const updatedSpace = await response.json();
      setSelectedSpace(updatedSpace);

      if (selectedFolder) {
        const updatedSpaces = selectedFolder.spaces.map(space =>
          space.id === spaceId ? updatedSpace : space
        );
        const updatedFolder = { ...selectedFolder, spaces: updatedSpaces };
        setFolders(folders.map(folder =>
          folder.id === selectedFolder.id ? updatedFolder : folder
        ));
      }
    } catch (error) {
      console.error("Error updating space name:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user) return;
      // Additional cleanup if needed
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0B14]">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#12141F] text-white">
        <div className="flex items-center gap-2">
          {/* Unique SVG B Logo reflecting studying (open book + B) */}
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bStudyGradientMobile" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stop-color="#6EE7B7" />
                <stop offset="0.5" stop-color="#3B82F6" />
                <stop offset="1" stop-color="#A78BFA" />
              </linearGradient>
            </defs>
            <path d="M12 48 Q32 36 52 48 Q32 60 12 48 Z" fill="url(#bStudyGradientMobile)" opacity="0.7"/>
            <path d="M20 44 Q32 38 44 44" stroke="#fff" strokeWidth="2" fill="none"/>
            <polygon points="32,10 48,18 32,26 16,18" fill="url(#bStudyGradientMobile)" opacity="0.8"/>
            <path d="M28 20 v24 q0 4 4 4 h2 q8 0 8-8 q0-4-4-6 q4-2 4-6 q0-8-8-8 h-2 q-4 0-4 4 z M32 24 h2 q4 0 4 4 q0 4-4 4 h-2 z M32 36 h2 q4 0 4 4 q0 4-4 4 h-2 z" fill="#fff" stroke="url(#bStudyGradientMobile)" strokeWidth="1.5"/>
          </svg>
          <h1 className="text-xl font-bold">Beeka AI</h1>
        </div>
        <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Main Sidebar */}
      <div className={`${showMobileMenu ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 ${isSidebarOpen ? 'w-full md:w-64' : 'w-16'} 
        bg-[#12141F] text-white transition-all duration-300 flex flex-col fixed md:relative h-screen z-40`}>
        <div className="p-4 flex items-center justify-between md:justify-center border-b border-gray-700 sticky top-0 bg-[#12141F] z-10">
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                {/* Unique SVG B Logo reflecting studying (open book + B) */}
                <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bStudyGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#6EE7B7" />
                      <stop offset="0.5" stop-color="#3B82F6" />
                      <stop offset="1" stop-color="#A78BFA" />
                    </linearGradient>
                  </defs>
                  {/* Open book base */}
                  <path d="M12 48 Q32 36 52 48 Q32 60 12 48 Z" fill="url(#bStudyGradient)" opacity="0.7"/>
                  {/* Book pages */}
                  <path d="M20 44 Q32 38 44 44" stroke="#fff" strokeWidth="2" fill="none"/>
                  {/* Graduation cap (top) */}
                  <polygon points="32,10 48,18 32,26 16,18" fill="url(#bStudyGradient)" opacity="0.8"/>
                  {/* B letter (center, bold) */}
                  <path d="M28 20 v24 q0 4 4 4 h2 q8 0 8-8 q0-4-4-6 q4-2 4-6 q0-8-8-8 h-2 q-4 0-4 4 z M32 24 h2 q4 0 4 4 q0 4-4 4 h-2 z M32 36 h2 q4 0 4 4 q0 4-4 4 h-2 z" fill="#fff" stroke="url(#bStudyGradient)" strokeWidth="1.5"/>
                </svg>
                <h1 className="text-xl font-bold">Beeka AI</h1>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="md:hidden">
                <X size={24} />
              </button>
            </>
          ) : (
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="bStudyGradient2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#6EE7B7" />
                  <stop offset="0.5" stop-color="#3B82F6" />
                  <stop offset="1" stop-color="#A78BFA" />
                </linearGradient>
              </defs>
              <path d="M12 48 Q32 36 52 48 Q32 60 12 48 Z" fill="url(#bStudyGradient2)" opacity="0.7"/>
              <path d="M20 44 Q32 38 44 44" stroke="#fff" strokeWidth="2" fill="none"/>
              <polygon points="32,10 48,18 32,26 16,18" fill="url(#bStudyGradient2)" opacity="0.8"/>
              <path d="M28 20 v24 q0 4 4 4 h2 q8 0 8-8 q0-4-4-6 q4-2 4-6 q0-8-8-8 h-2 q-4 0-4 4 z M32 24 h2 q4 0 4 4 q0 4-4 4 h-2 z M32 36 h2 q4 0 4 4 q0 4-4 4 h-2 z" fill="#fff" stroke="url(#bStudyGradient2)" strokeWidth="1.5"/>
            </svg>
          )}
        </div>

        <div className="flex flex-col h-full overflow-hidden">
          <nav className="flex-1 overflow-y-auto py-4">
            <button 
              onClick={handleHomeClick}
              className="w-full p-4 flex items-center gap-3 hover:bg-[#1A1D2E] transition-colors"
            >
              <Home size={20} />
              {isSidebarOpen && <span>Home</span>}
            </button>

            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full p-4 flex items-center gap-3 hover:bg-[#1A1D2E] transition-colors"
            >
              <FolderPlus size={20} />
              {isSidebarOpen && <span>Create Folder</span>}
            </button>

            <div className="px-4 py-2">
              {folders.map(folder => (
                <div
                  key={folder.id}
                  className="relative"
                  onMouseEnter={() => setHoveredFolder(folder.id)}
                  onMouseLeave={() => setHoveredFolder(null)}
                >
                  <div
                    onClick={() => handleFolderClick(folder)}
                    className="w-full p-2 flex items-center justify-between hover:bg-[#1A1D2E] rounded transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} />
                      {editingFolder === folder.id ? (
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onBlur={() => {
                            if (newFolderName.trim()) {
                              handleRenameFolder(folder.id, newFolderName);
                            }
                            setEditingFolder(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                              handleRenameFolder(folder.id, newFolderName);
                              setEditingFolder(null);
                            }
                          }}
                          className="bg-[#2A2D3E] text-white px-2 py-1 rounded"
                          autoFocus
                        />
                      ) : (
                        <>
                          {isSidebarOpen && <span>{folder.name}</span>}
                        </>
                      )}
                    </div>
                    {hoveredFolder === folder.id && isSidebarOpen && (
                      <div className="relative">
                        <div 
                          className="p-1 hover:bg-[#2A2D3E] rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <MoreVertical size={16} />
                        </div>
                        <div className="absolute right-0 mt-1 bg-[#2A2D3E] rounded-lg shadow-lg py-1 w-32 hidden">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder.id);
                              setNewFolderName(folder.name);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm cursor-pointer"
                          >
                            Rename
                          </div>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFolder(folder.id);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm text-red-400 cursor-pointer"
                          >
                            Remove
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="mt-auto border-t border-gray-700 p-4 space-y-2">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full p-2 flex items-center gap-2 hover:bg-[#1A1D2E] rounded transition-colors"
            >
              <Menu size={20} />
              {isSidebarOpen && <span>Close Sidebar</span>}
            </button>

            <button
              onClick={() => setShowMobileAppModal(true)}
              className="w-full p-2 flex items-center gap-2 hover:bg-[#1A1D2E] rounded transition-colors"
            >
              <div className="p-1 rounded-full bg-gradient-to-r from-green-400 to-green-600">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              {isSidebarOpen && <span>Mobile App</span>}
            </button>

            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full p-2 flex items-center gap-2 hover:bg-[#1A1D2E] rounded transition-colors"
            >
              <div className="p-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              {isSidebarOpen && <span>Upgrade to Pro</span>}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full p-2 flex items-center gap-2 hover:bg-[#1A1D2E] rounded transition-colors"
              >
                <User size={20} />
                {isSidebarOpen && <span>Profile</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folder Sidebar */}
      {selectedFolder && showFolderSidebar && (
        <div className="w-64 bg-[#12141F] text-white p-6 border-r border-gray-700 h-screen overflow-hidden flex flex-col">
          <h2 className="text-2xl font-bold mb-6 sticky top-0 bg-[#12141F] z-10">{selectedFolder.name}</h2>
          <div className="space-y-4 overflow-y-auto flex-1">
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Add Files</span>
            </button>
            <button
              onClick={() => {
                if (selectedFolder && selectedFolder.resources.length > 0) {
                  setShowFilesList(true);
                }
              }}
              className="w-full py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg flex items-center gap-2"
            >
              <Eye size={18} />
              <span>View Resources</span>
            </button>

            <div className="w-full h-px bg-gray-700 my-6"></div>

            <button
              onClick={() => setShowCreateSpace(true)}
              className="w-full py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg"
            >
              Create Space
            </button>

            {/* Spaces List */}
            <div className="mt-4 space-y-2">
              {selectedFolder.spaces.map(space => (
                <div
                  key={space.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredSpace(space.id)}
                  onMouseLeave={() => setHoveredSpace(null)}
                >
                  <button
                    onClick={() => handleSpaceClick(space)}
                    className="w-full p-2 flex items-center justify-between hover:bg-[#1A1D2E] rounded text-left"
                  >
                    <div className="flex items-center gap-2">
                      {space.type === 'chat' && <MessageSquare size={16} />}
                      {space.type === 'notes' && <FileText size={16} />}
                      {space.type === 'quiz' && <HelpCircle size={16} />}
                      {editingSpace === space.id ? (
                        <input
                          type="text"
                          value={newSpaceName}
                          onChange={(e) => setNewSpaceName(e.target.value)}
                          onBlur={() => {
                            if (newSpaceName.trim()) {
                              handleRenameSpace(space.id, newSpaceName);
                            }
                            setEditingSpace(null);
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newSpaceName.trim()) {
                              handleRenameSpace(space.id, newSpaceName);
                              setEditingSpace(null);
                            }
                          }}
                          className="bg-[#2A2D3E] text-white px-2 py-1 rounded"
                          autoFocus
                        />
                      ) : (
                        <span>{space.name}</span>
                      )}
                    </div>
                    {hoveredSpace === space.id && (
                      <div className="relative">
                        <button 
                          className="p-1 hover:bg-[#2A2D3E] rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling as HTMLElement;
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        <div className="absolute right-0 mt-1 bg-[#2A2D3E] rounded-lg shadow-lg py-1 w-32 hidden">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSpace(space.id);
                              setNewSpaceName(space.name);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm"
                          >
                            Rename
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSpace(space.id);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-[#353849] text-sm text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:ml-0 mt-16 md:mt-0 h-screen overflow-hidden">
        {selectedSpace ? (
          <div className="h-full overflow-y-auto">
            {selectedSpace.type === 'chat' && (
              <AIChat
                spaceId={selectedSpace.id}
                pdfText={pdfText}
                messages={messages}
                message={message}
                setMessage={setMessage}
                setMessages={setMessages}
                setPdfText={setPdfText}
                resources={selectedFolder?.resources || []}
                onSendMessage={handleSendMessage}
                onMessageSent={(content) => updateSpaceName(selectedSpace.id, content)}
              />
            )}
            {selectedSpace.type === 'notes' && (
              <NotesGenerator
                resources={selectedFolder?.resources || []}
                onGenerate={handleGenerateNotes}
                initialNotes={selectedSpace.notes}
                onNotesGenerated={(content) => {
                  if (selectedSpace) {
                    updateSpaceName(selectedSpace.id, content);
                  }
                }}
                spaceId={selectedSpace.id}
              />
            )}
            {selectedSpace.type === 'quiz' && (
              <QuizGenerator
                resources={selectedFolder?.resources || []}
                onGenerate={handleGenerateQuiz}
                initialQuiz={selectedSpace.notes}
                onQuizGenerated={(content) => updateSpaceName(selectedSpace.id, content)}
                spaceId={selectedSpace.id}
              />
            )}
            {selectedSpace.type === 'flashcards' && (
              <FlashcardGenerator
                resources={selectedFolder?.resources || []}
                onGenerate={handleGenerateFlashcards}
                initialFlashcards={selectedSpace.notes}
                onFlashcardsGenerated={(content) => updateSpaceName(selectedSpace.id, content)}
                spaceId={selectedSpace.id}
              />
            )}
            {selectedSpace.type === 'solve' && (
              <div className="p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-4">Write</h2>
                <p>Coming Soon...</p>
              </div>
            )}
          </div>
        ) : selectedFolder ? (
          <div className="p-8">
            <ResourceManager
              folderId={selectedFolder.id}
              resources={selectedFolder?.resources || []}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto scrollbar-hide">
          <HomeView 
            onCreateFolder={() => setShowCreateFolder(true)}
            onCreateSpace={handleCreateSpace}
            folders={folders}
          />
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-lg p-6 w-full max-w-sm text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create a New Folder</h3>
              <button onClick={() => setShowCreateFolder(false)}>
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full p-2 bg-[#1A1D2E] border border-gray-700 rounded mb-4 text-white"
            />
            <button
              onClick={handleCreateFolder}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Create Space Modal */}
      {showCreateSpace && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-xl p-8 w-full max-w-4xl text-white">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Create Your Study Space</h3>
              <button onClick={() => setShowCreateSpace(false)} className="hover:bg-[#2A2D3E] p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleCreateSpace('chat')}
                className="bg-[#2A2D3E] hover:bg-[#353849] p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105 md:col-span-2"
              >
                <MessageSquare size={28} className="text-blue-400" />
                <h4 className="text-lg font-semibold">Chat with AI</h4>
                <p className="text-gray-400 text-sm">Get instant answers and explanations from your AI study buddy</p>
              </button>

              <button
                onClick={() => handleCreateSpace('notes')}
                className="bg-[#2A2D3E] hover:bg-[#353849] p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105"
              >
                <FileText size={24} className="text-green-400" />
                <h4 className="text-lg font-semibold">Generate Notes</h4>
                <p className="text-gray-400 text-sm">Create comprehensive study notes from your materials</p>
              </button>

              <button
                onClick={() => handleCreateSpace('quiz')}
                className="bg-[#2A2D3E] hover:bg-[#353849] p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105"
              >
                <HelpCircle size={24} className="text-purple-400" />
                <h4 className="text-lg font-semibold">Generate Questions</h4>
                <p className="text-gray-400 text-sm">Create practice questions to test your knowledge</p>
              </button>

              <button
                onClick={() => handleCreateSpace('flashcards')}
                className="bg-[#2A2D3E] hover:bg-[#353849] p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105"
              >
                <Brain size={24} className="text-yellow-400" />
                <h4 className="text-lg font-semibold">Flashcards</h4>
                <p className="text-gray-400 text-sm">Create and study with interactive flashcards</p>
              </button>

              <button
                onClick={() => handleCreateSpace('solve')}
                className="bg-[#2A2D3E] hover:bg-[#353849] p-4 rounded-xl flex flex-col items-center text-center gap-3 transition-all hover:scale-105"
              >
                <BookCheck size={24} className="text-red-400" />
                <h4 className="text-lg font-semibold">Write</h4>
                <p className="text-gray-400 text-sm">Write Essays, Reports, and more</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-lg p-6 w-full max-w-lg text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Resources</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? 'border-blue-500 bg-[#1A1D2E]' : 'border-gray-700'
                }`}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400">Uploading... {uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(file => handleFileUpload(file));
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-400 hover:text-blue-300"
                  >
                    Click to browse
                  </label>
                  <span className="text-gray-400"> or drag and drop PDFs here</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile App Modal */}
      {showMobileAppModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-xl p-8 max-w-md w-full text-white">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">Coming Soon!</h3>
              <p className="text-gray-400 mb-6">Our mobile app is currently under development. Stay tuned for the release!</p>
              <button
                onClick={() => setShowMobileAppModal(false)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-xl p-8 max-w-6xl w-full text-white">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Subscribe to Study Buddy AI!</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="hover:bg-[#2A2D3E] p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Section - Pricing */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => setSelectedPlan('yearly')}
                    className={`w-full p-4 rounded-xl flex items-center justify-between group relative ${selectedPlan === 'yearly' ? 'bg-[#353849] border border-blue-500' : 'bg-[#2A2D3E] hover:bg-[#353849]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'yearly' ? 'border-blue-500' : 'border-gray-600'}`}>
                        {selectedPlan === 'yearly' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                      <span className="font-medium">Yearly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">$25</span>
                      <span className="text-sm text-gray-400">/year</span>
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-500 text-xs px-2 py-1 rounded-full">
                      65% Cheaper
                    </div>
                  </button>

                  <button 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`w-full p-4 rounded-xl flex items-center justify-between ${selectedPlan === 'monthly' ? 'bg-[#353849] border border-blue-500' : 'bg-[#2A2D3E] hover:bg-[#353849]'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-blue-500' : 'border-gray-600'}`}>
                        {selectedPlan === 'monthly' && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
                      </div>
                      <span className="font-medium">Monthly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">$6</span>
                      <span className="text-sm text-gray-400">/month</span>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={() => redirectToStripeCheckout(selectedPlan)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
                >
                  Upgrade Now
                </button>
              </div>

              {/* Right Section - Feature Comparison */}
              <div className="bg-[#1A1D2E] rounded-xl p-6">
                <div className="grid grid-cols-[minmax(0,_1fr)_auto_auto] gap-4 mb-6 items-center">
                  <div></div> {/* Empty cell for the first column in the header row */}
                  <div className="text-center text-lg font-semibold">Free</div>
                  <div className="text-center text-lg font-semibold">Pro</div>
                </div>

                <div className="space-y-6">
                  {/* Unlimited Space */}
                  <div className="grid grid-cols-[minmax(0,_1fr)_auto_auto] gap-4 items-center">
                    <span className="text-base font-bold">Unlimited Space</span>
                    <div className="flex justify-center">
                      <X size={20} className="text-red-500" />
                    </div>
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Unlimited Chat */}
                  <div className="grid grid-cols-[minmax(0,_1fr)_auto_auto] gap-4 items-center">
                    <span className="text-base font-bold">Unlimited Chat</span>
                    <div className="flex justify-center">
                      <X size={20} className="text-red-500" />
                    </div>
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Unlimited Upload */}
                  <div className="grid grid-cols-[minmax(0,_1fr)_auto_auto] gap-4 items-center">
                    <span className="text-base font-bold">Unlimited Upload</span>
                    <div className="flex justify-center">
                      <X size={20} className="text-red-500" />
                    </div>
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Section */}
            <div className="mt-8 text-center text-gray-400 italic">
              {testimonials[currentTestimonialIndex].text}
              <p className="mt-2 not-italic font-semibold text-white">- {testimonials[currentTestimonialIndex].author}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-lg p-6 w-full max-w-sm text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Profile</h3>
              <div className="relative">
                <button 
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showMoreOptions && (
                  <div className="absolute right-0 top-full mt-2 bg-[#1A1D2E] rounded-lg shadow-lg py-1 w-48">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoreOptions(false);
                        setShowDeleteAccountModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2A2D3E] text-sm"
                    >
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 bg-[#1A1D2E] rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-xl font-semibold text-white">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-white">{user?.email}</p>
                <p className="text-sm text-gray-400">Free Plan</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowUpgradeModal(true);
                }}
                className="w-full py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg flex items-center gap-2"
              >
                <div className="p-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
                <span>Upgrade to Pro</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowLogoutConfirmModal(true);
                }}
                className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>

              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-lg p-6 w-full max-w-md text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Delete Account</h3>
              <button onClick={() => setShowDeleteAccountModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-400 mb-4">Are you sure you want to delete your account? This action cannot be undone.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Why are you deleting your account?</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full p-3 bg-[#1A1D2E] border border-gray-700 rounded-lg text-white resize-none h-32"
                placeholder="Please let us know your reason..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setShowProfileMenu(false);
                }}
                className="flex-1 py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg"
              >
                Get Help Instead
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-lg p-6 w-full max-w-sm text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Logout</h3>
              <button onClick={() => setShowLogoutConfirmModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-400 mb-6">Are you sure you want to logout?</p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-2 px-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  handleLogout();
                }}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 