import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  X,
  MessageSquare,
  Plus,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  Filter,
  Flame,
  Clock,
  Cloud,
  Database,
  LogOut,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { Memory, ChatSession } from '../types';

interface CognitiveRegisterDrawerProps {
  isSidebar?: boolean;
  showDrawer: boolean;
  setShowDrawer: (show: boolean) => void;
  activeTab: 'memory' | 'history' | 'cloud';
  setActiveTab: (tab: 'memory' | 'history' | 'cloud') => void;
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  createNewSession: () => void;
  deleteSession: (id: string, e: React.MouseEvent) => void;
  isAddingFact: boolean;
  setIsAddingFact: (val: boolean) => void;
  newFactContent: string;
  setNewFactContent: (val: string) => void;
  newFactCategory: 'preference' | 'personal' | 'career' | 'interest' | 'other';
  setNewFactCategory: (val: 'preference' | 'personal' | 'career' | 'interest' | 'other') => void;
  handleAddNewFact: (e: React.FormEvent) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  hoveredRecalledId: string | null;
  setHoveredRecalledId: (id: string | null) => void;
  toggleMemoryActive: (id: string) => void;
  deleteMemory: (id: string, e: React.MouseEvent) => void;
  bootstrapMemories: Memory[];
  triggerToast: (type: 'add' | 'remove' | 'info', message: string, detail?: string) => void;

  // Cloud integration props
  user: any | null;
  onLogin: () => void;
  onLogout: () => void;
  driveBackups: any[];
  isBackingUp: boolean;
  isRestoring: boolean;
  onBackupToDrive: () => void;
  onRestoreFromDrive: (fileId: string) => void;
  onDeleteBackup: (fileId: string) => void;
  isLoadingDrive: boolean;
  onRefreshDrive: () => void;
  isSyncingFirestore: boolean;
  onForceSyncFirestore: () => void;
}

