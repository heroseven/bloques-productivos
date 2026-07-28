import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Circle,
} from "lucide-react";
import { GameSettings } from "../types";
import Modal from "./Modal";
import { playPhrase } from "../utils/voice";

const BACKGROUND_SOUNDS: Record<string, string> = {
  rain: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
  waves: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg",
  forest: "https://actions.google.com/sounds/v1/nature/forest_birds_and_insects.ogg",
};

interface GameProps {
  settings: GameSettings;
  onFinish: (results: boolean[], strike: number, actualSeconds: number) => void;
  onAbandon: (actualSeconds: number, results: boolean[], strike: number) => void;
  motivation: string;
  isCompact?: boolean;
}

export default function Game({ settings, onFinish, onAbandon, motivation, isCompact }: GameProps) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(settings.duration * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [results, setResults] = useState<boolean[]>(
    Array(settings.blocksCount).fill(false),
  );
  const [showModal, setShowModal] = useState(false);
  const [currentStrike, setCurrentStrike] = useState(0);
  const [maxStrike, setMaxStrike] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [actualSeconds, setActualSeconds] = useState(0);
  const actualSecondsRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActualSeconds(prev => {
        const next = prev + 1;
        actualSecondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const playStartSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = "sine";
      osc2.type = "triangle";
      
      // A somewhat mysterious/elegant start chord
      osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 3);
      osc2.stop(ctx.currentTime + 3);
    } catch (e) {
      console.error("AudioContext not supported", e);
    }
  };

  const playCompletionSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.error("AudioContext not supported", e);
    }
  };

  const [randomTriggers, setRandomTriggers] = useState<number[]>([]);

  // Calculate random triggers when block starts
  useEffect(() => {
    if (settings.voiceSettings.enabled && settings.voiceSettings.frequencyType === 'random') {
      const times = settings.voiceSettings.randomTimes;
      const totalSeconds = settings.duration * 60;
      const triggers: number[] = [];
      const segment = totalSeconds / times;
      for (let i = 0; i < times; i++) {
        const triggerSec = Math.floor((i * segment) + Math.random() * segment);
        triggers.push(totalSeconds - triggerSec);
      }
      setRandomTriggers(triggers);
    }
  }, [currentBlock, settings.duration, settings.voiceSettings]);

  const getBlockStartPhrase = (blockIndex: number, totalBlocks: number, defaultStartPhrase: string) => {
    if (blockIndex === 0) {
      return defaultStartPhrase;
    }
    if (blockIndex === totalBlocks - 1) {
      return "Iniciando el último bloque de la serie, ¡vamos con todo!";
    }
    
    const ordinals = ["primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo"];
    const ordinal = blockIndex < ordinals.length ? ordinals[blockIndex] : `bloque número ${blockIndex + 1}`;
    
    return `Iniciando el ${ordinal} bloque, sigue así.`;
  };

  const hasStartedBlockRef = useRef<number>(-1);

  // Block Start Logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isRunning && timeRemaining === settings.duration * 60) {
      if (hasStartedBlockRef.current !== currentBlock) {
        hasStartedBlockRef.current = currentBlock;
        if (settings.startSoundEnabled) {
          playStartSound();
        }
        if (settings.voiceSettings.enabled) {
          const phrase = getBlockStartPhrase(currentBlock, settings.blocksCount, settings.voiceSettings.startPhrase);
          if (phrase.trim() !== "") {
            timeout = setTimeout(() => {
              playPhrase(phrase, settings.voiceSettings.voiceType);
            }, 1000);
          }
        }
      }
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isRunning, timeRemaining, currentBlock, settings.duration, settings.blocksCount, settings.voiceSettings]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let endTimeout: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1;
          
          // Voice logic
          if (settings.voiceSettings.enabled && settings.voiceSettings.phrases.length > 0) {
            const validPhrases = settings.voiceSettings.phrases.filter(p => p.trim() !== '');
            if (validPhrases.length > 0) {
              if (settings.voiceSettings.frequencyType === 'random') {
                if (randomTriggers.includes(next)) {
                  const phrase = validPhrases[Math.floor(Math.random() * validPhrases.length)];
                  playPhrase(phrase, settings.voiceSettings.voiceType);
                }
              } else if (settings.voiceSettings.frequencyType === 'interval') {
                const elapsed = (settings.duration * 60) - next;
                if (elapsed > 0 && elapsed % settings.voiceSettings.intervalSeconds === 0) {
                  const phrase = validPhrases[Math.floor(Math.random() * validPhrases.length)];
                  playPhrase(phrase, settings.voiceSettings.voiceType);
                }
              }
            }
          }
          
          return next;
        });
      }, 1000);
    } else if (isRunning && timeRemaining === 0) {
      setIsRunning(false);
      setShowModal(true);
      playCompletionSound();
      
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const notif = new Notification("¡Tiempo Terminado!", {
            body: "Tu bloque de enfoque ha terminado. Vuelve a la app para confirmar si cumpliste tu objetivo.",
            requireInteraction: true,
          });
          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (e) {
          console.error("Notification error:", e);
        }
      }

      if (settings.voiceSettings.enabled && settings.voiceSettings.endPhrase?.trim() !== "") {
        endTimeout = setTimeout(() => {
          playPhrase(settings.voiceSettings.endPhrase, settings.voiceSettings.voiceType);
        }, 1000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
      if (endTimeout) clearTimeout(endTimeout);
    };
  }, [isRunning, timeRemaining, randomTriggers, settings]);

  // Idle reminder logic
  useEffect(() => {
    let idleInterval: NodeJS.Timeout;
    const isBetweenBlocks = !isRunning && (timeRemaining === 0 || (timeRemaining === settings.duration * 60 && currentBlock > 0));
    
    if (isBetweenBlocks && settings.voiceSettings.enabled && settings.voiceSettings.idlePhrase?.trim() !== "") {
      idleInterval = setInterval(() => {
        playPhrase(settings.voiceSettings.idlePhrase, settings.voiceSettings.voiceType);
      }, 60000); // Every 60 seconds
    }
    
    return () => clearInterval(idleInterval);
  }, [isRunning, timeRemaining, currentBlock, settings]);

  // Background audio control
  useEffect(() => {
    if (audioRef.current) {
      if (isRunning && settings.backgroundSound !== "none") {
        audioRef.current.play().catch((e) => console.error("Audio play failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRunning, settings.backgroundSound]);

  const handleBlockComplete = (success: boolean) => {
    setShowModal(false);

    const newResults = [...results];
    newResults[currentBlock] = success;
    setResults(newResults);

    const newStrike = success ? currentStrike + 1 : 0;
    setCurrentStrike(newStrike);
    setMaxStrike(Math.max(maxStrike, newStrike));

    if (currentBlock + 1 < settings.blocksCount) {
      setCurrentBlock(currentBlock + 1);
      setTimeRemaining(settings.duration * 60);
      setIsRunning(true); // Auto-start next block
    } else {
      onFinish(newResults, Math.max(maxStrike, newStrike), actualSecondsRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (currentBlock / settings.blocksCount) * 100;

  if (isCompact) {
    return (
      <>
        {settings.backgroundSound !== "none" && (
          <audio
            ref={audioRef}
            src={BACKGROUND_SOUNDS[settings.backgroundSound]}
            loop
            className="hidden"
          />
        )}
        <div className="w-full flex items-center justify-between gap-4">

        
        {showModal ? (
          <div className={`w-full flex items-center justify-between gap-2 rounded-xl px-2 py-1 ${settings.alertVisualEnabled ? 'animate-pulse bg-rose-100 dark:bg-rose-900/60 border border-rose-500/50' : ''}`}>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate pr-2">¿Cumpliste?</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleBlockComplete(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1 transition-transform hover:scale-105 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Sí
              </button>
              <button
                onClick={() => handleBlockComplete(false)}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1 transition-transform hover:scale-105 shadow-sm"
              >
                <XCircle className="w-4 h-4" /> No
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums leading-none">
                {formatTime(timeRemaining)}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    isRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                  title={isRunning ? "Pausar" : "Reanudar"}
                >
                  {isRunning ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => onAbandon(actualSecondsRef.current, results, currentStrike)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
                  title="Abandonar Serie"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline-block">
                {currentBlock + 1}/{settings.blocksCount}
              </span>
              <div className="flex gap-1 shrink-0">
                {results.map((_, idx) => (
                   <div key={idx} className={`w-2 h-2 rounded-full ${idx < currentBlock ? (results[idx] ? 'bg-emerald-500' : 'bg-rose-500') : idx === currentBlock ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                ))}
              </div>
            </div>
          </>
        )}
        <Modal 
          isOpen={showModal} 
          onComplete={handleBlockComplete} 
          isCompact={true} 
          alertSoundEnabled={settings.alertSoundEnabled}
          alertVisualEnabled={settings.alertVisualEnabled}
        />
      </div>
      </>
    );
  }

  return (
    <>
      {settings.backgroundSound !== "none" && (
        <audio
          ref={audioRef}
          src={BACKGROUND_SOUNDS[settings.backgroundSound]}
          loop
          className="hidden"
        />
      )}
      <div className="w-full min-w-0 min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-4 flex items-center justify-center">
      <div className="w-full min-w-0 max-w-3xl min-h-[320px] h-full flex-1 max-h-[800px] bg-white dark:bg-slate-800 rounded-[2rem] p-4 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center gap-4 sm:gap-8 [@media(max-height:400px)]:gap-2 relative overflow-y-auto">
        
        {/* Header & Progress - Hidden on short screens */}
        <div className="w-full space-y-6 [@media(max-height:500px)]:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
              Serie en progreso
            </h2>
            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full whitespace-nowrap">
              Bloque {currentBlock + 1} de {settings.blocksCount}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Planeado: {settings.duration * settings.blocksCount}:00
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Real: {formatTime(actualSeconds)}
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Circles - Always visible but compact */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {Array.from({ length: settings.blocksCount }).map((_, idx) => {
            const isPast = idx < currentBlock;
            const isCurrent = idx === currentBlock;
            const success = results[idx];

            if (isPast) {
              return success ? (
                <CheckCircle key={idx} className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
              ) : (
                <XCircle key={idx} className="w-6 h-6 sm:w-8 sm:h-8 text-rose-500" />
              );
            }
            if (isCurrent) {
              return (
                <Circle
                  key={idx}
                  className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500 animate-pulse"
                />
              );
            }
            return <Circle key={idx} className="w-6 h-6 sm:w-8 sm:h-8 text-slate-200 dark:text-slate-700" />;
          })}
        </div>

        {/* Timer Display */}
        <div className="relative flex flex-col items-center justify-center w-full flex-1 min-h-0 min-w-0">
          <div className="text-[clamp(3rem,15vw,8rem)] sm:text-[clamp(4rem,18vw,8rem)] font-mono font-bold text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums leading-none text-center w-full break-normal overflow-hidden overflow-ellipsis">
            {formatTime(timeRemaining)}
          </div>
          {motivation && (
            <div className="mt-4 px-4 sm:px-6 py-3 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30 w-full max-w-lg text-center mx-auto overflow-hidden">
              <p className="text-indigo-900/80 dark:text-indigo-100/80 font-medium text-xs sm:text-sm md:text-base break-words">
                "{motivation}"
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30"
            }`}
          >
            {isRunning ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1 sm:ml-2" />
            )}
          </button>

          <button
            onClick={() => onAbandon(actualSecondsRef.current, results, currentStrike)}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors"
            title="Abandonar Serie"
          >
            <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
          </button>
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onComplete={handleBlockComplete} 
        alertSoundEnabled={settings.alertSoundEnabled}
        alertVisualEnabled={settings.alertVisualEnabled}
      />
    </div>
    </>
  );
}
