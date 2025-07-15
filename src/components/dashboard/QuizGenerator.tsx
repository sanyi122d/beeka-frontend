import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface QuizGeneratorProps {
  resources: Array<{ id: string; name: string }>;
  onGenerate: (selectedFileIds: string[], options: any) => Promise<string>;
  initialQuiz?: string;
  onQuizGenerated: (content: string) => void;
  spaceId: string;
}

interface QuizOptions {
  numQuestions: number;
  questionTypes: {
    trueFalse: boolean;
    multipleChoice: boolean;
    fillInBlank: boolean;
    shortAnswer: boolean;
  };
}

interface QuizQuestion {
  question: string;
  answer: string;
  type: string;
}

interface Message {
  id?: string;
  space_id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: string;
}

export default function QuizGenerator({ resources, onGenerate, initialQuiz, onQuizGenerated, spaceId }: QuizGeneratorProps) {
  const [showModal, setShowModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizContent, setQuizContent] = useState<string>(initialQuiz || '');
  const [quizOptions, setQuizOptions] = useState<QuizOptions>({
    numQuestions: 5,
    questionTypes: {
      trueFalse: true,
      multipleChoice: true,
      fillInBlank: true,
      shortAnswer: true,
    }
  });
  const [generationStep, setGenerationStep] = useState<'idle' | 'reading' | 'generating' | 'complete'>('idle');
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>({});
  const [messages, setMessages] = useState<Message[]>([]);

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleGenerateQuiz = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (Object.values(quizOptions.questionTypes).every(v => !v)) {
      setError('Please select at least one question type');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGenerationStep('reading');
    setQuizContent(''); // Clear existing quiz content

    try {
      const formattedOptions = {
        num_questions: quizOptions.numQuestions,
        question_types: {
          trueFalse: quizOptions.questionTypes.trueFalse,
          fillInBlank: quizOptions.questionTypes.fillInBlank,
          shortAnswer: quizOptions.questionTypes.shortAnswer,
        }
      };

      const quiz = await onGenerate(selectedFiles, formattedOptions);
      if (!quiz) {
        throw new Error('No quiz content received');
      }
      
      setQuizContent(quiz);
      onQuizGenerated(quiz);
      setGenerationStep('complete');
      setShowModal(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.');
      setGenerationStep('idle');
      setShowModal(true); // Keep modal open on error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAnswer = (questionIndex: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const parseQuizContent = (content: string): QuizQuestion[] => {
    const questions: QuizQuestion[] = [];
    const lines = content.split('\n');
    let currentQuestion: Partial<QuizQuestion> = {};
    let currentOptions: string[] = [];
    let isAnswerSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# Answer Key')) {
        isAnswerSection = true;
        continue;
      }

      if (!isAnswerSection) {
        if (line.startsWith('Question Type:')) {
          if (currentQuestion.question) {
            if (currentOptions.length > 0) {
              currentQuestion.question += '\n\nOptions:\n' + currentOptions.join('\n');
            }
            questions.push(currentQuestion as QuizQuestion);
          }
          currentQuestion = {
            type: line.replace('Question Type:', '').trim(),
            question: '',
            answer: ''
          };
          currentOptions = [];
        } else if (line.startsWith('Question:')) {
          currentQuestion.question = line.replace('Question:', '').trim();
        } else if (line.startsWith('Options:')) {
          // Skip the "Options:" line itself
          continue;
        } else if (line.match(/^[A-D]\./)) {
          currentOptions.push(line);
        } else if (line.startsWith('Answer:')) {
          currentQuestion.answer = line.replace('Answer:', '').trim();
        } else if (currentQuestion.question && line) {
          currentQuestion.question += '\n' + line;
        }
      } else if (line.match(/^\d+\./)) {
        const answerIndex = questions.findIndex(q => !q.answer);
        if (answerIndex !== -1) {
          questions[answerIndex].answer = line.replace(/^\d+\.\s*/, '');
        }
      }
    }

    if (currentQuestion.question) {
      if (currentOptions.length > 0) {
        currentQuestion.question += '\n\nOptions:\n' + currentOptions.join('\n');
      }
      questions.push(currentQuestion as QuizQuestion);
    }

    return questions;
  };

  const questions = parseQuizContent(quizContent);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !quizContent) return;

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
          context: quizContent
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
    <div className="h-full bg-[#0A0B14] text-white p-8">
      {showModal ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#12141F] rounded-xl p-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Create Quiz</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-[#2A2D3E] p-2 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-blue-400 mb-4" size={48} />
                <p className="text-gray-400">
                  {generationStep === 'reading' ? 'Reading your resources...' : 'Generating quiz...'}
                </p>
              </div>
            ) : (
              <>
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">1</div>
                      <h4 className="text-lg font-semibold">Select Resources</h4>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 bg-[#1A1D2E] border border-gray-700 rounded-lg"
                      />

                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredResources.map(resource => (
                          <div
                            key={resource.id}
                            onClick={() => toggleFileSelection(resource.id)}
                            className={`w-full p-3 flex items-center gap-3 rounded-lg transition-colors cursor-pointer ${
                              selectedFiles.includes(resource.id)
                                ? 'bg-blue-600/20 border border-blue-600'
                                : 'bg-[#1A1D2E] hover:bg-[#2A2D3E]'
                            }`}
                          >
                            <FileText size={20} />
                            <span className="flex-1 text-left">{resource.name}</span>
                            {selectedFiles.includes(resource.id) && <Check size={20} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setCurrentStep(2)}
                        disabled={selectedFiles.length === 0}
                        className="px-6 py-2 bg-blue-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">2</div>
                      <h4 className="text-lg font-semibold">Quiz Settings</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Number of Questions</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={quizOptions.numQuestions}
                          onChange={(e) => setQuizOptions(prev => ({
                            ...prev,
                            numQuestions: Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                          }))}
                          className="w-full p-3 bg-[#1A1D2E] border border-gray-700 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Question Types</label>
                        <div className="space-y-2">
                          {Object.entries(quizOptions.questionTypes).map(([type, enabled]) => (
                            <label key={type} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setQuizOptions(prev => ({
                                  ...prev,
                                  questionTypes: {
                                    ...prev.questionTypes,
                                    [type]: e.target.checked
                                  }
                                }))}
                                className="rounded border-gray-700"
                              />
                              <span className="capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-2 bg-[#2A2D3E] rounded-lg flex items-center gap-2"
                      >
                        <ChevronLeft size={20} />
                        Back
                      </button>
                      <button
                        onClick={handleGenerateQuiz}
                        disabled={isLoading || Object.values(quizOptions.questionTypes).every(v => !v)}
                        className="px-6 py-2 bg-blue-600 rounded-lg flex items-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            {generationStep === 'reading' ? 'Reading Files...' :
                             generationStep === 'generating' ? 'Generating Quiz...' : 'Loading...'}
                          </>
                        ) : (
                          'Generate Quiz'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {quizContent ? (
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={index} className="bg-[#12141F] rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">Question {index + 1}</h3>
                    <span className="text-sm text-gray-400 capitalize">{question.type}</span>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{question.question}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => toggleAnswer(index)}
                    className="mt-4 px-4 py-2 bg-[#2A2D3E] rounded-lg hover:bg-[#353849] transition-colors"
                  >
                    {showAnswers[index] ? 'Hide Answer' : 'Show Answer'}
                  </button>
                  {showAnswers[index] && (
                    <div className="mt-4 p-4 bg-[#1A1D2E] rounded-lg">
                      <h4 className="font-semibold mb-2">Answer:</h4>
                      <ReactMarkdown>{question.answer}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
              <FileText className="text-gray-400 mb-4" size={48} />
              <p className="text-gray-400">No quiz generated yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FileText size={20} />
                Generate Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 