export const CognitiveRegisterDrawer: React.FC<CognitiveRegisterDrawerProps> = ({
  isSidebar = false,
  showDrawer,
  setShowDrawer,
  activeTab,
  setActiveTab,
  memories,
  setMemories,
  sessions,
  setSessions,
  activeSessionId,
  setActiveSessionId,
  createNewSession,
  deleteSession,
  isAddingFact,
  setIsAddingFact,
  newFactContent,
  setNewFactContent,
  newFactCategory,
  setNewFactCategory,
  handleAddNewFact,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  hoveredRecalledId,
  setHoveredRecalledId,
  toggleMemoryActive,
  deleteMemory,
  bootstrapMemories,
  triggerToast,

  // Cloud integrations
  user,
  onLogin,
  onLogout,
  driveBackups,
  isBackingUp,
  isRestoring,
  onRestoreFromDrive,
  onBackupToDrive,
  onDeleteBackup,
  isLoadingDrive,
  onRefreshDrive,
  isSyncingFirestore,
  onForceSyncFirestore
}) => {
  const filteredMemories = memories.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.fact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.sourceContext && m.sourceContext.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const renderInner = () => (
    <>
      {/* Soft Ambient glowing blob behind the glass inside the panel */}
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-gradient-to-tr from-indigo-300/10 to-purple-300/15 rounded-full blur-[60px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-emerald-200/10 rounded-full blur-[50px] pointer-events-none -z-10" />

      {/* Drawer Header */}
      <div className="p-5 border-b border-neutral-100/40 flex items-center justify-between bg-white/30 backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 flex items-center justify-center border border-indigo-400/20 group">
                  <Brain className="w-4.5 h-4.5 text-indigo-600 animate-pulse-slow" />
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-xl filter blur-sm group-hover:opacity-100 opacity-0 transition-opacity" />
                </div>
                <div>
                  <span className="text-xs font-black text-neutral-800 uppercase tracking-widest block">Aura</span>
                  <span className="text-[9px] font-semibold text-neutral-400">Context Memory Base</span>
                </div>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-full border border-neutral-200/40 text-neutral-500 hover:text-neutral-800 outline-none hover:bg-neutral-100/60 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Tabs Switch with dynamic sliding bubble indicator */}
            <div className="mx-4 mt-5 bg-neutral-100/60 backdrop-blur-xs rounded-xl p-1 flex gap-0.5 relative border border-white/40">
              <button
                onClick={() => setActiveTab('history')}
                className="flex-1 py-1.5 rounded-lg text-[9.5px] font-black tracking-wider transition-all duration-300 outline-none cursor-pointer relative z-10"
              >
                <span className={`flex items-center justify-center gap-1 ${activeTab === 'history' ? 'text-indigo-950 font-extrabold' : 'text-neutral-500'}`}>
                  <MessageSquare className="w-3 h-3" />
                  Chats ({sessions.length})
                </span>
                {activeTab === 'history' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-[1px] bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/20 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                className="flex-1 py-1.5 rounded-lg text-[9.5px] font-black tracking-wider transition-all duration-300 outline-none cursor-pointer relative z-10"
              >
                <span className={`flex items-center justify-center gap-1 ${activeTab === 'memory' ? 'text-indigo-950 font-extrabold' : 'text-neutral-500'}`}>
                  <Brain className="w-3 h-3" />
                  Traits ({memories.length})
                </span>
                {activeTab === 'memory' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-[1px] bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/20 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('cloud')}
                className="flex-1 py-1.5 rounded-lg text-[9.5px] font-black tracking-wider transition-all duration-300 outline-none cursor-pointer relative z-10"
              >
                <span className={`flex items-center justify-center gap-1 ${activeTab === 'cloud' ? 'text-indigo-950 font-extrabold' : 'text-neutral-500'}`}>
                  <Cloud className="w-3 h-3" />
                  Cloud & Drive
                </span>
                {activeTab === 'cloud' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-[1px] bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-neutral-200/20 -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            </div>

            {/* Main drawer list scroll body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
              {activeTab === 'history' ? (
                /* Dialogue history list */
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold tracking-widest text-[#726189] uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Dialogue History
                    </span>
                    <button
                      onClick={createNewSession}
                      className="px-3 py-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold flex items-center gap-1 outline-none transition-all cursor-pointer shadow-sm hover:scale-[1.03] active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Chat
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 pr-0.5">
                    {sessions.map(sess => {
                      const isActive = sess.id === activeSessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            setActiveSessionId(sess.id);
                            if (!isSidebar) {
                              setShowDrawer(false);
                            }
                          }}
                          className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-neutral-900 border-neutral-950 text-white shadow-md shadow-neutral-950/25 scale-[1.01]'
                              : 'bg-white/40 border-neutral-200/35 hover:bg-white/90 text-neutral-700 hover:scale-[1.01] hover:border-neutral-200/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-neutral-500 group-hover:text-neutral-700'}`} />
                            <span className="text-xs font-bold truncate tracking-tight">{sess.title}</span>
                          </div>
                          {sessions.length > 1 && (
                            <button
                              onClick={(e) => deleteSession(sess.id, e)}
                              className={`p-1 rounded-md transition-colors ${
                                isActive 
                                  ? 'text-neutral-400 hover:text-white hover:bg-white/10' 
                                  : 'text-neutral-400 hover:text-red-500 hover:bg-neutral-150'
                              } outline-none cursor-pointer`}
                              title="Delete dialogue node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeTab === 'memory' ? (
                /* Memories List view - Dynamic, detailed interactive glassmorphic traits */
                <div className="flex flex-col gap-4 animate-fadeIn">
                  <div className="p-3.5 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border border-indigo-100/25 rounded-2xl">
                    <p className="text-[10px] text-neutral-500 font-medium leading-relaxed flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      Traits are linked implicitly to dialogue feeds and match contextual keywords dynamically.
                    </p>
                  </div>

                  <div className="pb-1">
                    {!isAddingFact ? (
                      <button
                        onClick={() => setIsAddingFact(true)}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-99 hover:scale-[1.01]"
                      >
                        <Plus className="w-4 h-4" /> Append Custom Trait Node
                      </button>
                    ) : (
                      <form onSubmit={handleAddNewFact} className="flex flex-col gap-2.5 p-3.5 bg-white/75 backdrop-blur-md border border-indigo-200/30 rounded-2xl animate-scaleIn shadow-lg">
                        <textarea
                          required
                          value={newFactContent}
                          onChange={(e) => setNewFactContent(e.target.value)}
                          placeholder="E.g. 'User runs a digital studio and prefers dark-mode styling'"
                          className="w-full min-h-[56px] p-2.5 bg-[#fbfbfd] border border-neutral-200/40 rounded-xl text-xs placeholder-neutral-400 text-neutral-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400/30 focus:border-indigo-400/50"
                        />
                        <div className="flex items-center justify-between gap-1.5 font-sans">
                          <select
                            value={newFactCategory}
                            onChange={(e) => setNewFactCategory(e.target.value as any)}
                            className="text-[10px] font-black text-neutral-700 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200/30 outline-none cursor-pointer focus:outline-none"
                          >
                            <option value="preference">Preference</option>
                            <option value="personal">Personal</option>
                            <option value="career">Career / Work</option>
                            <option value="interest">Interest</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setIsAddingFact(false)}
                              className="py-1 px-2.5 rounded-lg text-[10px] font-bold text-neutral-500 hover:bg-neutral-100"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="py-1 px-3 bg-neutral-900 border border-neutral-950 text-white rounded-lg text-[10px] font-black shadow-xs cursor-pointer hover:bg-neutral-800 transition-all"
                            >
                              Add Node
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Filters block */}
                  <div className="flex flex-col gap-2.5 border-t border-neutral-100/50 pt-4">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                        <Filter className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search model trait register..."
                        className="w-full pl-9 pr-3 py-2 bg-white/40 border border-neutral-200/30 rounded-xl text-xs placeholder-neutral-400 text-neutral-800 focus:outline-none focus:bg-white/90 focus:border-indigo-400/30 focus:ring-1 focus:ring-indigo-400/20"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-1 font-sans">
                      {['all', 'preference', 'personal', 'career', 'interest'].map(cat => {
                        const isActive = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wider uppercase transition-all duration-200 outline-none cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/15'
                                : 'bg-neutral-100/50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trait register list nodes inside slider */}
                  <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto scrollbar-none pb-4">
                    {filteredMemories.length === 0 ? (
                      <div className="py-8 text-center bg-white/30 rounded-2xl border border-dashed border-neutral-200/50">
                        <Layers className="w-5 h-5 text-neutral-300 mx-auto" />
                        <span className="text-[10px] text-neutral-400 mt-1 block font-bold">Empty Registers Match</span>
                      </div>
                    ) : (
                      filteredMemories.map(m => {
                        const isRecalledInFeed = hoveredRecalledId === m.id;
                        return (
                          <div
                            key={m.id}
                            className={`p-3.5 border rounded-2xl flex flex-col gap-2 transition-all duration-300 relative overflow-hidden group ${
                              isRecalledInFeed
                                ? 'bg-indigo-50/70 border-indigo-300 scale-[1.01] shadow-[0_8px_20px_rgba(99,102,241,0.08)]'
                                : m.isActive
                                ? 'bg-white/40 border-neutral-200/25 hover:bg-white/95 hover:border-neutral-200/55 hover:shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:scale-[1.005]'
                                : 'bg-neutral-100/50 opacity-55 border-neutral-200/10'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 relative z-10">
                              <span className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                m.category === 'preference' ? 'bg-pink-100/40 border-pink-200/30 text-pink-750' :
                                m.category === 'personal' ? 'bg-indigo-100/40 border-indigo-200/30 text-indigo-750' :
                                m.category === 'career' ? 'bg-amber-100/40 border-amber-200/30 text-amber-750' :
                                m.category === 'interest' ? 'bg-emerald-100/40 border-emerald-200/30 text-emerald-750' :
                                'bg-neutral-200/40 border-neutral-300/30 text-neutral-750'
                              }`}>
                                {m.category}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => toggleMemoryActive(m.id)}
                                  className="p-1 rounded-md hover:bg-white text-neutral-500 border border-neutral-200/20 hover:border-neutral-200/40 hover:text-neutral-850 outline-none cursor-pointer"
                                  title={m.isActive ? "Deactivate Trait Node" : "Activate Trait Node"}
                                >
                                  {m.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={(e) => deleteMemory(m.id, e)}
                                  className="p-1 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-600 border border-neutral-200/15 hover:border-red-200/20 outline-none cursor-pointer"
                                  title="Purge"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-zinc-800 relative z-10 select-text">
                              {m.fact}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Cloud & Google Drive Backups Tab */
                <div className="flex flex-col gap-4 animate-fadeIn font-sans text-neutral-700">
                  
                  {!user ? (
                    /* Elegant "Google Sign-In" wrapper */
                    <div className="flex flex-col items-center justify-center p-6 bg-white/45 backdrop-blur-md rounded-2xl border border-neutral-200/30 shadow-2xs text-center">
                      <Cloud className="w-10 h-10 text-indigo-500 mb-3 animate-pulse-slow" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">Unsynchronized</h4>
                      <p className="text-[10px] text-neutral-400 mb-4 leading-relaxed max-w-[220px]">
                        Sign in with Google to synchronize your Aura Memory registers live in Firestore, and unlock backup options in Google Drive.
                      </p>

                      <button
                        onClick={onLogin}
                        className="w-full max-w-xs py-2.5 px-4 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-750 hover:text-neutral-900 rounded-xl font-bold text-xs flex items-center justify-center gap-3 border border-neutral-200/60 shadow-sm transition-all duration-200 active:scale-98 cursor-pointer outline-none font-sans"
                      >
                        <div className="w-5 h-5 flex items-center justify-center bg-white rounded-md overflow-hidden shrink-0">
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 block">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="font-semibold text-xs tracking-tight text-neutral-700">Sign in with Google</span>
                      </button>
                    </div>
                  ) : (
                    /* Cloud Synchronization Space */
                    <div className="flex flex-col gap-4 animate-fadeIn">
                      
                      {/* Active User Header Banner */}
                      <div className="p-3 bg-white/45 backdrop-blur-md rounded-xl border border-neutral-200/20 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full object-cover border border-neutral-200 shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-7 h-7 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                              <UserIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <span className="text-xs font-bold block truncate text-neutral-850 leading-snug">{user.displayName}</span>
                            <span className="text-[9px] text-neutral-400 block truncate leading-none">{user.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={onLogout}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded-lg outline-none cursor-pointer transition-colors shrink-0"
                          title="Sign Out"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Section: Firebase Live Sync Status */}
                      <div className="p-3.5 bg-gradient-to-tr from-emerald-50/20 via-white/50 to-indigo-50/10 border border-neutral-200/20 rounded-xl relative overflow-hidden flex flex-col gap-2.5 shadow-2xs">
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-black uppercase tracking-wider">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline shrink-0" /> Synchronized
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <Database className="w-4 h-4 text-emerald-500" />
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-800">Firestore Cloud Nodes</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center py-0.5">
                          <div className="p-2 bg-neutral-50/40 rounded-lg border border-neutral-100">
                            <span className="text-[10px] text-neutral-400 block font-medium">Memory Cells</span>
                            <span className="text-xs font-black text-neutral-800">{memories.length} item(s)</span>
                          </div>
                          <div className="p-2 bg-neutral-50/40 rounded-lg border border-neutral-100">
                            <span className="text-[10px] text-neutral-400 block font-medium">Dialogue Feeds</span>
                            <span className="text-xs font-black text-neutral-800">{sessions.length} thread(s)</span>
                          </div>
                        </div>

                        <button
                          onClick={onForceSyncFirestore}
                          disabled={isSyncingFirestore}
                          className="w-full py-1.5 bg-neutral-100/70 hover:bg-neutral-100 text-[10px] font-extrabold text-neutral-800 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-neutral-200/30 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
                          {isSyncingFirestore ? 'Rebuilding Core Sync...' : 'Synchronize registers now'}
                        </button>
                      </div>

                      {/* Section: Google Drive Backup Engine */}
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-950/60 flex items-center gap-1.5">
                            <Cloud className="w-3.5 h-3.5 text-indigo-500" /> Google Drive Backups
                          </span>
                          <button
                            onClick={onRefreshDrive}
                            disabled={isLoadingDrive}
                            className="p-1 border border-neutral-200/40 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 cursor-pointer disabled:opacity-50"
                            title="Re-query backups in Google Drive"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                          </button>
                        </div>

                        <button
                          onClick={onBackupToDrive}
                          disabled={isBackingUp || isRestoring}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 hover:scale-[1.01]"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isBackingUp ? 'Writing Backup file...' : 'Export backup to Google Drive'}
                        </button>

                        {/* Backup List scrolling workspace */}
                        <div className="flex flex-col gap-1.5 mt-1 max-h-[220px] overflow-y-auto pr-0.5">
                          {isLoadingDrive ? (
                            <div className="py-8 text-center text-neutral-400">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-1" />
                              <span className="text-[10px] font-bold">Inquiring Google Drive files...</span>
                            </div>
                          ) : driveBackups.length === 0 ? (
                            <div className="py-8 text-center text-neutral-400 bg-white/30 border border-dashed border-neutral-200/40 rounded-xl">
                              <Cloud className="w-5 h-5 opacity-40 mx-auto text-neutral-400 mb-1" />
                              <span className="text-[10px] font-bold">No backups parsed in your Google Drive</span>
                              <span className="text-[9px] text-neutral-450 block px-4 leading-normal mt-0.5">Files named 'aura_brain_backup_*.json' will be listed here.</span>
                            </div>
                          ) : (
                            driveBackups.map(file => {
                              const createdDateString = new Date(file.createdTime).toLocaleString();
                              const sizeInKB = file.size 
                                ? (parseInt(file.size) / 1024).toFixed(1) + ' KB'
                                : '1.5 KB';
                              return (
                                <div
                                  key={file.id}
                                  className="p-2.5 bg-white/45 backdrop-blur-md border border-neutral-200/30 hover:border-neutral-200/60 rounded-xl flex items-center justify-between gap-3 group/item text-left transition-all"
                                >
                                  <div className="overflow-hidden">
                                    <span className="text-[10.5px] font-bold block truncate text-neutral-800 leading-tight">
                                      {file.name}
                                    </span>
                                    <span className="text-[9px] text-neutral-400 block leading-normal pt-0.5">
                                      {createdDateString} • <span className="font-mono">{sizeInKB}</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => onRestoreFromDrive(file.id)}
                                      disabled={isBackingUp || isRestoring}
                                      className="p-1 hover:bg-indigo-50 border border-neutral-200/30 hover:border-indigo-100 text-neutral-500 hover:text-indigo-600 rounded-md cursor-pointer mr-0.5"
                                      title="Load and calibrate Aura with this backup"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteBackup(file.id)}
                                      disabled={isBackingUp || isRestoring}
                                      className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 border border-transparent hover:border-red-100 rounded-md cursor-pointer"
                                      title="Move back up file to trash"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nordic branding watermark */}
                  <div className="mt-4 p-3 bg-indigo-50/20 border border-indigo-100/10 rounded-xl flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-[9.5px] text-indigo-900/60 leading-normal">
                      Authentication securely routed via token caching. Your personal data is strictly isolated on sandbox firewalls.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Reset memory button at drawer base */}
            <div className="p-4 bg-white/40 border-t border-neutral-100/40 flex flex-col gap-2 mt-auto backdrop-blur-xs relative shrink-0">
              <button
                onClick={() => {
                  if (confirm('Format memory core parameters back to original defaults?')) {
                    setMemories(bootstrapMemories);
                    setSessions([
                      {
                        id: 'session-default',
                        title: 'Aura Sync Briefing',
                        messages: [
                          {
                            id: 'welcome-msg',
                            role: 'model',
                            content: `Dialogue reset core completed successfully. All contextual memories are loaded back to defaults. Let's sync up!`,
                            timestamp: new Date().toISOString()
                          }
                        ],
                        createdAt: new Date().toISOString()
                      }
                    ]);
                    setActiveSessionId('session-default');
                    if (!isSidebar) {
                      setShowDrawer(false);
                    }
                    triggerToast('info', 'Cognitive Calibration Complete', 'Default template traits populated.');
                  }
                }}
                className="w-full py-2.5 rounded-xl border border-neutral-200 text-center text-[10.5px] font-black uppercase tracking-wider hover:bg-red-50/40 text-neutral-400 hover:border-red-200/30 hover:text-red-600 cursor-pointer outline-none transition-all shadow-2xs"
              >
                Format Systems
              </button>
            </div>
    </>
  );

  if (isSidebar) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden bg-white/45">
        {renderInner()}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {showDrawer && (
        <>
          {/* Overlay drop-matte with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDrawer(false)}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-30 cursor-pointer"
          />

          {/* Sizable Sliding Drawer body styled with liquid glassmorphism */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="fixed inset-y-0 left-0 w-[86%] sm:w-[350px] md:w-[420px] bg-white/70 backdrop-blur-2xl z-45 flex flex-col shadow-[24px_0_80px_rgba(31,38,135,0.15)] border-r border-white/30 overflow-hidden"
          >
            {renderInner()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
