import { useState, useRef, useCallback, useEffect } from 'react';
import { FileText, Loader2, Check, X, BookOpen, Search, AlertCircle, ChevronRight, ChevronLeft, Send, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ComponentPropsWithoutRef } from 'react';
import { Components } from 'react-markdown';
import { SyntaxHighlighterProps } from 'react-syntax-highlighter';

interface CodeProps extends ComponentPropsWithoutRef<'code'> {
    inline?: boolean;
}

interface NotesGeneratorProps {
    resources: Array<{ id: string; name: string }>;
    onGenerate: (selectedFileIds: string[]) => Promise<string>;
    initialNotes?: string;
    onNotesGenerated?: (content: string) => void;
    spaceId: string;
}

interface Message {
    id?: string;
    space_id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: string;
}

export default function NotesGenerator({ resources, onGenerate, initialNotes, onNotesGenerated, spaceId }: NotesGeneratorProps) {
    const [notes, setNotes] = useState<string>(initialNotes || "");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showFileSelector, setShowFileSelector] = useState(!initialNotes);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [chatWidth, setChatWidth] = useState(384);
    const [generationStep, setGenerationStep] = useState<'idle' | 'reading' | 'generating' | 'complete'>('idle');
    const [firstFileName, setFirstFileName] = useState<string>("");
    const isResizing = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    // Update notes when initialNotes changes
    useEffect(() => {
        if (initialNotes) {
            setNotes(initialNotes);
            setShowFileSelector(false);
        }
    }, [initialNotes, spaceId]);

    // Load existing notes for this space when component mounts
    useEffect(() => {
        const loadSpaceNotes = async () => {
            try {
                const response = await fetch(`http://localhost:8000/spaces/${spaceId}`);
                if (response.ok) {
                    const spaceData = await response.json();
                    if (spaceData.notes) {
                        setNotes(spaceData.notes);
                        setShowFileSelector(false);
                    }
                }
            } catch (error) {
                console.error("Error loading space notes:", error);
            }
        };

        if (spaceId) {
            loadSpaceNotes();
        }
    }, [spaceId]);

    const filteredResources = resources.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const handleGenerateNotes = async () => {
        if (selectedFiles.length === 0) {
            setError("Please select at least one file");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGenerationStep('reading');

        try {
            const generatedNotes = await onGenerate(selectedFiles);
            const selectedFileNames = resources
                .filter(r => selectedFiles.includes(r.id))
                .map(r => r.name);

            // Store the first file name for the subtitle
            if (selectedFileNames.length > 0) {
                setFirstFileName(selectedFileNames[0].replace('.pdf', ''));
            }

            // Format notes with file titles
            const formattedNotes = `# Generated Study Notes\n\n${selectedFileNames.map((name, index) => (
                `## File ${index + 1}: ${name.replace('.pdf', '')}\n\n${generatedNotes.split('---').length > index
                    ? generatedNotes.split('---')[index].trim()
                    : ''
                }\n\n`
            )).join('---\n\n')}`;

            setNotes(formattedNotes);
            setShowFileSelector(false);
            setMessages([]);
            setGenerationStep('complete');
            
            if (onNotesGenerated) {
                onNotesGenerated(formattedNotes);
            }

            // Update the space with the new notes
            try {
                const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        notes: formattedNotes
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update space with notes');
                }
            } catch (error) {
                console.error("Error updating space with notes:", error);
            }
        } catch (error) {
            console.error("Error generating notes:", error);
            setError(error instanceof Error ? error.message : "Failed to generate notes");
            setGenerationStep('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !notes) return;

        const userMessage = {
            space_id: spaceId,
            role: 'user' as const,
            content: currentMessage,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage("");

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentMessage,
                    context: notes
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            const aiMessage = {
                space_id: spaceId,
                role: 'ai' as const,
                content: data.response,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                space_id: spaceId,
                role: 'ai' as const,
                content: 'Sorry, I encountered an error processing your message.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    const startResizing = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        startX.current = e.pageX;
        startWidth.current = chatWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [chatWidth]);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;

        const newWidth = startWidth.current - (e.pageX - startX.current);
        setChatWidth(Math.min(Math.max(320, newWidth), 640));
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
        return () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Custom render function for code blocks in main notes area
    const renderMainNotesCode = ({ inline, className, children, ...props }: CodeProps) => {
        const match = /language-(\w+)/.exec(className || '');
        return !inline && match ? (
            <SyntaxHighlighter
                style={vscDarkPlus as any}
                language={match[1]}
                PreTag="div"
                {...props as SyntaxHighlighterProps}
            >
                {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
        ) : (
            <code className="bg-[#2A2D3E] px-1 py-0.5 rounded" {...props}>
                {children}
            </code>
        );
    };

    // Custom render function for code blocks in chat sidebar
    const renderChatCode = ({ inline, className, children, ...props }: CodeProps) => {
        const match = /language-(\w+)/.exec(className || '');
        if (!match) {
            return <code className="bg-[#12141F] px-1 rounded text-pink-400" {...props}>{children}</code>;
        }
        return (
            <div className="rounded !bg-[#12141F] !p-2 my-2 text-sm">
                <SyntaxHighlighter
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    {...props as SyntaxHighlighterProps}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
        );
    };

    // Define custom components for ReactMarkdown in the main notes area
    const mainNotesComponents: Components = {
        h1: ({ ...props }) => <h1 className="text-3xl font-bold mb-6 pb-2 border-b border-gray-700" {...props} />,
        h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
        p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
        strong: ({ ...props }) => <strong className="text-blue-400 font-bold" {...props} />,
        em: ({ ...props }) => <em className="text-yellow-400" {...props} />,
        code: renderMainNotesCode as Components['code'],
    };

    // Define custom components for ReactMarkdown in the chat sidebar
    const chatComponents: Components = {
         p: ({ children }) => <p className="text-sm">{children}</p>,
         code: renderChatCode as Components['code'],
     };


    return (
        <div className="min-h-screen bg-[#0A0B14] text-white">
            <div className="flex h-screen overflow-hidden">
                {/* Main Notes Area */}
                <div className="flex-1 flex flex-col">
                    <div className="p-4 md:p-8 flex justify-between items-center border-b border-gray-700">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                                <FileText className="text-blue-400" />
                                {notes ? 'Generated Study Notes' : 'Study Notes Generator'}
                            </h1>
                            <p className="text-gray-400 mt-2">
                                {notes ? firstFileName : 'Transform your resources into comprehensive study notes'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {notes ? (
                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
                                >
                                    <MessageSquare size={20} />
                                    Chat with AI
                                </button>
                            ) : (
                            <button
                                onClick={() => setShowFileSelector(true)}
                                disabled={resources.length === 0}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                            >
                                <FileText size={20} />
                                Select & Generate
                            </button>
                            )}
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
                            >
                                {showChat ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
                                <p className="text-gray-400">
                                    {generationStep === 'reading' ? 'Reading your resources...' : 'Generating notes...'}
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <AlertCircle className="text-red-400 mb-4" size={48} />
                                <p className="text-red-400">{error}</p>
                            </div>
                        ) : notes ? (
                            <div className="prose prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={mainNotesComponents}
                                >
                                    {notes}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <FileText className="text-gray-400 mb-4" size={48} />
                                <p className="text-gray-400">Select files to generate study notes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && notes && (
                    <div
                        className="border-l border-gray-700 flex flex-col h-screen relative"
                        style={{ width: chatWidth }}
                    >
                        {/* Resize Handle */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                            onMouseDown={startResizing}
                        />

                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Chat with AI</h3>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-2 hover:bg-[#2A2D3E] rounded-lg transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`${msg.role === 'user' ? 'ml-auto bg-blue-600' : 'mr-auto bg-[#2A2D3E]'
                                        } max-w-[80%] rounded-lg p-3`}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={chatComponents}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Ask about your notes..."
                                    className="flex-1 bg-[#2A2D3E] border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                    disabled={!notes}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!currentMessage.trim() || !notes}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* File Selection Modal */}
            {showFileSelector && (resources.length > 0) && ( 
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1D2E] rounded-xl w-full max-w-2xl">
                        <div className="p-6 border-b border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">Select Study Materials</h3>
                                <button
                                    onClick={() => setShowFileSelector(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[#12141F] rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="max-h-[40vh] overflow-y-auto mb-6 space-y-2">
                                {filteredResources.map(file => (
                                    <div
                                        key={file.id}
                                        onClick={() => toggleFileSelection(file.id)}
                                        className={`p-4 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${selectedFiles.includes(file.id)
                                                ? 'bg-blue-600'
                                                : 'bg-[#12141F] hover:bg-[#2A2D3E]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen size={20} className="text-gray-400" />
                                            <span>{file.name}</span>
                                        </div>
                                        {selectedFiles.includes(file.id) && (
                                            <Check size={20} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowFileSelector(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleGenerateNotes}
                                    disabled={selectedFiles.length === 0 || isGenerating}
                                    className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                                        selectedFiles.length === 0 || isGenerating
                                            ? 'bg-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <>\n                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>\n                                            <FileText size={20} />
                                            <span>Generate Notes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
             {showFileSelector && resources.length === 0 && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1D2E] rounded-xl w-full max-w-2xl">
                        <div className="p-6 text-center">
                            <AlertCircle size={40} className="text-yellow-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Resources Available</h3>
                            <p className="text-gray-400 mb-6">Please upload some documents in the Resource Manager to generate notes.</p>
                            <button
                                onClick={() => setShowFileSelector(false)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}