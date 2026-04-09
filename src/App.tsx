/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import React, { useState, useRef, useEffect } from "react";
import { Upload, Play, Loader2, Sparkles, Camera, Film, Cigarette, Wind, Info, Users, Zap, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Initialize Gemini AI - We will re-initialize this inside generateVideo to ensure the latest key is used
let ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Type definitions for AI Studio environment
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface VideoGenerationState {
  status: 'idle' | 'uploading' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  progressMessage?: string;
}

const LOADING_MESSAGES = [
  "Capturing the essence of the smoke...",
  "Igniting the artistic vision...",
  "Exhaling digital dreams...",
  "Weaving the vapor into motion...",
  "Perfecting the cinematic flow...",
  "Almost there, the smoke is settling..."
];

export default function App() {
  const [state, setState] = useState<VideoGenerationState>({ status: 'idle' });
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [smokeTexture, setSmokeTexture] = useState<string>('Swirling & Tantric');
  const [smokeDensity, setSmokeDensity] = useState<string>('Moderate');
  const [lightingStyle, setLightingStyle] = useState<string>('Moody');
  const [modelStyle, setModelStyle] = useState<string>('Artistic Realism');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();

    if (state.status === 'generating') {
      let index = 0;
      loadingIntervalRef.current = setInterval(() => {
        index = (index + 1) % LOADING_MESSAGES.length;
        setCurrentLoadingMessage(LOADING_MESSAGES[index]);
      }, 5000);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [state.status]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setState({
        status: 'idle',
        imageUrl: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const generateVideo = async () => {
    if (!state.imageUrl) return;

    setState(prev => ({ ...prev, status: 'generating', error: undefined }));

    try {
      // Re-initialize GoogleGenAI right before the call to use the selected API key
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });

      // Veo video generation
      const prompt = `A high-end, cinematic artistic video of the woman in the photo. The model should have ${modelStyle.toLowerCase()} features, with a focus on realistic textures, expressive lips, and an elegant, sensual presence. She is exhaling a ${smokeDensity.toLowerCase()} amount of ${smokeTexture.toLowerCase()} smoke. The smoke should dance and swirl around her in a sophisticated, tantric way. ${lightingStyle} cinematic lighting, high contrast, artistic composition. The motion should be smooth and elegant. The smoke texture should be distinctly ${smokeTexture.toLowerCase()}.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio,
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.get({ name: operation.name } as any);
      }

      if (operation.response?.generatedVideos?.[0]?.video?.videoBytes) {
        const videoBytes = operation.response.generatedVideos[0].video.videoBytes;
        const videoUrl = `data:video/mp4;base64,${videoBytes}`;
        setState(prev => ({
          ...prev,
          status: 'completed',
          videoUrl: videoUrl
        }));
      } else {
        throw new Error("No video was generated in the response.");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      
      // Handle "Requested entity was not found" by resetting key state
      if (error?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }

      setState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : "An unexpected error occurred during generation."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-orange-500/30">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[150px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        {/* Instructions Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-4"
        >
          <Info className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-orange-400 mb-1 uppercase tracking-wider">How to use Smokin' Hit:</p>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Upload a high-quality artistic portrait.</li>
              <li>Select your desired smoke texture, density, and cinematic lighting.</li>
              <li>Customize the model's appearance for a more realistic and sensual finish.</li>
              <li>Click "Animate with Veo" and wait for the digital magic to unfold.</li>
            </ul>
          </div>
        </motion.div>

        {/* Header */}
        <header className="mb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-8">
              <Zap className="w-3 h-3 fill-current" />
              Premium AI Experience
            </div>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 leading-none uppercase">
              SMOKIN' <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 italic font-serif">HIT</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-xl font-light leading-relaxed">
              Where high-fashion photography meets cinematic motion. <br />
              <span className="text-orange-500/60 italic">The ultimate sanctuary for artistic vapor.</span>
            </p>
          </motion.div>
        </header>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Controls & Upload */}
          <section className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cigarette className="w-24 h-24 rotate-12" />
              </div>

              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 tracking-tight uppercase">
                <Camera className="w-6 h-6 text-orange-500" />
                The Source
              </h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-4
                  ${state.imageUrl ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'}
                `}
              >
                {state.imageUrl ? (
                  <>
                    <img 
                      src={state.imageUrl} 
                      alt="Uploaded preview" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                      referrerPolicy="no-referrer"
                    />
                    <div className="relative z-10 bg-black/40 backdrop-blur-md p-4 rounded-full border border-white/20">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="relative z-10 text-sm font-medium">Change Image</p>
                  </>
                ) : (
                  <>
                    <div className="p-6 rounded-full bg-white/5 border border-white/10">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Click to upload photo</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Aspect Ratio</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2
                      ${aspectRatio === '16:9' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 hover:border-white/20'}
                    `}
                  >
                    <Film className="w-4 h-4" />
                    16:9 Landscape
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center gap-2
                      ${aspectRatio === '9:16' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 hover:border-white/20'}
                    `}
                  >
                    <div className="w-3 h-4 border-2 border-current rounded-sm" />
                    9:16 Portrait
                  </button>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Smoke Texture</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Wispy & Ethereal', 'Thick & Voluminous', 'Swirling & Tantric', 'Misty & Atmospheric'].map((texture) => (
                    <button
                      key={texture}
                      onClick={() => setSmokeTexture(texture)}
                      className={`py-2 px-3 rounded-xl border text-xs transition-all
                        ${smokeTexture === texture ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 hover:border-white/20'}
                      `}
                    >
                      {texture}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Smoke Density</label>
                <div className="flex gap-3">
                  {['Subtle', 'Moderate', 'Heavy'].map((density) => (
                    <button
                      key={density}
                      onClick={() => setSmokeDensity(density)}
                      className={`flex-1 py-2 rounded-xl border text-xs transition-all
                        ${smokeDensity === density ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 hover:border-white/20'}
                      `}
                    >
                      {density}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Cinematic Lighting</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Moody', 'Dramatic', 'Soft', 'Neon', 'Golden Hour', 'Noir'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setLightingStyle(style)}
                      className={`py-2.5 px-2 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider
                        ${lightingStyle === style ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 hover:border-white/20 bg-white/[0.02]'}
                      `}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Model Customization</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Realistic', label: 'Hyper-Realistic' },
                    { id: 'Sensual', label: 'High Sensuality' },
                    { id: 'Curvaceous', label: 'Pronounced Curves' },
                    { id: 'Full Lips', label: 'Fuller Lips' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setModelStyle(style.label)}
                      className={`py-3 px-3 rounded-xl border text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2
                        ${modelStyle === style.label ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/5 hover:border-white/20 bg-white/[0.02]'}
                      `}
                    >
                      <Heart className={`w-3 h-3 ${modelStyle === style.label ? 'fill-current' : ''}`} />
                      {style.id}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!state.imageUrl || state.status === 'generating'}
                onClick={!hasApiKey ? handleSelectKey : generateVideo}
                className={`w-full mt-10 py-5 rounded-2xl font-black text-xl uppercase tracking-widest flex items-center justify-center gap-4 transition-all
                  ${!state.imageUrl || state.status === 'generating' 
                    ? 'bg-gray-900 text-gray-700 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-400 text-black shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-[0.98]'}
                `}
              >
                {!hasApiKey ? (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Setup Paid API Key
                  </>
                ) : state.status === 'generating' ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" />
                    Animate with Veo
                  </>
                )}
              </button>

              {!hasApiKey && (
                <p className="mt-4 text-xs text-center text-gray-500">
                  Veo requires a paid Google Cloud project. 
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:underline ml-1"
                  >
                    Learn about billing
                  </a>
                </p>
              )}
            </div>

            {state.error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {state.error}
              </motion.div>
            )}
          </section>

          {/* Right: Output/Preview */}
          <section className="lg:col-span-7 sticky top-12">
            <div className="relative aspect-[16/9] w-full rounded-[2.5rem] border border-white/10 bg-black overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
              
              <AnimatePresence mode="wait">
                {state.status === 'generating' ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-20"
                  >
                    <div className="relative mb-10">
                      <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full animate-pulse" />
                      <Wind className="w-20 h-20 text-orange-500 animate-bounce relative z-10" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Sculpting the Smoke</h3>
                    <p className="text-orange-400 font-serif italic text-xl h-8 opacity-80">
                      {currentLoadingMessage}
                    </p>
                    <div className="mt-16 w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                ) : state.videoUrl ? (
                  <motion.div 
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-0"
                  >
                    <video 
                      src={state.videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 z-20"
                  >
                    <Cigarette className="w-20 h-20 mb-6 opacity-10" />
                    <p className="font-bold uppercase tracking-[0.3em] text-xs">Awaiting Artistic Input</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-10 p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-6">Artistic Direction</h4>
              <p className="text-lg text-gray-300 leading-relaxed font-light italic">
                "The model features <span className="text-orange-400 font-medium">{modelStyle.toLowerCase()}</span> characteristics. 
                The smoke is <span className="text-orange-400 font-medium">{smokeDensity.toLowerCase()}</span> and <span className="text-orange-400 font-medium">{smokeTexture.toLowerCase()}</span>, 
                dancing in a <span className="text-orange-400 font-medium">{lightingStyle.toLowerCase()}</span> cinematic environment."
              </p>
            </div>

            {/* Community Invitation */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 p-8 rounded-[2rem] bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-orange-500 text-black">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold uppercase tracking-tight">Join the Collective</h4>
                  <p className="text-sm text-gray-400">Connect with fellow artists and share your creations.</p>
                </div>
              </div>
              <button className="px-8 py-3 rounded-xl bg-white text-black font-bold uppercase text-xs tracking-widest hover:bg-orange-500 transition-colors">
                Visit our Website
              </button>
            </motion.div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 pb-12 text-center border-t border-white/5 pt-12">
        <p className="text-gray-600 text-sm font-light tracking-widest uppercase">
          Artistic Expression • Powered by Veo 3.1 Fast
        </p>
      </footer>
    </div>
  );
}

