/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Send,
  RefreshCw,
  User,
  Cpu,
  ChevronRight,
  ChevronDown,
  Edit2,
  Info,
  Check,
  X,
  Layers,
  Filter,
  Eye,
  EyeOff,
  CornerDownRight,
  Archive,
  Lightbulb,
  Menu,
  Mic,
  Paperclip,
  Compass,
  HelpCircle,
  History,
  Laptop,
  Smartphone,
  CheckCircle,
  Wifi,
  Battery,
  Settings,
  Flame,
  Volume2,
  Copy,
  VolumeX,
  Lock,
  ArrowRight
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { Memory, ChatMessage, ChatSession, CognitiveModel } from './types';
import { DynamicIsland, IslandState } from './components/DynamicIsland';
import { CognitiveRegisterDrawer } from './components/CognitiveRegisterDrawer';
import { OnboardingModal } from './components/OnboardingModal';
import { DinoGame } from './components/DinoGame';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  saveMemoryToFirestore,
  deleteMemoryFromFirestore,
  saveSessionToFirestore,
  deleteSessionFromFirestore,
  loadMemoriesFromFirestore,
  loadSessionsFromFirestore,
  listDriveBackups,
  createDriveBackup,
  downloadDriveBackup,
  deleteDriveBackupFile,
  DriveBackupFile,
  auth
} from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

const BOOTSTRAP_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    fact: 'User runs a digital product design agency called Aero Studio.',
    category: 'career',
    createdAt: new Date().toISOString(),
    sourceContext: 'Shared during professional query',
    isActive: true
  },
  {
    id: 'mem-2',
    fact: 'User prefers drinking oat milk matcha lattes with absolutely no added sweetener.',
    category: 'preference',
    createdAt: new Date().toISOString(),
    sourceContext: 'Shared during early morning cafe chat logs',
    isActive: true
  },
  {
    id: 'mem-3',
    fact: 'User is training for an upcoming late-autumn trail half-marathon.',
    category: 'personal',
    createdAt: new Date().toISOString(),
    sourceContext: 'Logged in athletic schedule threads',
    isActive: true
  },
  {
    id: 'mem-4',
    fact: 'User is heavily interested in Scandinavian architecture and mid-century modern furniture design.',
    category: 'interest',
    createdAt: new Date().toISOString(),
    sourceContext: 'Derived from spatial styling discussion',
    isActive: true
  }
];

const AVAILABLE_MODELS: CognitiveModel[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Aura Advanced Sync 3.5',
    provider: 'Google Mind Engine',
    description: 'High context precision, instant matching. Recommended default node.',
    icon: 'Flame',
    accentColor: 'from-orange-400 to-red-500'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Aura Multi-Path 1.5 Pro',
    provider: 'DeepMind Reasoning Corp',
    description: 'Elevated multi-layer logic. Superior for complicated custom instructions.',
    icon: 'Cpu',
    accentColor: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Aura Compact 1.5 Lite',
    provider: 'Google Nest Cloud',
    description: 'Highly lean context resource footprint.',
    icon: 'Layers',
    accentColor: 'from-sky-400 to-blue-500'
  }
];

function generateSafeId(prefix: string = ''): string {
  const randomPart = Math.random().toString(36).substring(2, 11);
  const stamp = Date.now().toString(36);
  const cleanedPrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '');
  return `${cleanedPrefix}${randomPart}-${stamp}`;
}

