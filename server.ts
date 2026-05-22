import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Port configuration (Vite proxy layer expects 3000)
const PORT = 3000;

// Smart Offline Brain Node Synthesis Backup Engine
function fallbackOfflineResponse(userQuery: string, memories: any[], originalError?: string) {
  const activeMemories = Array.isArray(memories) ? memories.filter(m => m.isActive) : [];
  const matchedMemories: any[] = [];
  const queryLower = (userQuery || '').toLowerCase();

  // Explicit keyword categories to map context nodes offline
  activeMemories.forEach(m => {
    const factLower = m.fact.toLowerCase();
    const catLower = m.category.toLowerCase();
    
    const keywords = [
      'matcha', 'oat', 'latte', 'drink', 'beverage', 'sweetener', 'sugar',
      'aero', 'studio', 'agency', 'career', 'job', 'work', 'design', 'sprint',
      'marathon', 'run', 'trail', 'training', 'fitness', 'exercise', 'athletic',
      'scandinavian', 'mid-century', 'furniture', 'architecture', 'nordic', 'vintage', 'chair', 'table'
    ];
    
    let matched = false;
    for (const key of keywords) {
      if (queryLower.includes(key) && (factLower.includes(key) || catLower.includes(key))) {
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      const tokens = queryLower.split(/\s+/).filter(t => t.length > 3);
      for (const token of tokens) {
        if (factLower.includes(token)) {
          matched = true;
          break;
        }
      }
    }
    
    if (matched) {
      matchedMemories.push(m);
    }
  });

  const recalledMemoryIds = matchedMemories.map(m => m.id);
  let replyMarkdown = '';

  if (matchedMemories.length > 0) {
    replyMarkdown = `### 🌫️ Local Safe Mode Active

I am currently running in offline context-safe mode. However, I immediately matched your active registers to personalize this answer:

${matchedMemories.map(m => `* **${m.category.toUpperCase()} REGISTER**: *"${m.fact}"*`).join('\n')}

Based on your context, I'm tailoring my advice to these preferences. To restore live intelligence and deep reasoning, make sure your API keys and quotas are fully active.`;
  } else {
    replyMarkdown = `### 🌫️ Local Safe Mode Active

I am currently operating in offline context-safe mode. Your cognitive traits are safely cached offline.

*Try asking me about some of your preferences (like your preferred drinks or goals) to trigger offline context search!*`;
  }

  return {
    reply: replyMarkdown,
    recalledMemoryIds,
    newMemories: [],
    outdatedMemoryIds: []
  };
}

// Google Site Ownership Verification
app.get('/google2f80caf68063022c.html', (req, res) => {
  res.send('google-site-verification: google2f80caf68063022c.html');
});

// Privacy Policy hosted on our qualified domain (Aura AI Chatbot)
app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Privacy Policy - Aura AI Chatbot</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Google Sans', sans-serif;
            background-color: #fafafc;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
            border: 1px solid #e2e8f0;
          }
          h1 {
            color: #0f172a;
            font-size: 32px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 24px;
            letter-spacing: -0.02em;
          }
          h2 {
            color: #1e1b4b;
            font-size: 20px;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 16px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 8px;
          }
          p, li {
            font-size: 15px;
            color: #475569;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Privacy Policy for Aura AI Chatbot</h1>
          <p><strong>Effective Date:</strong> May 22, 2026</p>
          <p>Aura AI Chatbot ("we", "our", "us") operates the personal AI memory and dialogue assistant applet. We respect your privacy and are committed to protecting any personal data we collect or process on your behalf.</p>

          <h2>1. Information We Collect</h2>
          <p>To provide a highly customized and intelligent memory experience, we process two categories of data:</p>
          <ul>
            <li><strong>Dialogue & Interventions:</strong> The conversation history you type or speak is analyzed by Google's Gemini models to generate fluid, personalized responses.</li>
            <li><strong>Cognitive Memory Registers (Traits):</strong> Preferred lifestyle parameters (such as diet needs, active goals, or careers) are extracted optionally and stored in your browser's local state or secure cloud database (Firebase Firestore) if synchronized.</li>
          </ul>

          <h2>2. How We Use Information</h2>
          <p>We use the collected parameters to:</p>
          <ul>
            <li>Instantly match preferences and recall contextual facts, ensuring your dialogues are high-context and personal.</li>
            <li>Persist information inside your authorized Google cloud backup drive so you never lose your parameters.</li>
            <li>Refine the model parameters within the context window for high-fidelity responses. We do NOT use your private traits or database records for training any generative artificial intelligence models.</li>
          </ul>

          <h2>3. Third-Party Integrations & Data Transfer</h2>
          <p>Your dialogue is backed up or synced strictly through Google OAuth Integration, Google Firebase Firestore, and Google Gemini API services. We do not sell or lease your personal profiles, memories, or chats to any external third-parties.</p>

          <h2>4. Data Custody and Security</h2>
          <p>You remain the full custodian of your data. You can delete individual memories, clear whole conversation threads, or unlink/logout your secure account at any time. When you instruct a deletion, information is fully scrubbed from live databases instantly.</p>

          <h2>5. Contact Us</h2>
          <p>If you have questions about this Policy, please reach out via settings or file a report within your workspace.</p>
          
          <div class="footer">
            &copy; 2026 Aura AI Chatbot. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `);
});

// Chat completion with Memory recall and extraction
app.post('/api/chat', async (req, res) => {
  const { messages, memories, modelId } = req.body;
  try {

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const compiledMemories = Array.isArray(memories) ? memories : [];
    
    // Fallback translating modelIds to standard registered Gemini model ID nodes
    let activeModel = 'gemini-3.5-flash';
    if (modelId) {
      if (modelId === 'gemini-1.5-pro' || modelId === 'gemini-1.5-flash') {
        activeModel = modelId;
      } else {
        // Fallback standard fast node
        activeModel = 'gemini-3.5-flash';
      }
    }

    // Constructing system instructions incorporating the user's memories
    const memoriesContext = compiledMemories.length > 0
      ? compiledMemories
          .filter((m) => m.isActive)
          .map((m) => `- [ID: ${m.id}] ${m.fact} (Context: ${m.sourceContext || 'Direct Statement'})`)
          .join('\n')
      : 'No memories recorded yet.';

    const systemInstruction = `You are an elegant, deeply empathetic AI personal assistant with perfect personalized memory recall.
Your visual style is premium Apple inspired: seamless, fluid, ultra-high fidelity, and humble.

Here is the current database of key facts/preferences you know about the user:
${memoriesContext}

Core Objectives:
1. Provide a beautiful, highly personalized response to the user's latest message using relevant memories where appropriate.
2. If an active memory is relevant and was used to personalize the answer, include its complete ID in the "recalledMemoryIds" array. Be selective; only recall if it genuinely shaped the advice or tone.
3. Keep track of user's personal details, preferences, occupation, dietary needs, goals, or lifestyle as they talk.
4. If the user shares a NEW fact or preference that is NOT already in the database, extract it. Return it in "newMemories". Write facts strictly in third person (e.g. "User is a designer").
5. If the user contradicts, updates, or corrects an existing memory, represent this by putting that memory's ID in "outdatedMemoryIds" (so the client can clean/modify it).
6. Ensure the chatbot reply is rendered in gorgeous Markdown. Do not refer to memory IDs in the text content itself (i.e. do not say "Based on ID mem_1"). Make the tone warm, intellectual, concise, and professional.

Ensure you always return a structured JSON response matching the provided schema.`;

    // We pass the conversation history
    // Convert to Gemini format: role 'user' or 'model'
    const formattedContents = messages.map(msg => {
      const parts: any[] = [];
      
      if (msg.attachment) {
        const { type, base64, name, content } = msg.attachment;
        const mimeTypeLower = (type || '').toLowerCase();
        
        // Check if we can process it natively as inlineData
        const canUseInlineData = mimeTypeLower.startsWith('image/') || 
                                 mimeTypeLower === 'application/pdf' || 
                                 mimeTypeLower.startsWith('video/') ||
                                 mimeTypeLower.startsWith('audio/');
        
        if (canUseInlineData && base64) {
          parts.push({
            inlineData: {
              mimeType: type,
              data: base64
            }
          });
        } else if (content) {
          // Plain-text fallback for texts / js / css etc.
          parts.push({
            text: `[Attached File: ${name}]\nContent:\n${content}`
          });
        } else {
          // If binary metadata only (e.g. ZIP with no base64, or other unsupported types)
          parts.push({
            text: `[Attached File: ${name}, MIME Type: ${type}]`
          });
        }
      }
      
      parts.push({ text: msg.content });
      
      return {
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: parts
      };
    });

    // Call Gemini using the recommended SDK format (generateContent)
    const response = await ai.models.generateContent({
      model: activeModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The markdown-formatted conversational chatbot reply. Sound natural and humble.'
            },
            recalledMemoryIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'The IDs of existing memories that were actively used to customize this reply.'
            },
            newMemories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING, description: 'Newly taught fact in third person (e.g. "User has a golden retriever dog").' },
                  category: {
                    type: Type.STRING,
                    enum: ['personal', 'preference', 'career', 'interest', 'other'],
                    description: 'The classification of this memory.'
                  },
                  sourceContext: { type: Type.STRING, description: 'The specific user quote or statement prompting this extraction.' }
                },
                required: ['fact', 'category', 'sourceContext']
              },
              description: 'Any newly discovered facts about the user from their latest message.'
            },
            outdatedMemoryIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Any existing memory IDs that are outdated or replaced by the user\'s message.'
            }
          },
          required: ['reply', 'recalledMemoryIds', 'newMemories', 'outdatedMemoryIds']
        }
      }
    });

    const resultText = response.text || '{}';
    const parsedResult = JSON.parse(resultText);

    res.json(parsedResult);
  } catch (error: any) {
    const errString = error.message || (typeof error === 'object' ? JSON.stringify(error) : '');
    const isSpendLimit = errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('spending cap') || errString.includes('limit') || errString.includes('quota') || errString.includes('exhausted');
    
    if (isSpendLimit) {
      console.warn(`[Aura Registry Warning] Monthly spending/quota budget cap reached on Gemini. Safely activating local backup context engine.`);
    } else {
      console.error('Error handling chat API:', error);
    }
    
    if (isSpendLimit || true) { // Default fallback on general errors for high robustness
      const lastUserMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
      const fallbackResult = fallbackOfflineResponse(lastUserMessage, memories, errString);
      return res.json(fallbackResult);
    }
    
    res.status(500).json({ error: error.message || 'An error occurred during chat generation' });
  }
});

// Hot Reset API or memory generation simulation if needed
app.post('/api/memories/suggest', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const systemInstruction = `Analyze the conversation history and extract an array of user preferences, traits, or memories that could be saved.
Return a list of memories, each containing:
1. fact (third person string)
2. category (personal, preference, career, interest, or other)
3. sourceContext (the user quote)

Return strictly JSON matching the responseSchema.`;

    const formattedContents = messages.map(msg => {
      const parts: any[] = [];
      
      if (msg.attachment) {
        const { type, base64, name, content } = msg.attachment;
        const mimeTypeLower = (type || '').toLowerCase();
        
        // Check if we can process it natively as inlineData
        const canUseInlineData = mimeTypeLower.startsWith('image/') || 
                                 mimeTypeLower === 'application/pdf' || 
                                 mimeTypeLower.startsWith('video/') ||
                                 mimeTypeLower.startsWith('audio/');
        
        if (canUseInlineData && base64) {
          parts.push({
            inlineData: {
              mimeType: type,
              data: base64
            }
          });
        } else if (content) {
          // Plain-text fallback for texts / js / css etc.
          parts.push({
            text: `[Attached File: ${name}]\nContent:\n${content}`
          });
        } else {
          parts.push({
            text: `[Attached File: ${name}, MIME Type: ${type}]`
          });
        }
      }
      
      parts.push({ text: msg.content });
      
      return {
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: parts
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extracted: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['personal', 'preference', 'career', 'interest', 'other'] },
                  sourceContext: { type: Type.STRING }
                },
                required: ['fact', 'category', 'sourceContext']
              }
            }
          },
          required: ['extracted']
        }
      }
    });

    const parsedResult = JSON.parse(response.text || '{"extracted":[]}');
    res.json(parsedResult);
  } catch (error: any) {
    const errString = error.message || (typeof error === 'object' ? JSON.stringify(error) : '');
    const isSpendLimit = errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED') || errString.includes('spending cap') || errString.includes('limit') || errString.includes('quota') || errString.includes('exhausted');
    
    if (isSpendLimit) {
      console.warn(`[Aura Registry Warning] Monthly spending/quota budget cap reached on Gemini during trait extraction. Gracefully skipping.`);
    } else {
      console.error('Error extracting memories:', error);
    }
    // Graceful fallback to empty suggest list on error
    res.json({ extracted: [] });
  }
});

// Vite Integration & Static Files Serving
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // In production, serve built high-fidelity assets
  app.use(express.static(path.join(process.cwd(), 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Apple liquid glass server active on port ${PORT}`);
});
