import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Sparkles, BookOpen, Target, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: {
    name: string;
    occupation: string;
    interests: string[];
    goal: string;
  }) => void;
  userEmail: string;
}

const INTEREST_PRESETS = [
  'Technology',
  'Design & Art',
  'Science',
  'Writing',
  'Philosophy',
  'Fitness & Health',
  'Business & Startups',
  'Coding & Math'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  userEmail
}) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState('');

  if (!isOpen) return null;

  const handleToggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      onComplete({
        name: name.trim() || 'Keyush',
        occupation: occupation.trim() || 'Professional',
        interests: selectedInterests.length > 0 ? selectedInterests : ['General Knowledge'],
        goal: goal.trim() || 'Exploring creative solutions'
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && !name.trim()) return true;
    if (step === 2 && selectedInterests.length === 0) return true;
    if (step === 3 && !goal.trim()) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-lg overflow-hidden bg-white/95 border border-neutral-200/60 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.15)] rounded-3xl"
      >
        {/* Sleek top brand accent */}
        <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 h-1.5 w-full" />
        
        <div className="p-7 sm:p-9 font-sans">
          
          {/* Header section */}
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold font-mono">Cognitive Register</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-bold ml-auto font-mono">
              Node Synchronization: Step {step}/3
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
                    Synchronize your identity
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                    Aura molds itself around your perspective. Let's start with your credentials.
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                      What should Aura call you?
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Keyush"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200/60 rounded-xl text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                      Primary Profession / Craft <span className="text-neutral-400 font-medium">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Creative Designer, Software Architect, Writer..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200/60 rounded-xl text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
                    Select your focus spheres
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                    Aura maps these interest categories directly into active mental registers for context alignment.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {INTEREST_PRESETS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => handleToggleInterest(interest)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition-all text-xs font-semibold select-none cursor-pointer active:scale-97 outline-none ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs'
                            : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/60 text-neutral-700'
                        }`}
                      >
                        <span>{interest}</span>
                        {isSelected && (
                          <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight leading-tight">
                    Define critical parameters
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                    What is our primary directive? Tell Aura what you want to focus on or accomplish.
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                      Core Goal with Aura
                    </label>
                    <div className="relative">
                      <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Brainstorming startup ideas, learning coding concepts, etc."
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200/60 rounded-xl text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav Footer Actions */}
          <div className="flex items-center justify-between border-t border-neutral-200/40 mt-7 pt-5">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-4 py-2 border border-neutral-200 bg-white hover:bg-neutral-100 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-97 outline-none ${
                step === 1 ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className={`px-5 py-2.5 bg-neutral-950 hover:bg-neutral-850 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all select-none active:scale-97 cursor-pointer hover:shadow-xs outline-none ${
                isNextDisabled() ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
              }`}
            >
              <span>{step === 3 ? 'Sync Memory Core' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