export default function App() {
  // --- Persistent Storage State ---
  const [memories, setMemories] = useState<Memory[]>(() => {
    try {
      const stored = localStorage.getItem('aura_memories');
      return stored ? JSON.parse(stored) : BOOTSTRAP_MEMORIES;
    } catch {
      return BOOTSTRAP_MEMORIES;
    }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const stored = localStorage.getItem('aura_sessions');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'session-default',
        title: 'Aura Sync Briefing',
        messages: [
          {
            id: 'welcome-msg',
            role: 'model',
            content: `Hello! I am Aura, your context-aware personal intelligence. Let's sync up!`,
            timestamp: new Date().toISOString(),
            recalledMemories: []
          }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('aura_active_session_id');
      if (stored) return stored;
    } catch {}
    return 'session-default';
  });

  // --- Dynamic Model Switcher & Custom Labels Configs ---
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    try {
      return localStorage.getItem('aura_selected_model_id') || 'gemini-3.5-flash';
    } catch {
      return 'gemini-3.5-flash';
    }
  });

  const [customModelNames, setCustomModelNames] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('aura_custom_model_names');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [showModelDropdown, setShowModelDropdown] = useState<boolean>(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [tempModelName, setTempModelName] = useState<string>('');

  // --- UI Interactivity States ---
  const [islandState, setIslandState] = useState<IslandState>('idle');
  const [islandEventText, setIslandEventText] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.innerWidth >= 768;
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<'memory' | 'history' | 'cloud'>('history');
  const [hoveredRecalledId, setHoveredRecalledId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; type: string; message: string; detail?: string }>>([]);

  // --- Firebase Cloud & Google Drive states ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [isDataLoadedAndReady, setIsDataLoadedAndReady] = useState<boolean>(false);
  const [showDinoInsideSync, setShowDinoInsideSync] = useState<boolean>(false);

  // --- Real Attachment & Microphone States ---
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: string; type?: string; base64?: string } | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Speech & Clipboard helpers ---
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  const handleOnboardingComplete = async (data: {
    name: string;
    occupation: string;
    interests: string[];
    goal: string;
  }) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    setIsOnboardingOpen(false);
    setSelectedModelId('gemini-3.5-flash');

    try {
      localStorage.setItem(`aura_onboarding_completed_${uid}`, 'true');
      // 1. Create memories/traits
      const nameMemory: Memory = {
        id: 'mem-first-name-' + Math.random().toString(),
        fact: `My name is ${data.name}.`,
        category: 'personal',
        createdAt: new Date().toISOString(),
        sourceContext: 'Shared during onboarding questionnaire',
        isActive: true
      };

      const occupationMemory: Memory = {
        id: 'mem-first-prof-' + Math.random().toString(),
        fact: `My occupation/profession: ${data.occupation}.`,
        category: 'career',
        createdAt: new Date().toISOString(),
        sourceContext: 'Shared during onboarding questionnaire',
        isActive: true
      };

      const interestsMemory: Memory = {
        id: 'mem-first-interests-' + Math.random().toString(),
        fact: `Areas of interest: ${data.interests.join(', ')}.`,
        category: 'interest',
        createdAt: new Date().toISOString(),
        sourceContext: 'Shared during onboarding questionnaire',
        isActive: true
      };

      const goalMemory: Memory = {
        id: 'mem-first-goal-' + Math.random().toString(),
        fact: `My current focus with Aura: ${data.goal}.`,
        category: 'preference',
        createdAt: new Date().toISOString(),
        sourceContext: 'Shared during onboarding questionnaire',
        isActive: true
      };

      const initialMemoriesList = [nameMemory, occupationMemory, interestsMemory, goalMemory];
      setMemories(initialMemoriesList);

      // Create new chat session for user
      const initialSessionId = 'session-init-' + Math.random().toString();
      const initialSession: ChatSession = {
        id: initialSessionId,
        title: 'Aura Core Initialized',
        messages: [
          {
            id: 'welcome-msg-onb-' + Math.random().toString(),
            role: 'model',
            content: `### Welcome to your cognitive core, ${data.name}!\n\nI have successfully configured and synchronized my cognitive registers with your background profiles and focus priorities.\n\nNow, let's dive into some of your interests such as **${data.interests.join(', ')}**, and align our goals with **${data.goal}**.\n\nType down parameters for your first briefing query!`,
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString()
      };

      setSessions([initialSession]);
      setActiveSessionId(initialSessionId);

      // Persist to Cloud Firestore!
      for (const t of initialMemoriesList) {
        await saveMemoryToFirestore(t, uid);
      }
      await saveSessionToFirestore(initialSession, uid);

      triggerToast('info', 'Cognitive Core Loaded', `Synchronized profile traits and initialized chat for ${data.name}!`);
    } catch (e) {
      console.error(e);
      triggerToast('info', 'Sync Delayed', 'Local profile synchronized, waiting for cloud socket validation.');
    }
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      setSpeakingMessageId(null);
    } else {
      try {
        window.speechSynthesis.cancel();
        // Remove markdown tags/table elements for a cleaner speech synthesis text
        const cleanText = text
          .replace(/\|/g, ' ')
          .replace(/:/g, ' ')
          .replace(/-{3,}/g, ' ')
          .replace(/[#*`~_\[\]\(\)]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => {
          setSpeakingMessageId(null);
        };
        utterance.onerror = () => {
          setSpeakingMessageId(null);
        };
        setSpeakingMessageId(msgId);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setSpeakingMessageId(null);
      }
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(msgId);
      triggerToast('info', 'Secure Copy', 'Content logged to device clipboard.');
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch {
      triggerToast('info', 'Secure Copy', 'Clipboard operation failed.');
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        triggerToast('info', 'Mic Live', 'Speak clearly. Capturing your words...');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
          triggerToast('info', 'Speech Synced', `Captured: "${transcript}"`);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        triggerToast('info', 'Mic Offline', 'Microphone permissions or API inactive in this iframe context.');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      triggerToast('info', 'Mic Inactive', 'Speech recognition is not supported or accessible inside this container/iframe.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    const fileType = file.type || '';
    const nameLower = file.name.toLowerCase();
    
    // Check if the file is a standard text file
    const isTextFile = fileType.startsWith('text/') || 
                       ['.txt', '.json', '.csv', '.md', '.js', '.ts', '.html', '.css', '.yaml', '.yml', '.xml'].some(ext => nameLower.endsWith(ext));

    const reader = new FileReader();

    if (isTextFile) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachedFile({
          name: file.name,
          size: sizeStr,
          content: text || '',
          type: fileType || 'text/plain'
        });
        triggerToast('info', 'Context Logged', `Attached text/code file: ${file.name}`);
      };
      reader.onerror = () => {
        triggerToast('info', 'Registry Load Err', 'Failed to read attached file stream.');
      };
      reader.readAsText(file);
    } else {
      // It's a binary file (PDF, ZIP, Image, Video, Audio)
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // Extract base64 encoded string from data URL
        const base64Data = dataUrl.split(',')[1] || '';
        
        setAttachedFile({
          name: file.name,
          size: sizeStr,
          content: `[Attached Binary File: ${file.name} (${sizeStr}), MIME type: ${fileType || 'application/octet-stream'}]`,
          type: fileType || 'application/octet-stream',
          base64: base64Data
        });
        triggerToast('info', 'Binary Logged', `Attached binary file: ${file.name} (${sizeStr})`);
      };
      reader.onerror = () => {
        triggerToast('info', 'Registry Load Err', 'Failed to read attached binary stream.');
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Google & Firebase Cloud Synchronization ---
  const queryDriveBackups = async (token: string) => {
    setIsLoadingDrive(true);
    try {
      const files = await listDriveBackups(token);
      setDriveBackups(files);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setSelectedModelId('gemini-3.5-flash'); // Auto-upgrade to Advanced Sync model after logging in
        setIsSyncingFirestore(true);
        setIsDataLoadedAndReady(false);
        setShowDinoInsideSync(false);
        try {
          const cloudMemories = await loadMemoriesFromFirestore(firebaseUser.uid);
          const cloudSessions = await loadSessionsFromFirestore(firebaseUser.uid);

          const hasCompletedOnboardingOnDevice = localStorage.getItem(`aura_onboarding_completed_${firebaseUser.uid}`) === 'true';

          if (cloudMemories.length > 0 || cloudSessions.length > 0 || hasCompletedOnboardingOnDevice) {
            // Existing user - Sync traits and start a brand-new chat
            setMemories(cloudMemories);
            
            // Extract matching name memory from live cloud space
            const nameMemory = cloudMemories.find(m => m.isActive && m.fact.toLowerCase().includes('my name is'));
            let extractedName = firebaseUser.displayName || 'User';
            if (nameMemory) {
              const match = nameMemory.fact.match(/My name is\s+([^.]+)/i);
              if (match && match[1]) {
                extractedName = match[1].trim();
              }
            }

            const newSessionId = 'session-login-' + Math.random().toString();
            const newSession: ChatSession = {
              id: newSessionId,
              title: 'New Session',
              messages: [
                {
                  id: 'welcome-msg-' + Math.random().toString(),
                  role: 'model',
                  content: `### Welcome back, ${extractedName}!\n\nI have successfully re-established the live connection to your secure cognitive registry.\n\nAll historical traits and dialog logs are restored. What are we sync-planning today?`,
                  timestamp: new Date().toISOString(),
                  recalledMemories: []
                }
              ],
              createdAt: new Date().toISOString()
            };
            
            // All previous chats are available
            setSessions([newSession, ...cloudSessions]);
            setActiveSessionId(newSessionId);
            
            // Persist the new session live to cloud
            await saveSessionToFirestore(newSession, firebaseUser.uid);
            
            triggerToast('info', 'Secure Sync Activated', `Loaded memory traits & launched a fresh dialogue session.`);
          } else {
            // New register flow - open the onboarding questions
            setIsOnboardingOpen(true);
          }
          await queryDriveBackups(token);
        } catch (err) {
          console.error(err);
          triggerToast('info', 'Sync Delayed', 'We had trouble reading properties from your cloud space.');
        } finally {
          setIsDataLoadedAndReady(true);
        }
      },
      () => {
        setUser(null);
        setDriveBackups([]);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync completion tracker - waits if Dino game is active
  useEffect(() => {
    if (isDataLoadedAndReady && !showDinoInsideSync) {
      setIsSyncingFirestore(false);
    }
  }, [isDataLoadedAndReady, showDinoInsideSync]);

  const handleGoogleLogin = async () => {
    try {
      await googleSignIn();
    } catch (err) {
      console.error(err);
      triggerToast('info', 'OAuth Incomplete', 'Sign-in cancelled or Google client scopes rejected.');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();

      // Clear localStorage items to prevent state leaking
      localStorage.removeItem('aura_memories');
      localStorage.removeItem('aura_sessions');
      localStorage.removeItem('aura_active_session_id');
      localStorage.removeItem('aura_custom_model_names');
      localStorage.removeItem('aura_selected_model_id');

      // Reset state properties to pristine defaults
      setMemories(BOOTSTRAP_MEMORIES);
      setCustomModelNames({});
      setSelectedModelId('gemini-3.5-flash');

      const defaultSessionId = 'session-default';
      const defaultSessionObj: ChatSession = {
        id: defaultSessionId,
        title: 'Aura Sync Briefing',
        messages: [
          {
            id: 'welcome-msg',
            role: 'model',
            content: `Hello! I am Aura, your context-aware personal intelligence. Let's sync up!`,
            timestamp: new Date().toISOString(),
            recalledMemories: []
          }
        ],
        createdAt: new Date().toISOString()
      };
      setSessions([defaultSessionObj]);
      setActiveSessionId(defaultSessionId);

      triggerToast('info', 'Disconnected', 'Live-sync terminated. Offline registers reset to defaults.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceSyncFirestore = async () => {
    if (!user) return;
    setIsSyncingFirestore(true);
    try {
      for (const m of memories) {
        await saveMemoryToFirestore(m, user.uid);
      }
      for (const s of sessions) {
        await saveSessionToFirestore(s, user.uid);
      }
      triggerToast('info', 'Sync Completed', 'All registers synced.');
    } catch (err) {
      console.error(err);
      triggerToast('info', 'Sync Failure', 'Failed to force synchronize with Firestore storage.');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const handleRefreshDrive = async () => {
    const token = await getAccessToken();
    if (token) {
      await queryDriveBackups(token);
      triggerToast('info', 'Drive Refreshed', 'Fetched latest backups list from Google Drive.');
    }
  };

  const handleBackupToDrive = async () => {
    const token = await getAccessToken();
    if (!token || !user) return;
    setIsBackingUp(true);
    try {
      const result = await createDriveBackup(token, memories, sessions);
      triggerToast('add', 'Backup Synced', `File "${result.name}" written successfully.`);
      await queryDriveBackups(token);
    } catch (err) {
      console.error(err);
      triggerToast('info', 'Drive Backup Error', 'Google Drive upload error.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async (fileId: string) => {
    const token = await getAccessToken();
    if (!token || !user) return;
    setIsRestoring(true);
    try {
      const data = await downloadDriveBackup(token, fileId);
      setMemories(data.memories);
      setSessions(data.sessions);
      if (data.sessions.length > 0) {
        setActiveSessionId(data.sessions[0].id);
      }
      // Force sync to Firestore too for instant consistency
      for (const m of data.memories) {
        await saveMemoryToFirestore(m, user.uid);
      }
      for (const s of data.sessions) {
        await saveSessionToFirestore(s, user.uid);
      }
      triggerToast('add', 'Calibration Success', 'Aura state synced and updated with backup data.');
      setShowDrawer(false);
    } catch (err) {
      console.error(err);
      triggerToast('info', 'Calibration Failure', 'Failed to write backup contents into local memory.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    const token = await getAccessToken();
    if (!token || !user) return;
    try {
      await deleteDriveBackupFile(token, fileId);
      triggerToast('remove', 'Backup Purged', 'Google Drive file trashed successfully.');
      await queryDriveBackups(token);
    } catch (err) {
      console.error(err);
      triggerToast('info', 'Trash Failure', 'Google Drive rejection.');
    }
  };

  // Form states inside slide-in drawer
  const [isAddingFact, setIsAddingFact] = useState<boolean>(false);
  const [newFactContent, setNewFactContent] = useState<string>('');
  const [newFactCategory, setNewFactCategory] = useState<'preference' | 'personal' | 'career' | 'interest' | 'other'>('preference');

  // Search/Filter states inside drawer
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- Persistence Syncs ---
  useEffect(() => {
    try {
      localStorage.setItem('aura_memories', JSON.stringify(memories));
    } catch (e) {
      console.error(e);
    }
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_active_session_id', activeSessionId);
    } catch (e) {
      console.error(e);
    }
  }, [activeSessionId]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_selected_model_id', selectedModelId);
    } catch (e) {
      console.error(e);
    }
  }, [selectedModelId]);

  // If user is not registered / active, switch and lock model to compact lite
  useEffect(() => {
    if (!user && selectedModelId !== 'gemini-1.5-flash') {
      setSelectedModelId('gemini-1.5-flash');
    }
  }, [user, selectedModelId]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_custom_model_names', JSON.stringify(customModelNames));
    } catch (e) {
      console.error(e);
    }
  }, [customModelNames]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isSending]);

  // --- Dynamic System Toasts ---
  const triggerToast = (type: 'add' | 'remove' | 'info', message: string, detail?: string) => {
    const newToast = {
      id: Math.random().toString(),
      type,
      message,
      detail
    };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };

  // --- Send Message Handler with Dynamic Island and Token Safety ---
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) {
      e.preventDefault();
    }
    const finalInput = customText || inputValue;
    if (!finalInput.trim() && !attachedFile) {
      return;
    }
    if (isSending) {
      return;
    }

    let textInput = finalInput.trim();
    let displayContent = textInput;
    let attachmentObj = null;

    if (attachedFile) {
      attachmentObj = {
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type || 'text/plain',
        base64: attachedFile.base64,
        content: attachedFile.content
      };
      textInput = `${textInput}\n\n[Attached File: ${attachedFile.name} (${attachedFile.size})]`;
      displayContent = displayContent 
        ? `${displayContent} (Attached: ${attachedFile.name})`
        : `Attached context file: ${attachedFile.name}`;
      setAttachedFile(null); // Clear attachment
    }

    setInputValue('');
    setIsSending(true);
    setIslandState('thinking');

    // 1. Append User Message
    const userMessage: ChatMessage = {
      id: 'usr-' + Math.random().toString(),
      role: 'user',
      content: displayContent,
      textBackup: textInput,
      timestamp: new Date().toISOString(),
      attachment: attachmentObj || undefined
    };

    const updatedSessionMessages = [...activeSession.messages, userMessage];
    updateSessionMessages(activeSession.id, updatedSessionMessages);

    try {
      const payloadMessages = updatedSessionMessages.map((m) => {
        return { 
          role: m.role, 
          content: m.id === userMessage.id && m.textBackup ? m.textBackup : m.content,
          attachment: m.attachment
        };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          memories: memories,
          modelId: selectedModelId
        })
      });

      if (!response.ok) {
        throw new Error('Aura Node Communication Failure');
      }

      const data = await response.json();

      // Process Model Reply
      const modelMessage: ChatMessage = {
        id: 'mod-' + Math.random().toString(),
        role: 'model',
        content: data.reply || "I've processed your query, but couldn't formulate a reply.",
        timestamp: new Date().toISOString(),
        recalledMemories: data.recalledMemoryIds || []
      };

      const finalMessages = [...updatedSessionMessages, modelMessage];
      updateSessionMessages(activeSession.id, finalMessages);

      let savedFlag = false;

      // Process New Learned Memories
      if (data.newMemories && Array.isArray(data.newMemories) && data.newMemories.length > 0) {
        const addedMemories: Memory[] = [];
        data.newMemories.forEach((rawMem: any) => {
          const duplicate = memories.find(
            m => m.fact.toLowerCase() === rawMem.fact.toLowerCase()
          );
          if (!duplicate) {
            const added: Memory = {
              id: 'mem-' + Math.random().toString(),
              fact: rawMem.fact,
              category: rawMem.category || 'other',
              createdAt: new Date().toISOString(),
              sourceContext: rawMem.sourceContext || `Stated during dialog`,
              isActive: true
            };
            addedMemories.push(added);
          }
        });

        if (addedMemories.length > 0) {
          setMemories(prev => [...addedMemories, ...prev]);
          savedFlag = true;

          addedMemories.forEach(m => {
            triggerToast('add', 'Learned New Fact', m.fact);
          });

          if (auth.currentUser) {
            const uid = auth.currentUser.uid;
            addedMemories.forEach(m => {
              saveMemoryToFirestore(m, uid).catch(console.error);
            });
          }

          // Set Dynamic Island transition to Saved
          setIslandState('saved');
          setIslandEventText(addedMemories[0].fact);
          setTimeout(() => {
            setIslandState(prev => prev === 'saved' ? 'idle' : prev);
          }, 5000);
        }
      }

      // Process Replaced/Archived Memories
      if (data.outdatedMemoryIds && Array.isArray(data.outdatedMemoryIds) && data.outdatedMemoryIds.length > 0) {
        setMemories(prev => prev.map(m => {
          if (data.outdatedMemoryIds.includes(m.id)) {
            triggerToast('remove', 'Archived Outdated Fact', m.fact);
            const updated = { ...m, isActive: false };
            if (auth.currentUser) {
              saveMemoryToFirestore(updated, auth.currentUser.uid).catch(console.error);
            }
            return updated;
          }
          return m;
        }));
      }

      // Dynamic Title
      if (activeSession.title === 'Aura Sync Briefing' && activeSession.messages.length <= 2) {
        setTitleDynamically(activeSession.id, textInput);
      }

      if (!savedFlag) {
        setIslandState('idle');
      }

      if (!user) {
        setTimeout(() => {
          triggerToast('info', 'Secure Sync Recommended', 'Dial up persistent memory! Connect your secure account to persist custom traits.');
        }, 1000);
      }

    } catch (error: any) {
      console.error(error);
      setIslandState('idle');
      triggerToast('info', 'Communication Interrupted', 'Aura had trouble reaching the sync system.');
      const errMessage: ChatMessage = {
        id: 'err-' + Math.random().toString(),
        role: 'model',
        content: `⚠️ **Aura Status Warning**: I encountered an error checking your personal memory storage. Please ensure your \`GEMINI_API_KEY\` is active inside of settings.`,
        timestamp: new Date().toISOString()
      };
      updateSessionMessages(activeSession.id, [...updatedSessionMessages, errMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const updateSessionMessages = (sessId: string, messages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessId) {
        const updated = { ...s, messages };
        if (auth.currentUser) {
          saveSessionToFirestore(updated, auth.currentUser.uid).catch(console.error);
        }
        return updated;
      }
      return s;
    }));
  };

  const setTitleDynamically = (sessId: string, initialMessage: string) => {
    const titleCandidates = initialMessage.split(/[.?!]/)[0];
    const cleanTitle = titleCandidates.length > 25 ? titleCandidates.substring(0, 25) + '...' : titleCandidates;
    setSessions(prev => prev.map(s => {
      if (s.id === sessId) {
        const updated = { ...s, title: cleanTitle };
        if (auth.currentUser) {
          saveSessionToFirestore(updated, auth.currentUser.uid).catch(console.error);
        }
        return updated;
      }
      return s;
    }));
  };

  const handleAddNewFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactContent.trim()) return;

    const manualMemory: Memory = {
      id: 'mem-' + Math.random().toString(),
      fact: newFactContent.trim(),
      category: newFactCategory,
      createdAt: new Date().toISOString(),
      sourceContext: 'Logged directly in brain files',
      isActive: true
    };

    setMemories(prev => [manualMemory, ...prev]);
    setNewFactContent('');
    setIsAddingFact(false);
    triggerToast('add', 'Persisted Fact', manualMemory.fact);

    if (auth.currentUser) {
      saveMemoryToFirestore(manualMemory, auth.currentUser.uid).catch(console.error);
    }
  };

  const toggleMemoryActive = (id: string) => {
    setMemories(prev => prev.map(m => {
      if (m.id === id) {
        const nextState = !m.isActive;
        triggerToast(
          nextState ? 'info' : 'remove',
          nextState ? 'Trait Restored' : 'Trait Disabled',
          m.fact
        );
        const updated = { ...m, isActive: nextState };
        if (auth.currentUser) {
          saveMemoryToFirestore(updated, auth.currentUser.uid).catch(console.error);
        }
        return updated;
      }
      return m;
    }));
  };

  const deleteMemory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targeted = memories.find(m => m.id === id);
    setMemories(prev => prev.filter(m => m.id !== id));
    if (targeted) {
      triggerToast('remove', 'Erased Fact', targeted.fact);
    }
    if (auth.currentUser) {
      deleteMemoryFromFirestore(id, auth.currentUser.uid).catch(console.error);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: 'session-' + Math.random().toString(),
      title: 'New Session',
      messages: [
        {
          id: 'welcome-msg-' + Math.random().toString(),
          role: 'model',
          content: 'Session initialized. I am synchronized with your active cognitive nodes. What can I help with?',
          timestamp: new Date().toISOString(),
          recalledMemories: []
        }
      ],
      createdAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);

    if (auth.currentUser) {
      saveSessionToFirestore(newSession, auth.currentUser.uid).catch(console.error);
    }
  };

  const deleteSession = (sessId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      triggerToast('info', 'System Safeguard', 'Aura requires at least one active conversation.');
      return;
    }
    const filtered = sessions.filter(s => s.id !== sessId);
    setSessions(filtered);
    if (activeSessionId === sessId) {
      setActiveSessionId(filtered[0].id);
    }
    triggerToast('info', 'Dialogue Cleared', 'Chat wiped clean from memory cache.');

    if (auth.currentUser) {
      deleteSessionFromFirestore(sessId, auth.currentUser.uid).catch(console.error);
    }
  };

  const getDynamicSuggestions = () => {
    const defaultSuggestions = [
      { text: "Help me brainstorm Aero Studio goals", label: "Agency Planning" },
      { text: "Suggest healthy snacks for a runner", label: "Fitness Plan" },
      { text: "Interior ideas combining Nordic and vintage style", label: "Design Vision" },
      { text: "Write steps to make un-sweetened matcha", label: "Daily Ritual" }
    ];

    try {
      const active = memories.filter(m => m.isActive);
      const list = [];

      const careerMem = active.find(m => m.fact.toLowerCase().includes('aero') || m.fact.toLowerCase().includes('agency'));
      if (careerMem) {
        list.push({
          text: "Outline a product sprint schedule suited to Aero Studio",
          label: "Aero Studio Pitch"
        });
      }

      const matchMem = active.find(m => m.fact.toLowerCase().includes('matcha'));
      if (matchMem) {
        list.push({
          text: "What nutrition properties does my matcha ritual offer without sugar?",
          label: "Matcha Health Insights"
        });
      }

      const trainMem = active.find(m => m.fact.toLowerCase().includes('marathon') || m.fact.toLowerCase().includes('run'));
      if (trainMem) {
        list.push({
          text: "Give me a three-day recovery calendar for my half-marathon runs",
          label: "Recovery Schedule"
        });
      }

      const styleMem = active.find(m => m.fact.toLowerCase().includes('scandinavian') || m.fact.toLowerCase().includes('interior'));
      if (styleMem) {
        list.push({
          text: "Suggest 3 coffee tables that fit Scandi and mid-century aesthetics",
          label: "Furniture Selection"
        });
      }

      while (list.length < 4 && defaultSuggestions.length > 0) {
        const next = defaultSuggestions.shift();
        if (next && !list.find(l => l.text === next.text)) {
          list.push(next);
        }
      }

      return list.slice(0, 4);
    } catch {
      return defaultSuggestions;
    }
  };

  const suggestions = getDynamicSuggestions();
  const isThreadFresh = activeSession.messages.length === 1 && activeSession.messages[0].id === 'welcome-msg';
  const userGreetingName = (() => {
    if (!user) return 'User';
    const nameMem = memories.find(m => m.isActive && m.fact.toLowerCase().includes('my name is'));
    if (nameMem) {
      const match = nameMem.fact.match(/My name is\s+([^.]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return user.displayName || 'User';
  })();

  return (
    <div className="min-h-screen w-full bg-[#fafafc] font-sans relative">
      
      {/* PERSISTENT LEFT SIDEBAR – TABLET/DESKTOP VIEW */}
      {showDrawer && (
        <div className="hidden md:block fixed top-[73px] bottom-0 left-0 w-[350px] lg:w-[420px] border-r border-neutral-200/40 bg-white/50 z-20">
          <CognitiveRegisterDrawer
            isSidebar={true}
            showDrawer={showDrawer}
            setShowDrawer={setShowDrawer}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            memories={memories}
            setMemories={setMemories}
            sessions={sessions}
            setSessions={setSessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            createNewSession={createNewSession}
            deleteSession={deleteSession}
            isAddingFact={isAddingFact}
            setIsAddingFact={setIsAddingFact}
            newFactContent={newFactContent}
            setNewFactContent={setNewFactContent}
            newFactCategory={newFactCategory}
            setNewFactCategory={setNewFactCategory}
            handleAddNewFact={handleAddNewFact}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            hoveredRecalledId={hoveredRecalledId}
            setHoveredRecalledId={setHoveredRecalledId}
            toggleMemoryActive={toggleMemoryActive}
            deleteMemory={deleteMemory}
            bootstrapMemories={BOOTSTRAP_MEMORIES}
            triggerToast={triggerToast}
            
            user={user}
            onLogin={handleGoogleLogin}
            onLogout={handleGoogleLogout}
            driveBackups={driveBackups}
            isBackingUp={isBackingUp}
            isRestoring={isRestoring}
            onBackupToDrive={handleBackupToDrive}
            onRestoreFromDrive={handleRestoreFromDrive}
            onDeleteBackup={handleDeleteBackup}
            isLoadingDrive={isLoadingDrive}
            onRefreshDrive={handleRefreshDrive}
            isSyncingFirestore={isSyncingFirestore}
            onForceSyncFirestore={handleForceSyncFirestore}
          />
        </div>
      )}

      {/* DETACHED MAIN CHAT FLOW WORKSPACE */}
      <div className={`transition-all duration-300 min-h-screen flex flex-col relative w-full ${showDrawer ? 'md:pl-[350px] lg:pl-[420px]' : 'pl-0'}`}>
        {/* Background Atmosphere Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[#60a5fa]/6 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[90vw] h-[90vw] bg-[#c084fc]/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[35%] left-[25%] w-[50vw] h-[50vw] bg-[#fda4af]/4 rounded-full blur-[115px] pointer-events-none -z-10" />

        {/* ACTIVE GEMINI-STYLE DIALOGUE THINKING GRADIENT GLOWS */}
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none -z-10 ${
            isSending ? 'opacity-100' : 'opacity-0'
          } thinking-aurora-glow`}
        />

        {isSending && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 transition-all duration-500 animate-[fadeIn_0.4s_ease-out]">
            {/* Elegant horizontal running ribbon right below the header at top-[73px] */}
            <div className={`fixed top-[73px] transition-all duration-300 h-[3.5px] bg-gradient-to-r from-[#1ba2f5] via-[#7647eb] via-[#ff7ea5] to-[#ffc186] bg-gemini-glow animate-gemini-flow z-30 shadow-[0_2px_14px_rgba(118,71,235,0.4)] ${
              showDrawer ? 'left-0 md:left-[350px] lg:left-[420px] right-0' : 'left-0 right-0'
            }`} />
          </div>
        )}

        {/* WEBSITE HEADER */}
        <header className="fixed top-0 left-0 right-0 h-[73px] border-b border-neutral-200/40 bg-white/80 backdrop-blur-md z-30 select-none px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between relative">
            
            {/* Drawer toggler & Title */}
            <div className="flex items-center gap-3">
              <button
                id="aura_menu_btn"
                onClick={() => {
                  setNewFactContent('');
                  setIsAddingFact(false);
                  setActiveTab('history');
                  setShowDrawer(!showDrawer);
                }}
              className="p-2.5 rounded-xl hover:bg-neutral-100 border border-neutral-200/50 active:scale-95 transition-all outline-none flex items-center justify-center shadow-2xs cursor-pointer bg-white"
              title="Cognitive Register Drawer"
            >
              <Menu className="w-5 h-5 text-neutral-850" />
            </button>
            
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-black tracking-tight text-neutral-850">Aura AI Chatbot</span>
              <span className="text-[9px] font-semibold text-neutral-400">Context Memory Suite</span>
            </div>
          </div>

          {/* DYNAMIC EDITABLE MODEL SELECTOR FOR "AURA PERSONAL" PILL */}
          <div className="relative">
            <button
              id="aura_model_select_btn"
              onClick={() => {
                setShowModelDropdown(!showModelDropdown);
                setEditingModelId(null);
              }}
              className="px-4 py-2 border border-neutral-200/55 bg-white/80 hover:bg-white/95 rounded-2xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer active:scale-97 select-none"
            >
              <span className="text-xs font-semibold text-neutral-800 tracking-tight">
                {customModelNames[selectedModelId] || AVAILABLE_MODELS.find(m => m.id === selectedModelId)?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 transition-transform duration-300" style={{ transform: showModelDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>

            {/* DYNAMIC DROP-DOWN CARD POPOVER - LIQUID CLASSY */}
            <AnimatePresence>
              {showModelDropdown && (
                <>
                  {/* Dismisser layer */}
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => { setShowModelDropdown(false); setEditingModelId(null); }} />

                  {/* Glass Dialog Popover */}
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-72 sm:w-85 bg-white/85 backdrop-blur-2xl border border-white/50 rounded-3xl shadow-[0_24px_60px_rgba(31,38,135,0.18)] p-4 z-50 flex flex-col gap-3.5"
                  >
                    <div className="px-1 border-b border-neutral-100/40 pb-2.5 font-sans">
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-500 block">Cognitive Neural Core</span>
                      <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed font-bold">Swap model instances or customize their brand names directly.</p>
                    </div>

                    <div className="flex flex-col gap-2 font-sans">
                      {AVAILABLE_MODELS.map((model) => {
                        const isSelected = model.id === selectedModelId;
                        const isEditingThis = editingModelId === model.id;
                        const finalName = customModelNames[model.id] || model.name;

                        return (
                          <div
                            key={model.id}
                            onClick={() => {
                              if (!isEditingThis) {
                                if (!user && model.id !== 'gemini-1.5-flash') {
                                  triggerToast('info', 'Secure Sync Required', `Connecting an account is required to select ${finalName}.`);
                                  return;
                                }
                                setSelectedModelId(model.id);
                                triggerToast('info', 'Cognitive Calibration Switched', `Active model calibrated to: ${finalName}`);
                              }
                            }}
                            className={`p-3 border rounded-2xl flex flex-col gap-1 transition-all cursor-pointer relative overflow-hidden group ${
                              isSelected
                                ? 'bg-white border-neutral-950/20 shadow-sm ring-1 ring-neutral-950/5'
                                : 'bg-white/40 border-neutral-200/15 hover:bg-white/85 hover:border-neutral-200/45'
                            } ${!user && model.id !== 'gemini-1.5-flash' ? 'opacity-65' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2 z-10 relative">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${model.accentColor} text-white flex items-center justify-center shrink-0`}>
                                  {model.id === 'gemini-1.5-pro' ? <Cpu className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
                                </div>

                                {isEditingThis ? (
                                  <input
                                    type="text"
                                    value={tempModelName}
                                    onChange={(e) => setTempModelName(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (tempModelName.trim()) {
                                          setCustomModelNames(prev => ({ ...prev, [model.id]: tempModelName.trim() }));
                                          setEditingModelId(null);
                                          triggerToast('info', 'Model Label Updated', `Node renamed: ${tempModelName.trim()}`);
                                        }
                                      }
                                    }}
                                    className="px-2 py-0.5 border border-zinc-200 bg-white rounded-lg text-xs font-black text-neutral-800 placeholder-neutral-400 outline-none w-full"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                    <span className="text-xs font-bold text-neutral-850 truncate">
                                      {finalName}
                                    </span>
                                    {!user && model.id !== 'gemini-1.5-flash' && (
                                      <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-100 border border-neutral-200/50 text-neutral-400 rounded-md text-[8px] font-black uppercase tracking-wider select-none leading-none">
                                        <Lock className="w-2.5 h-2.5 text-neutral-400" /> Locked
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center shrink-0">
                                {isEditingThis ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (tempModelName.trim()) {
                                        setCustomModelNames(prev => ({ ...prev, [model.id]: tempModelName.trim() }));
                                        setEditingModelId(null);
                                        triggerToast('info', 'Model Label Updated', `Node renamed: ${tempModelName.trim()}`);
                                      }
                                    }}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                    title="Save name"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingModelId(model.id);
                                      setTempModelName(finalName);
                                    }}
                                    className="p-1 px-1.5 text-neutral-400 hover:text-neutral-850 hover:bg-neutral-100 rounded-lg text-[10px] font-black flex items-center gap-0.5 transition-colors"
                                    title="Edit model label alias"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] text-neutral-450 leading-normal pl-8 font-medium">
                              {model.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Right Toolbar controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('history');
                setShowDrawer(true);
              }}
              className="px-3.5 py-2 border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 transition-all outline-none rounded-2xl flex items-center gap-2 shadow-2xs text-xs font-black text-neutral-700 cursor-pointer"
              title="对话历史 Dialogue history"
            >
              <History className="w-4 h-4 text-neutral-600" />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>

        </div>
      </header>



      {/* MAIN CONTENT CHASSIS - FLUID WIDE WEB LAYOUT */}
      <main className="flex-grow w-full max-w-4xl mx-auto flex flex-col relative z-10 px-4 md:px-6 pt-[95px] pb-10 font-sans">
        
        {isThreadFresh ? (
          /* Centered welcoming space with Norse Minimalist Aesthetics */
          <div className="flex-1 flex flex-col justify-between py-10 max-w-2xl mx-auto w-full animate-fadeIn min-h-[50vh]">
            <div className="flex flex-col items-center text-center mt-8">
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center mb-5">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl opacity-40 animate-pulse-slow" />
                <div className="relative w-14 h-14 rounded-2xl bg-white border border-neutral-200/50 shadow-md flex items-center justify-center">
                  <Sparkles className="w-6.5 h-6.5 text-indigo-600" />
                </div>
              </div>

              <h2 className="text-[34px] sm:text-[40px] font-black tracking-tight text-neutral-800 font-display">
                Welcome back, <span className="text-indigo-950">{userGreetingName}</span>
              </h2>
              <p className="text-neutral-500 font-bold text-sm mt-3 px-6 leading-relaxed max-w-md">
                Welcome to <strong className="text-neutral-850 font-extrabold">Aura AI Chatbot</strong>. I capture lifestyle parameters seamlessly inside a local secure cognitive base and recall them selectively to optimize future queries.
              </p>
            </div>

            {/* Context suggestions card grids */}
            <div className="mt-14">
              <span className="text-[10px] font-black tracking-widest text-[#726189] uppercase mb-4 px-1 flex items-center gap-1.5 font-sans">
                <Compass className="w-4 h-4 text-indigo-500" /> Tailored Context Trigger Cards:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions.map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(undefined, card.text)}
                    className="text-left p-5 bg-white/70 hover:bg-white border border-neutral-200/40 hover:border-neutral-200/80 rounded-2xl hover:scale-[1.01] transition-all text-xs font-semibold shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 group"
                  >
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                      {card.label}
                    </span>
                    <p className="text-neutral-800 leading-relaxed font-bold">
                      {card.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Core Dialogue thread messages feed container */
          <div className="flex flex-col gap-6 pt-2 pb-4 max-w-3xl mx-auto w-full">
            {activeSession.messages.map((message) => {
              const isModel = message.role === 'model';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col gap-2.5 max-w-[85%] ${
                    isModel ? 'self-start w-full' : 'self-end items-end'
                  }`}
                >
                  {isModel ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-1.5 mb-1 select-none">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[9px] font-black text-[#5d5a6c] uppercase tracking-wider">
                          {customModelNames[selectedModelId] || AVAILABLE_MODELS.find(m => m.id === selectedModelId)?.name || 'Aura Engine'}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-bold ml-2">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-neutral-800 text-[14px] sm:text-[14.5px] leading-relaxed bg-gradient-to-b from-white/75 via-white/65 to-white/75 backdrop-blur-xl p-5 rounded-3xl rounded-tl-sm border border-white/65 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.7),0_12px_28px_-4px_rgba(100,116,139,0.06),0_4px_12px_-2px_rgba(100,116,139,0.03)] select-text">
                        <div className="markdown-body font-sans antialiased text-neutral-800 leading-relaxed font-medium">
                          <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                        </div>
                      </div>

                      {/* Message Micro-controls Action row (Copy/Speak toggle) */}
                      <div className="mt-1 flex items-center gap-2 px-1 select-none">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-neutral-200/50 hover:bg-neutral-50 active:scale-95 transition-all text-[10px] text-neutral-500 hover:text-neutral-850 font-semibold cursor-pointer bg-white shadow-2xs outline-none"
                          title="Copy text content to clipboard"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-500 animate-[pulse_1s_infinite]" />
                              <span className="text-green-600 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleToggleSpeech(message.id, message.content)}
                          className={`flex items-center gap-1 py-1 px-2.5 rounded-lg border active:scale-95 transition-all text-[10px] font-semibold cursor-pointer shadow-2xs outline-none ${
                            speakingMessageId === message.id 
                              ? 'bg-rose-50 border-rose-250 text-rose-600 hover:bg-rose-100/60' 
                              : 'bg-white border-neutral-200/50 text-neutral-500 hover:text-neutral-850 hover:bg-neutral-50'
                          }`}
                          title={speakingMessageId === message.id ? "Stop voice synthesis" : "Synthesize voice speaking audio"}
                        >
                          {speakingMessageId === message.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-rose-500" />
                              <span className="text-rose-600 font-bold">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-neutral-400" />
                              <span>Speak</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Micro-pill overlay badges showing active recalled fact references */}
                      {message.recalledMemories && message.recalledMemories.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1 px-1">
                          {message.recalledMemories.map((id) => {
                            const correspondingMemory = memories.find(m => m.id === id);
                            if (!correspondingMemory) return null;
                            return (
                              <span
                                key={id}
                                onMouseEnter={() => setHoveredRecalledId(id)}
                                onMouseLeave={() => setHoveredRecalledId(null)}
                                className={`inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full text-[10px] font-extrabold border transition-all duration-300 ${
                                  hoveredRecalledId === id 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                    : 'bg-white border-neutral-200/30 text-neutral-500'
                                }`}
                                title={`Original context logged from: "${correspondingMemory.sourceContext}"`}
                              >
                                <Brain className="w-3 h-3 text-indigo-500" />
                                <span className="max-w-[200px] truncate">{correspondingMemory.fact}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* User Speech bubble pill */
                    <div className="flex flex-col items-end">
                      <div className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 mr-1">You</div>
                      <div className="purple-bubble-glow text-white px-5 py-3 rounded-2xl rounded-tr-xs text-[14px] font-semibold leading-relaxed select-text">
                        {message.content}
                      </div>
                      
                      {/* Attached File Preview inside Message bubble thread */}
                      {message.attachment && (
                        <div className="mt-2.5 flex flex-col items-end gap-1.5">
                          {message.attachment.type?.startsWith('image/') && message.attachment.base64 ? (
                            <div className="relative group overflow-hidden rounded-2xl border border-black/10 shadow-md">
                              <img
                                src={`data:${message.attachment.type};base64,${message.attachment.base64}`}
                                alt={message.attachment.name}
                                referrerPolicy="no-referrer"
                                className="max-w-[220px] sm:max-w-xs max-h-56 object-cover hover:scale-[1.02] transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900/40 hover:bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-xs text-left max-w-[260px] sm:max-w-sm transition-all text-white">
                              <div className="p-1.5 bg-white/10 rounded-lg text-white">
                                <Paperclip className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0 pr-1">
                                <span className="font-bold text-[11px] truncate leading-tight">{message.attachment.name}</span>
                                <span className="text-[9px] text-white/60 font-mono tracking-tight mt-0.5">{message.attachment.type || 'Binary'}&nbsp;•&nbsp;{message.attachment.size}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {selectedModelId === 'gemini-1.5-flash' && activeSession.messages.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mt-2 self-start w-full max-w-xl p-5 bg-gradient-to-br from-[#faf4ff] via-white to-white border border-[#eae0f5] rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_24px_rgba(118,71,235,0.04),0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {!user ? (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 select-none">
                        <Sparkles className="w-4 h-4 text-[#7647eb]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#7647eb] font-mono">Cognitive Memory Standby</span>
                      </div>
                      <h4 className="text-xs font-black text-[#2e1c4e] mb-1">Aura is operating on Compact Lite mode</h4>
                      <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                        Connecting your secure Google account persistent register saves dialogues, syncs tailored traits across devices, and unlocks advanced deep reasoning networks.
                      </p>
                    </div>
                    <button
                      onClick={handleGoogleLogin}
                      className="px-4 py-2.5 bg-[#170a25] hover:bg-[#2c1a40] border border-[#43236e]/10 text-white rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 transition-all select-none active:scale-97 cursor-pointer shrink-0 whitespace-nowrap outline-none shadow-md hover:shadow-lg"
                    >
                      <span>Connect Secure Account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 select-none">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 font-mono">Optimization Recommended</span>
                      </div>
                      <h4 className="text-xs font-black text-[#2e1c4e] mb-1">You are operating on Compact Lite mode</h4>
                      <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                        You are logged in, but you are currently utilizing the Compact 1.5 Lite model. Switch to **Aura Advanced Sync 3.5** to restore deep logical context and cognitive memory sync.
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedModelId('gemini-3.5-flash')}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-[11px] font-bold flex items-center gap-1.5 transition-all select-none active:scale-97 cursor-pointer shrink-0 whitespace-nowrap outline-none shadow-md"
                    >
                      <span>Switch to Advanced Sync</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {isSending && (
              <div className="flex flex-col gap-1 text-left self-start w-full transition-all duration-300">
                <div className="flex items-center gap-1.5 select-none mb-1.5 animate-[pulse_2s_infinite]">
                  <Sparkles className="w-3.5 h-3.5 text-[#7647eb] animate-[spin_4s_linear_infinite]" />
                  <span className="text-[9px] font-black tracking-widest text-[#7647eb]">Aura matches local context registers...</span>
                </div>
                <div className="mt-1 flex items-center gap-2 py-3 px-5 bg-gradient-to-br from-white/95 via-[#fcf6ff]/60 to-[#f3f0ff]/85 rounded-2xl border border-purple-200/50 max-w-xs shadow-[0_0_24px_rgba(168,85,247,0.14),0_4px_12px_rgba(99,102,241,0.04)] select-none">
                  <span className="w-2 h-2 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gradient-to-tr from-[#ff7ea5] to-[#ffc186] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-purple-950 font-black uppercase tracking-widest ml-2 flex items-center gap-0.5">
                    Thinking
                    <span className="animate-[pulse_1.2s_infinite] text-xs font-bold">...</span>
                  </span>
                </div>
              </div>
            )}

            {/* Spacing spacer pushing text above the fixed input bar cleanly without scrolling past into extra white background */}
            <div className="h-44 shrink-0 pointer-events-none" />
            <div ref={chatBottomRef} />
          </div>
        )}
      </main>

      {/* SITE FLOATING DOCK-STYLE INPUT BAR */}
      <div className={`fixed bottom-0 right-0 transition-all duration-300 bg-gradient-to-t from-[#fafafc] via-[#fafafc]/95 to-transparent pt-6 pb-6 px-4 z-20 shrink-0 ${showDrawer ? 'left-0 md:left-[350px] lg:left-[420px]' : 'left-0'}`}>
        <div className="max-w-3xl mx-auto relative font-sans">
          
          {/* LIQUID GLASSY ATTACHMENT BADGE WITH REMOVE BUTTON */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="mb-2.5 py-1.5 px-3 rounded-2xl bg-white/80 backdrop-blur-lg border border-neutral-200/45 flex items-center justify-between gap-3 shadow-2xs inline-flex text-xs text-neutral-800"
              >
                <div className="flex items-center gap-2">
                  <div className="p-0.5 bg-indigo-55/40 text-indigo-600 rounded-lg flex items-center justify-center overflow-hidden w-6 h-6 shrink-0 border border-indigo-100/50">
                    {attachedFile.type?.startsWith('image/') && attachedFile.base64 ? (
                      <img 
                        src={`data:${attachedFile.type};base64,${attachedFile.base64}`} 
                        alt="attachment-thumb" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-md" 
                      />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="font-bold truncate max-w-[180px] text-[11px]">{attachedFile.name}</span>
                  <span className="text-[9px] text-neutral-400 font-mono">({attachedFile.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer transition-colors flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="relative flex items-center bg-white/85 backdrop-blur-md rounded-3xl p-1.5 pl-4 border border-neutral-200/50 shadow-[0_16px_48px_rgba(31,38,135,0.06)] ring-1 ring-neutral-900/5">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*,video/*,audio/*,.pdf,.zip,.tar,.gz,.txt,.json,.csv,.md,.js,.ts,.html,.css" 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-neutral-405 hover:text-neutral-700 hover:bg-neutral-100 rounded-full cursor-pointer flex items-center justify-center transition-all shrink-0"
              title="Attach context file"
            >
              <Paperclip className="w-5 h-5 text-neutral-400" />
            </button>
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-2 mr-2 rounded-full cursor-pointer flex items-center justify-center transition-all shrink-0 ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]' 
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
              }`}
              title="Speak to Aura"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? "Listening... Speak now..." : `Dialogue sync parameters with ${customModelNames[selectedModelId] || AVAILABLE_MODELS.find(m => m.id === selectedModelId)?.name}...`}
              disabled={isSending}
              className="flex-1 py-3 bg-transparent border-0 text-xs sm:text-sm text-neutral-800 placeholder-neutral-400 outline-none select-text focus:ring-0 focus:outline-none"
            />

            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="w-10 h-10 bg-neutral-900 override-p-0 hover:bg-indigo-600 transition-all text-white rounded-full flex items-center justify-center cursor-pointer shadow-md disabled:opacity-20 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-1.5 select-none flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="text-[10px] text-neutral-400 font-extrabold tracking-widest uppercase">
              Aura AI Chatbot is AI and can make mistakes.
            </span>
            <span className="text-neutral-300">•</span>
            <a 
              href="/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-indigo-505 hover:text-indigo-600 font-extrabold tracking-widest uppercase underline transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>

      </div>

      {/* COGNITIVE REGISTER DRAWER (MOBILE VIEW OVERLAY) */}
      <div className="md:hidden">
        <CognitiveRegisterDrawer
          isSidebar={false}
          showDrawer={showDrawer}
          setShowDrawer={setShowDrawer}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          memories={memories}
          setMemories={setMemories}
          sessions={sessions}
          setSessions={setSessions}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          createNewSession={createNewSession}
          deleteSession={deleteSession}
          isAddingFact={isAddingFact}
          setIsAddingFact={setIsAddingFact}
          newFactContent={newFactContent}
          setNewFactContent={setNewFactContent}
          newFactCategory={newFactCategory}
          setNewFactCategory={setNewFactCategory}
          handleAddNewFact={handleAddNewFact}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          hoveredRecalledId={hoveredRecalledId}
          setHoveredRecalledId={setHoveredRecalledId}
          toggleMemoryActive={toggleMemoryActive}
          deleteMemory={deleteMemory}
          bootstrapMemories={BOOTSTRAP_MEMORIES}
          triggerToast={triggerToast}
          
          user={user}
          onLogin={handleGoogleLogin}
          onLogout={handleGoogleLogout}
          driveBackups={driveBackups}
          isBackingUp={isBackingUp}
          isRestoring={isRestoring}
          onBackupToDrive={handleBackupToDrive}
          onRestoreFromDrive={handleRestoreFromDrive}
          onDeleteBackup={handleDeleteBackup}
          isLoadingDrive={isLoadingDrive}
          onRefreshDrive={handleRefreshDrive}
          isSyncingFirestore={isSyncingFirestore}
          onForceSyncFirestore={handleForceSyncFirestore}
        />
      </div>

      {/* Onboarding Questionnaire Modal for first-time profile sync */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        userEmail={user?.email || ''}
      />

      {/* Dynamic Cognitive Core Synchronization Overlay with Interactive Dino Game */}
      <AnimatePresence>
        {isSyncingFirestore && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 pointer-events-auto overflow-y-auto"
          >
            <motion.div
              layout="position"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`bg-white border select-none border-neutral-200/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] rounded-3xl p-6 sm:p-8 w-full text-center flex flex-col items-center gap-5 transition-all duration-300 ${
                showDinoInsideSync ? 'max-w-xl' : 'max-w-sm'
              }`}
            >
              {isDataLoadedAndReady && showDinoInsideSync && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 select-none">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-green-600 font-mono">Sync Completed Successfully</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 font-bold mt-1 leading-relaxed">
                      Your memory registers, custom models, and dialog histories are calibrated. Keep running for high scores or enter when you are done!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDinoInsideSync(false);
                      setIsSyncingFirestore(false);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 transition-all select-none active:scale-97 cursor-pointer hover:shadow-xs shadow-md outline-none"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full text-left bg-neutral-50 p-4 border border-neutral-100 rounded-2xl">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-xl" />
                  <div className="relative w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    {isDataLoadedAndReady ? (
                      <Check className="w-5 h-5 text-green-500 font-bold" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight font-sans">
                    {isDataLoadedAndReady ? 'Cognitive Registers Hot-Loaded' : 'Synchronizing Dialogue Core'}
                  </h3>
                  <p className="text-[9px] text-neutral-400 font-black uppercase tracking-wider font-mono mt-0.5">
                    {isDataLoadedAndReady ? 'Secure Local Cache Active' : 'Live Database Stream'}
                  </p>
                  {!showDinoInsideSync && (
                    <p className="text-[11px] text-neutral-500 font-bold leading-relaxed mt-1">
                      Hold on while we load your secure dialogue nodes and custom traits.
                    </p>
                  )}
                </div>
              </div>

              {!showDinoInsideSync && (
                <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[pulse_1.5s_infinite] w-full" />
                </div>
              )}

              {/* Seamless expandable game container */}
              {showDinoInsideSync ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full"
                >
                  <DinoGame />
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDinoInsideSync(true)}
                  className="w-full py-2.5 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-neutral-700 transition-all select-none hover:shadow-2xs cursor-pointer active:scale-98 outline-none"
                >
                  <span>👾 Bored? Play Chrome Dino While Waiting</span>
                </button>
              )}

              {showDinoInsideSync && (
                <button
                  type="button"
                  onClick={() => setShowDinoInsideSync(false)}
                  className="text-[10px] text-neutral-400 font-bold hover:text-neutral-600 transition-colors select-none cursor-pointer mt-1"
                >
                  Hide Interactive Dino Runner
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert Indicators */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 max-w-sm w-full z-50 pointer-events-none px-4 md:px-0 font-sans">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              className="pointer-events-auto w-full p-4.5 bg-neutral-950 border border-white/10 text-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.22)] flex items-start gap-3"
            >
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
                <Brain className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-[9px] font-black uppercase tracking-wider text-[#9d9ca1]">Registry Synchronous Update</h5>
                <p className="text-xs font-black text-white mt-1 leading-normal">
                  {toast.message}
                </p>
                {toast.detail && (
                  <p className="text-[11px] text-[#bcbbcf] mt-1 italic font-medium leading-relaxed truncate">
                    "{toast.detail}"
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
