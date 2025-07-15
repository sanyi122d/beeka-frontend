import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

// Step 1: Source Info
const SourceInfo = ({ onSubmit }: { onSubmit: (source: string) => void }) => {
const sources = ['Google Search', 'Friend', 'LinkedIn', 'YouTube', 'Other'];
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">How did you hear about us?</h2>
        <p className="text-gray-400">Select where you discovered Study Buddy</p>
      </div>
      <div className="space-y-4">
        {sources.map((source) => (
          <button
            key={source}
            onClick={() => onSubmit(source)}
            className="w-full bg-[#1a1625] hover:bg-[#322c45] text-white font-medium py-3 px-4 rounded-lg transition-colors text-left"
          >
            {source}
          </button>
        ))}
      </div>
    </div>
  );
};

// Step 2: Education Level
const EducationLevel = ({ onSubmit }: { onSubmit: (level: string) => void }) => {
const levels = ['University', 'High School', 'Other'];
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">What's your level of education?</h2>
        <p className="text-gray-400">Help us personalize your experience</p>
      </div>
      <div className="space-y-4">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onSubmit(level)}
            className="w-full bg-[#1a1625] hover:bg-[#322c45] text-white font-medium py-3 px-4 rounded-lg transition-colors text-left"
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

// Step 3: Study Goals (multi-select, button UI like EducationLevel)
const StudyGoals = ({ onSubmit }: { onSubmit: (goals: string[]) => void }) => {
  const options = [
    'Prepare for an exam',
    'Get homework help',
    'Improve grades overall',
    'Learn new skills',
    'Other',
  ];
  const [selected, setSelected] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelected(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">What's your main study goal right now?</h2>
        <p className="text-gray-400">Select all that apply</p>
      </div>
      <div className="space-y-4">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggleGoal(option)}
            className={`w-full py-3 px-4 rounded-lg font-medium text-left transition-colors
              ${selected.includes(option)
                ? 'bg-blue-600 text-white'
                : 'bg-[#1a1625] text-white hover:bg-[#322c45]'}
            `}
          >
            {option}
          </button>
        ))}
      </div>
      <button
        onClick={() => onSubmit(selected)}
        disabled={selected.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors mt-4 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
};


// Step 4: Welcome Video
const WelcomeVideo = ({ onComplete }: { onComplete: () => void }) => {
  const youtubeVideoId = 'FMU0j_ly4kk';
  return (
    <div className="w-full max-w-4xl space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Study Buddy!</h2>
        <p className="text-gray-400">Watch this quick guide to get started</p>
      </div>
      <div className="aspect-video bg-[#1a1625] rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
          title="Welcome Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
      <button
        onClick={onComplete}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Continue to Dashboard
      </button>
    </div>
  );
};

// Main Multi-step Component
const CompleteProfile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [education, setEducation] = useState<string | null>(null);
  const [studyGoals, setStudyGoals] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { profile_complete: true });
      setUser({ ...user, profile_complete: true });
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a0814] to-[#1a1625] p-4">
      {step === 0 && <SourceInfo onSubmit={(src) => { setSource(src); setStep(1); }} />}
      {step === 1 && <EducationLevel onSubmit={(lvl) => { setEducation(lvl); setStep(2); }} />}
      {step === 2 && <StudyGoals onSubmit={(goals) => { setStudyGoals(goals); setStep(3); }} />}
      {step === 3 && <WelcomeVideo onComplete={handleComplete} />}
    </div>
  );
};

export default CompleteProfile;
