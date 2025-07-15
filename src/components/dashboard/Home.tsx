import { useState } from 'react';
import { MessageSquare, FileText, HelpCircle, BookOpen, FolderPlus, ChevronLeft, ChevronRight, Brain, BookCheck, X } from 'lucide-react';

interface HomeProps {
  onCreateFolder: () => void;
  onCreateSpace: (type: 'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve') => void;
  folders: Array<{ id: string; name: string; spaces: Array<{ id: string; type: string; name: string }> }>;
}

export default function Home({ onCreateFolder, onCreateSpace, folders }: HomeProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showFolderSelector , setShowFolderSelector] = useState(false);
  const [selectedSpaceType, setSelectedSpaceType] = useState<'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve' | null>(null);
  
  const handleScroll = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  const handleSpaceClick = (type: 'chat' | 'notes' | 'quiz' | 'flashcards' | 'solve') => {
    setSelectedSpaceType(type);
    setShowFolderSelector(true);
  };

  const handleFolderSelect = (folderId: string) => {
    if (selectedSpaceType) {
      onCreateSpace(selectedSpaceType);
      setShowFolderSelector(false);
      setSelectedSpaceType(null);
    }
  };

  return (
    <div className="px-8 py-12 max-w-6xl mx-auto overflow-y-auto h-[calc(100vh-4rem)]">
      {/* Main Actions */}
      <div className="mb-12">
        <div className="w-1/2 mb-6">
          <button
            onClick={() => handleSpaceClick('chat')}
            className="w-full bg-[#1A1D2E] hover:bg-[#2A2D3E] p-6 rounded-xl text-left transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-3 text-xl font-semibold text-white mb-2">
              <MessageSquare className="text-blue-400" />
              Chat with AI
            </div>
            <p className="text-gray-400">Get instant help and explanations from your AI study buddy</p>
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-6">Study Guide</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => handleSpaceClick('notes')}
            className="bg-[#1A1D2E] hover:bg-[#2A2D3E] p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
              <FileText className="text-green-400" />
              Generate Notes
            </div>
            <p className="text-sm text-gray-400">Create AI-powered study notes</p>
          </button>

          <button
            onClick={() => handleSpaceClick('quiz')}
            className="bg-[#1A1D2E] hover:bg-[#2A2D3E] p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
              <HelpCircle className="text-purple-400" />
              Quiz
            </div>
            <p className="text-sm text-gray-400">Test your knowledge</p>
          </button>

          <button
            onClick={() => handleSpaceClick('flashcards')}
            className="bg-[#1A1D2E] hover:bg-[#2A2D3E] p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
              <Brain className="text-yellow-400" />
              Flashcards
            </div>
            <p className="text-sm text-gray-400">Review with smart flashcards</p>
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-6">Write</h2>
        <div className="w-1/2">
          <button
            onClick={() => handleSpaceClick('solve')}
            className="bg-[#1A1D2E] hover:bg-[#2A2D3E] p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
              <BookCheck className="text-red-400" />
              Solve
            </div>
            <p className="text-sm text-gray-400">Write Essays, Reports, and more</p>
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
        
        <div className="relative group">
          <button
            onClick={() => handleScroll('left', 'sessions-container')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#1A1D2E]/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="text-white" />
          </button>
          
          <div
            id="sessions-container"
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
          >
            {folders.flatMap(folder => 
              folder.spaces.map(space => (
                <div
                  key={space.id}
                  onClick={() => handleSpaceClick(space.type as any)}
                  className="min-w-[250px] bg-[#1A1D2E] p-6 rounded-xl cursor-pointer hover:bg-[#2A2D3E] transition-all hover:scale-[1.02]"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{space.name}</h3>
                  <p className="text-sm text-gray-400">Folder: {folder.name}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => handleScroll('right', 'sessions-container')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#1A1D2E]/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="text-white" />
          </button>
        </div>
      </div>

      {/* My Folders */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">My Folders</h2>
        <div className="relative group">
          <button
            onClick={() => handleScroll('left', 'folders-container')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#1A1D2E]/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="text-white" />
          </button>

          <div
            id="folders-container"
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth hide-scrollbar"
          >
            <button
              onClick={onCreateFolder}
              className="min-w-[250px] bg-[#1A1D2E] p-6 rounded-xl cursor-pointer hover:bg-[#2A2D3E] transition-all hover:scale-[1.02] text-left"
            >
              <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
                <FolderPlus className="text-orange-400" />
                Create Folder
              </div>
              <p className="text-sm text-gray-400">Organize your study materials</p>
            </button>

            {folders.map(folder => (
              <div
                key={folder.id}
                className="min-w-[250px] bg-[#1A1D2E] p-6 rounded-xl cursor-pointer hover:bg-[#2A2D3E] transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 text-lg font-semibold text-white mb-2">
                  <BookOpen className="text-blue-400" />
                  {folder.name}
                </div>
                <p className="text-sm text-gray-400">{folder.spaces.length} spaces</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleScroll('right', 'folders-container')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#1A1D3E]/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="text-white" />
          </button>
        </div>
      </div>

      {/* Folder Selector Modal */}
      {showFolderSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A1D2E] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Select a Folder</h3>
              <button onClick={() => setShowFolderSelector(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderSelect(folder.id)}
                  className="w-full p-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className="text-blue-400" />
                    <span className="text-white">{folder.name}</span>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowFolderSelector(false);
                  onCreateFolder();
                }}
                className="w-full p-4 bg-[#2A2D3E] hover:bg-[#353849] rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderPlus size={20} className="text-orange-400" />
                  <span className="text-white">Create New Folder</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
