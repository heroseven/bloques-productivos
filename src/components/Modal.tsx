import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle } from "lucide-react";
import { INSPIRATIONAL_MESSAGES } from "../constants";

interface ModalProps {
  isOpen: boolean;
  onComplete: (success: boolean) => void;
}

export default function Modal({ isOpen, onComplete }: ModalProps) {
  const message = React.useMemo(() => {
    return INSPIRATIONAL_MESSAGES[
      Math.floor(Math.random() * INSPIRATIONAL_MESSAGES.length)
    ];
  }, [isOpen]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
          
          const playBeep = () => {
            if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
            try {
              const osc = audioCtxRef.current.createOscillator();
              const gain = audioCtxRef.current.createGain();
              osc.connect(gain);
              gain.connect(audioCtxRef.current.destination);
              
              osc.type = "square";
              osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime); // A5
              
              gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
              gain.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.05);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);
              
              osc.start(audioCtxRef.current.currentTime);
              osc.stop(audioCtxRef.current.currentTime + 0.5);
            } catch (e) {
              console.error("Error playing beep", e);
            }
          };

          // Play immediately and then loop
          playBeep();
          intervalRef.current = setInterval(playBeep, 1000);
        }
      } catch (e) {
        console.error("AudioContext not supported", e);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        audioCtxRef.current = null;
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[95vh] relative flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0" />

            <div className="text-center space-y-4 sm:space-y-6 my-auto">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2 sm:mb-6 shrink-0 hidden sm:flex [@media(min-height:500px)]:flex">
                <span className="text-3xl sm:text-4xl">✨</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                ¡Tiempo Terminado!
              </h2>

              <p className="text-base sm:text-lg text-slate-600 font-medium italic px-2 sm:px-4">
                "{message}"
              </p>

              <div className="pt-4 sm:pt-8 space-y-3 sm:space-y-4 shrink-0">
                <button
                  onClick={() => onComplete(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl py-3 sm:py-4 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  Sí, cumplí
                </button>

                <button
                  onClick={() => onComplete(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl py-3 sm:py-4 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  No, no cumplí
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
