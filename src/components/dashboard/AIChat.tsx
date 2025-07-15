import { useState, useRef, useEffect } from 'react';
import { Send, Upload, X, Check, Clipboard } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

interface Resource {
  id: string;
  name: string;
}

interface AIChatProps {
  spaceId: string;
  pdfText: string;
  messages: Message[];
  message: string;
  setMessage: (message: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setPdfText: (text: string) => void;
  resources: Resource[];
  onSendMessage: (message: string, context: string) => Promise<string>;
  onMessageSent: (content: string) => void;
}

interface FileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Array<{ id: string; name: string }>;
  onSelect: (selectedIds: string[]) => void;
}

function FileSelectionModal({ isOpen, onClose, resources, onSelect }: FileSelectionModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFile = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(fileId => fileId !== id)
        : [...prev, id]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#12141F] rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Select Files</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 bg-[#1A1D2E] border border-gray-700 rounded text-white"
        />

        <div className="max-h-[60vh] overflow-y-auto mb-4">
          {filteredResources.map(file => (
            <div
              key={file.id}
              onClick={() => toggleFile(file.id)}
              className={`p-4 mb-2 rounded-lg cursor-pointer flex items-center justify-between ${
                selectedIds.includes(file.id)
                  ? 'bg-blue-600'
                  : 'bg-[#1A1D2E] hover:bg-[#2A2D3E]'
              }`}
            >
              <span className="text-white">{file.name}</span>
              {selectedIds.includes(file.id) && <Check size={20} className="text-white" />}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSelect(selectedIds);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Add Files ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIChat({
  spaceId,
  pdfText,
  messages,
  message,
  setMessage,
  setMessages,
  setPdfText,
  resources,
  onSendMessage,
  onMessageSent,
}: AIChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load messages when space changes
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    loadMessages();
  }, [spaceId, setMessages]);

  const handleFileSelection = async (selectedIds: string[]) => {
    try {
      const fileContents = await Promise.all(
        selectedIds.map(async (fileId) => {
          const response = await fetch(`http://localhost:8000/file-content/${fileId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch content for file ID: ${fileId}`);
          }
          const data = await response.json();
          return data.content;
        })
      );

      const combinedContext = fileContents.join('\n\n---\n\n');
      
      const selectedFiles = resources.filter(resource => selectedIds.includes(resource.id));
      const fileNames = selectedFiles.map(file => file.name).join(', ');
      
      // Add system message about selected files
      const systemMessage = {
        role: 'system' as const,
        content: `Selected files for context: ${fileNames}`
      };

      const response = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemMessage)
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
      }

      setPdfText(combinedContext);
    } catch (error) {
      console.error('Error loading file contents:', error);
      const errorMessage = {
        role: 'system' as const,
        content: 'Failed to load file contents. Please try again.'
      };

      const response = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorMessage)
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    const userMessage = {
      space_id: spaceId,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };

    try {
      // Save user message
      const userResponse = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessage)
      });

      if (!userResponse.ok) {
        throw new Error('Failed to save user message');
      }

      const savedUserMessage = await userResponse.json();
      setMessages(prev => [...prev, savedUserMessage]);
      setMessage('');

      // Get AI response
      const context = pdfText || '';
      const aiResponse = await onSendMessage(message, context);
      
      if (!aiResponse) {
        throw new Error('No response received from the server');
      }
      
      // Save AI message
      const aiMessage = {
        space_id: spaceId,
        role: 'ai' as const,
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      const aiResponse2 = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMessage)
      });

      if (!aiResponse2.ok) {
        throw new Error('Failed to save AI message');
      }

      const savedAiMessage = await aiResponse2.json();
      setMessages(prev => [...prev, savedAiMessage]);
      
      // Update space name based on the user's message
      onMessageSent(message);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to connect')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('No response')) {
          errorMessage = 'The server did not respond. Please try again in a moment.';
        }
      }
      
      // Save error message
      const errorResponse = {
        space_id: spaceId,
        role: 'ai' as const,
        content: errorMessage,
        timestamp: new Date().toISOString()
      };
      const errorResponse2 = await fetch(`http://localhost:8000/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorResponse)
      });

      if (errorResponse2.ok) {
        const savedErrorMessage = await errorResponse2.json();
        setMessages(prev => [...prev, savedErrorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12141F]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-white mb-8">How can I help you today?</h1>
          <div className="w-full max-w-2xl px-4">
            <div className="relative bg-[#1A1D2E] rounded-lg p-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <button 
                  onClick={() => setShowFileSelector(true)}
                  className="p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
                >
                  <Upload size={20} className="text-gray-400" />
                </button>
              </div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-white py-3 px-12 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div
              className="max-w-4xl mx-auto p-4 space-y-4"
            >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl group relative ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white ml-auto mr-3'
                      : 'bg-[#1A1D2E] text-white mr-auto ml-3'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="whitespace-pre-wrap mr-2">{msg.content}</p>
                    {msg.role !== 'system' && (
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-white p-1 rounded"
                        title="Copy message"
                      >
                        <Clipboard size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1A1D2E] text-white p-3 rounded-xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="relative max-w-4xl mx-auto bg-[#1A1D2E] rounded-md p-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <button 
                  onClick={() => setShowFileSelector(true)}
                  className="p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
                >
                  <Upload size={20} className="text-gray-400" />
                </button>
              </div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full bg-transparent text-white py-3 px-12 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !message.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 disabled:text-gray-500 p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      )}
      <FileSelectionModal
        isOpen={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        resources={resources}
        onSelect={handleFileSelection}
      />
    </div>
  );
}