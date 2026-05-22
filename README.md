
# Aura AI Chatbot

Aura AI Chatbot is a highly polished, privacy-conscious personal memory and dialogue assistant. Inspired by clean, responsive Apple-themed design principles, the application provides an intelligent, contextual chat experience with zero-friction cognitive memory extraction, real-time factual recall, and secure multi-tier synchronization.

---

## 🌌 The Problem It Solves

Standard conversational AI assistants suffer from **context amnesia**. Every new chat thread begins as a blank slate, requiring you to repeat your preferences, core lifestyle goals, career fields, dietary requirements, or workspace choices. 

This causes:
- **Cognitive fatigue** from repeating instructions across separate sessions.
- **Generic answers** that fail to respect your lifestyle context.
- **Insecure client data** where private configuration is mixed with open-ended chat prompts.

**Aura AI Chatbot** solves this by separating the conversational dialogue from your **Cognitive Memory Register**. It extracts key personal parameters seamlessly as you talk, matches them dynamically in real-time, and feeds them as a persistent context layer to the generative AI model without bloating your prompt history.

---

## 🛠️ How It Works

Aura operates through a modular four-tier architecture:

### 1. Seamless Memory Extraction & Management
As you converse, the underlying logic analyzes your messages. If you mention lifestyle factors ("I'm a researcher", "I avoid gluten", "I am studying French"), Aura detects, parses, and logs these facts into your **Context Memory Suite**. You have complete, transparent custody of this memory—you can view, toggle active states, or permanently delete facts at any time.

### 2. High-Context Recall Engine
Before sending your queries to the model, Aura performs a lightweight scan of your active memory registers. It automatically references relevant parameters to enrich the prompt context window. The model responds with highly personalized assistance tailored exactly to your lifestyle profile.

### 3. Dynamic Multi-Model Synchronization
Aura lets you select from a spectrum of logic engines to balance resource needs:
- **Aura Advanced Sync (Gemini 3.5 Flash)**: The default, deep-reasoning flagship engine that handles complex contextual threads and manages your cognitive memory state.
- **Aura Multi-Path 1.5 Pro (Gemini 1.5 Pro)**: Designed for deep creative writing, reasoning problems, and high-density long-form analysis.
- **Aura Compact 1.5 Lite (Gemini 1.5 Flash)**: An ultra-fast, lightweight model ideal for quick queries.

When completing onboarding or logging in with your secure secure Google Account, the system automatically upgrades and pins your session to the **Advanced Sync 3.5** framework!

### 4. Interactive Calibration Buffer (The Calibration Dino Game)
To make background Firestore syncing and credential calibration engaging, Aura features an optimized **Calibration Game**. Help the browser context dino run through calibration hurdles! The game physics have been optimized with responsive jump gravity and dynamic scaling speed to ensure a fluid 60FPS gaming experience.

---

## 🔒 Security & Privacy First

- **Data Custody**: Your memories belong exclusively to you. They are stored locally in your browser's persistent state and can be synchronized securely to your Google Firebase account.
- **Server API Proxying**: API keys (including `GEMINI_API_KEY`) and transaction paths are validated strictly server-side in `server.ts` to prevent client-side credential exposure.
- **Unified Name Matching**: The app features a verified, qualified domain holding our official Google Site Ownership codes, corresponding OAuth titles, and a dedicated native **Privacy Policy** to keep account connections transparent and secure.

---

## 🚀 Technical Architecture & Setup

### Requirements
- Node.js LTS (v18 or higher)
- Clean setup of Google Project & Firebase Config keys

### Local Installation
1. Clone your project workspace.
2. Install standard node modules:
   ```bash
   npm install
   ```
3. Set your environment parameters inside a local `.env` file matching `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the rapid development server:
   ```bash
   npm run dev
   ```

---

*Aura matches your context, aligns with your intent, and grows with your dialogue.*
