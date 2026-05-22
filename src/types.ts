/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Memory {
  id: string;
  fact: string;
  category: 'personal' | 'preference' | 'career' | 'interest' | 'other';
  createdAt: string;
  sourceContext?: string; // e.g., "Learned from: \"My name is Keyush\""
  isActive: boolean; // Allows the user to toggle off/on standard search retrieval
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  recalledMemories?: string[]; // Array of Memory ids that were active in constructing this response
  textBackup?: string; // Opt keeping raw context payload details separate from UI display
  attachment?: {
    name: string;
    size: string;
    type: string;
    base64?: string;
    content?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface ChatRequestPayload {
  messages: { role: 'user' | 'model'; content: string }[];
  memories: Memory[];
}

export interface ChatResponsePayload {
  reply: string;
  recalledMemoryIds: string[];
}

export interface CognitiveModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface MemoryExtractRequestPayload {
  messages: { role: 'user' | 'model'; content: string }[];
  existingMemories: Memory[];
}

export interface MemoryExtractResponsePayload {
  newMemories: Omit<Memory, 'id' | 'createdAt' | 'isActive'>[];
  deletedMemoryFacts: string[]; // Facts to remove or match against
}
