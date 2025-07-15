import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, X, Loader2 } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardGeneratorProps {
  resources: Resource[];
  onGenerate: (fileIds: string[], options: { num_flashcards: number }) => Promise<string>;
  initialFlashcards?: string;
  onFlashcardsGenerated?: (content: string) => void;
  spaceId: string;
}

interface Message {
  id?: string;
  space_id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

const FlashcardGenerator: React.FC<FlashcardGeneratorProps> = ({
  resources,
  onGenerate,
  initialFlashcards,
  onFlashcardsGenerated,
  spaceId,
}) => {
  const [showModal, setShowModal] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numFlashcards, setNumFlashcards] = useState(5);
  const [generationStep, setGenerationStep] = useState<'idle' | 'reading' | 'generating' | 'complete'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStep('reading');

    try {
      const content = await onGenerate(selectedFiles, { num_flashcards: numFlashcards });
      const parsedFlashcards = parseFlashcards(content);
      setFlashcards(parsedFlashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      if (onFlashcardsGenerated) {
        onFlashcardsGenerated(content);
      }
      setGenerationStep('complete');
      setShowModal(false);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate flashcards. Please try again.');
      setGenerationStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const parseFlashcards = (content: string): Flashcard[] => {
    const cards: Flashcard[] = [];
    const lines = content.split('\n');
    let currentCard: Partial<Flashcard> = {};

    for (const line of lines) {
      if (line.startsWith('Front:')) {
        if (currentCard.front && currentCard.back) {
          cards.push(currentCard as Flashcard);
        }
        currentCard = {
          id: Math.random().toString(36).substr(2, 9),
          front: line.replace('Front:', '').trim(),
        };
      } else if (line.startsWith('Back:')) {
        currentCard.back = line.replace('Back:', '').trim();
      }
    }

    if (currentCard.front && currentCard.back) {
      cards.push(currentCard as Flashcard);
    }

    return cards;
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(false);
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !flashcards.length) return;

    const userMessage = {
      space_id: spaceId,
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          context: flashcards.map(card => `${card.front}\n${card.back}`).join('\n\n')
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

  return (
    <div className="h-full flex flex-col bg-[#0A0B14] text-white">
      {showModal ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-xl p-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Create Flashcards</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-[#2A2D3E] p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
                <p className="text-gray-400">
                  {generationStep === 'reading' ? 'Reading your resources...' : 'Generating flashcards...'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Select Files</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {resources.map((resource) => (
                      <label key={resource.id} className="flex items-center space-x-2 p-2 hover:bg-[#2A2D3E] rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(resource.id)}
                          onChange={() => toggleFileSelection(resource.id)}
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span>{resource.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Number of Flashcards</h4>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={numFlashcards}
                      onChange={(e) => setNumFlashcards(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-lg font-semibold">{numFlashcards}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedFiles.length === 0}
                    className="px-6 py-2 bg-blue-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {generationStep === 'reading' ? 'Reading Files...' :
                         generationStep === 'generating' ? 'Generating Flashcards...' : 'Loading...'}
                      </>
                    ) : (
                      'Generate Flashcards'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
            {flashcards.length === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Generate Flashcards
              </button>
            )}
          </div>

          {/* Flashcards */}
          {flashcards.length > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-full max-w-2xl">
                {/* Progress */}
                <div className="text-center mb-4">
                  Card {currentIndex + 1} of {flashcards.length}
                </div>

                {/* Flashcard */}
                <div
                  className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div
                    className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* Front */}
                    <div className="absolute w-full h-full bg-[#1A1D2E] rounded-xl p-8 backface-hidden">
                      <div className="h-full flex items-center justify-center text-center">
                        <p className="text-xl">{flashcards[currentIndex].front}</p>
                      </div>
                    </div>

                    {/* Back */}
                    <div className="absolute w-full h-full bg-[#2A2D3E] rounded-xl p-8 backface-hidden rotate-y-180">
                      <div className="h-full flex items-center justify-center text-center">
                        <p className="text-xl">{flashcards[currentIndex].back}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-full bg-[#1A1D2E] hover:bg-[#2A2D3E] transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleShuffle}
                    className="p-2 rounded-full bg-[#1A1D2E] hover:bg-[#2A2D3E] transition-colors"
                  >
                    <Shuffle size={24} />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-full bg-[#1A1D2E] hover:bg-[#2A2D3E] transition-colors"
                  >
                    <RotateCcw size={24} />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === flashcards.length - 1}
                    className="p-2 rounded-full bg-[#1A1D2E] hover:bg-[#2A2D3E] transition-colors disabled:opacity-50"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashcardGenerator; 