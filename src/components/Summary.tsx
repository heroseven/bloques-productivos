import React from "react";
import { CheckCircle, XCircle, Trophy, Home, RotateCcw, Clock } from "lucide-react";
import { GameSettings } from "../types";

interface SummaryProps {
  settings: GameSettings;
  results: boolean[];
  strike: number;
  actualSeconds: number;
  onHome: () => void;
  onRestart: () => void;
}

export default function Summary({
  settings,
  results,
  strike,
  actualSeconds,
  onHome,
  onRestart,
}: SummaryProps) {
  const completed = results.filter(Boolean).length;
  const failed = results.length - completed;
  const successRate = Math.round((completed / results.length) * 100);

  const plannedSeconds = settings.duration * settings.blocksCount * 60;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col justify-center">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-8">
        <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-indigo-500" />
        </div>

        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
          ¡Serie Terminada!
        </h1>

        <p className="text-lg text-slate-600">
          Has completado una serie de {settings.blocksCount} bloques de{" "}
          {settings.duration} minutos.
        </p>

        <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100">
          <div className="space-y-2">
            <div className="flex justify-center text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold text-slate-800">{completed}</div>
            <div className="text-xs font-medium text-slate-500 uppercase">
              Cumplidos
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center text-rose-500">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold text-slate-800">{failed}</div>
            <div className="text-xs font-medium text-slate-500 uppercase">
              Fallados
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center text-amber-500">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold text-slate-800">{strike}</div>
            <div className="text-xs font-medium text-slate-500 uppercase">
              Mejor Strike
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium text-lg">
              Tasa de Éxito
            </span>
            <span className="text-3xl font-bold text-indigo-600">
              {successRate}%
            </span>
          </div>
          
          <div className="h-px bg-slate-200 w-full"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-lg">
              <Clock className="w-5 h-5" />
              Tiempo Total
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-800">
                {formatTime(actualSeconds)}
              </div>
              <div className="text-sm text-slate-500">
                vs {formatTime(plannedSeconds)} planeado
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onHome}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-4 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Inicio
          </button>

          <button
            onClick={onRestart}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl py-4 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
          >
            <RotateCcw className="w-5 h-5" />
            Repetir Serie
          </button>
        </div>
      </div>
    </div>
  );
}
