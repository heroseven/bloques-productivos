import React, { useState, useEffect } from "react";
import {
  Play,
  Activity,
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  List,
  AlertTriangle,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Stats, GameSettings, Template, VoiceSettings } from "../types";
import { TEMPLATES } from "../constants";
import { playPhrase } from "../utils/voice";

interface DashboardProps {
  stats: Stats;
  onStartGame: (settings: GameSettings) => void;
  bedtime: string;
  onBedtimeChange: (time: string) => void;
}

export default function Dashboard({ stats, onStartGame, bedtime, onBedtimeChange }: DashboardProps) {
  const [duration, setDuration] = useState<number>(3);
  const [blocksCount, setBlocksCount] = useState<number>(3);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [backgroundSound, setBackgroundSound] = useState<string>("none");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem("focusblocks_voice_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing voice settings", e);
      }
    }
    return {
      enabled: true,
      startPhrase: "¡Comenzó el juego!",
      endPhrase: "Bloque terminado, prepárate para el siguiente.",
      idlePhrase: "El reto de enfoque continúa, inicia el siguiente bloque.",
      phrases: [
        "estoy contigo",
        "recuerda por qué lo haces",
        "se trata de fluir",
        "suelta y relájate"
      ],
      voiceType: 'female1',
      frequencyType: 'interval',
      intervalSeconds: 30,
      randomTimes: 5
    };
  });

  useEffect(() => {
    localStorage.setItem("focusblocks_voice_settings", JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    if (templateId !== "custom") {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setDuration(template.duration);
        setBlocksCount(template.blocksCount);
      }
    }
  };

  const handleStart = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    onStartGame({ duration, blocksCount, backgroundSound, voiceSettings });
  };

  const successRate =
    stats.totalBlocks > 0
      ? Math.round((stats.completedBlocks / stats.totalBlocks) * 100)
      : 0;

  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
      
      const blocksOnDay = stats.history.reduce((acc, game) => {
        const gameDate = new Date(game.date);
        if (
          gameDate.getDate() === d.getDate() &&
          gameDate.getMonth() === d.getMonth() &&
          gameDate.getFullYear() === d.getFullYear()
        ) {
          return acc + game.completedBlocks;
        }
        return acc;
      }, 0);

      const gamesOnDay = stats.history.reduce((acc, game) => {
        const gameDate = new Date(game.date);
        if (
          gameDate.getDate() === d.getDate() &&
          gameDate.getMonth() === d.getMonth() &&
          gameDate.getFullYear() === d.getFullYear()
        ) {
          return acc + 1;
        }
        return acc;
      }, 0);

      data.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        bloques: blocksOnDay,
        juegos: gamesOnDay,
      });
    }
    return data;
  };

  const getWeeklyTrend = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentWeekBlocks = 0;
    let previousWeekBlocks = 0;

    stats.history.forEach(game => {
      const gameDate = new Date(game.date);
      gameDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - gameDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 6) {
        currentWeekBlocks += game.completedBlocks;
      } else if (diffDays >= 7 && diffDays <= 13) {
        previousWeekBlocks += game.completedBlocks;
      }
    });

    if (previousWeekBlocks === 0) {
      if (currentWeekBlocks === 0) return { percentage: 0, trend: 'neutral' };
      return { percentage: 100, trend: 'up' };
    }

    const percentage = Math.round(((currentWeekBlocks - previousWeekBlocks) / previousWeekBlocks) * 100);
    
    if (percentage > 0) return { percentage, trend: 'up' };
    if (percentage < 0) return { percentage: Math.abs(percentage), trend: 'down' };
    return { percentage: 0, trend: 'neutral' };
  };

  const weeklyData = getWeeklyData();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
          FocusBlocks
        </h1>
        <p className="text-slate-500 text-lg">
          Juego de productividad por bloques de tiempo
        </p>
      </header>

      {/* Weekly Evolution Chart */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            Evolución de la Semana
          </h2>
          {(() => {
            const { percentage, trend } = getWeeklyTrend();
            if (trend === 'neutral' && percentage === 0) return null;
            
            return (
              <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
                trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
                trend === 'down' ? 'bg-rose-50 text-rose-600' :
                'bg-slate-50 text-slate-600'
              }`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                 trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                 <Minus className="w-4 h-4" />}
                <span>{trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{percentage}%</span>
                <span className="text-xs opacity-75 ml-1 font-normal">vs sem. anterior</span>
              </div>
            );
          })()}
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                allowDecimals={false} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }}
                dx={-10}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="bloques" name="Bloques" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="juegos" name="Juegos" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Game Setup */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
            <Play className="w-6 h-6 text-indigo-500" />
            Nueva Serie
          </h2>
        </div>

        {/* Quick Start Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <button
            onClick={handleStart}
            className="md:w-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl px-8 py-4 transition-colors flex items-center justify-center gap-2 text-lg shadow-md hover:shadow-lg"
          >
            <Play className="w-5 h-5 fill-current" />
            Iniciar Serie
          </button>
        </div>

        {/* Advanced Config Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-slate-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 transition-colors text-sm w-full mt-4 py-2"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? "Ocultar configuración avanzada" : "Mostrar configuración avanzada"}
        </button>

        {/* Advanced Config Content */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Duración por bloque
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setSelectedTemplate("custom");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 3, 5, 10, 15, 20, 25].map((min) => (
                    <option key={min} value={min}>
                      {min} minuto{min !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Cantidad de bloques
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={blocksCount}
                  onChange={(e) => {
                    setBlocksCount(Number(e.target.value));
                    setSelectedTemplate("custom");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Sonido de fondo
                </label>
                <select
                  value={backgroundSound}
                  onChange={(e) => setBackgroundSound(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Sin sonido</option>
                  <option value="rain">Lluvia relajante</option>
                  <option value="waves">Olas del mar</option>
                  <option value="forest">Bosque</option>
                </select>
              </div>
            </div>

            {/* Voice Settings Section */}
            <div className="mb-2 border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Voz Motivacional</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={voiceSettings.enabled}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, enabled: e.target.checked })}
                    />
                    <div
                      className={`block w-14 h-8 rounded-full transition-colors ${
                        voiceSettings.enabled ? "bg-indigo-500" : "bg-slate-300"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                        voiceSettings.enabled ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="text-slate-700 font-medium">
                    {voiceSettings.enabled ? "Activada" : "Desactivada"}
                  </span>
                </label>
              </div>

              {voiceSettings.enabled && (
                <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Frase de inicio de bloque</label>
                      <input
                        type="text"
                        value={voiceSettings.startPhrase}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, startPhrase: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: ¡Comenzó el juego!"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Frase de fin de bloque</label>
                      <input
                        type="text"
                        value={voiceSettings.endPhrase || "Bloque terminado, prepárate para el siguiente."}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, endPhrase: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Bloque terminado"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Recordatorio entre bloques (cada min)</label>
                      <input
                        type="text"
                        value={voiceSettings.idlePhrase || "El reto de enfoque continúa, inicia el siguiente bloque."}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, idlePhrase: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: El reto continúa"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Tipo de Voz</label>
                      <select
                        value={voiceSettings.voiceType}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, voiceType: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="female1">Mujer 1 (Natural/Suave)</option>
                        <option value="female2">Mujer 2 (Aguda/Dinámica)</option>
                        <option value="female3">Mujer 3 (Grave/Serena)</option>
                        <option value="male1">Hombre 1 (Natural/Claro)</option>
                        <option value="male2">Hombre 2 (Profundo/Calmado)</option>
                        <option value="male3">Hombre 3 (Agudo/Enérgico)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Frecuencia</label>
                      <select
                        value={voiceSettings.frequencyType}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, frequencyType: e.target.value as 'interval' | 'random' })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="interval">Intervalo regular</option>
                        <option value="random">Aleatorio por bloque</option>
                      </select>
                    </div>

                    {voiceSettings.frequencyType === 'interval' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Cada cuánto tiempo</label>
                        <select
                          value={voiceSettings.intervalSeconds}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, intervalSeconds: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={30}>Cada 30 segundos</option>
                          <option value={45}>Cada 45 segundos</option>
                          <option value={60}>Cada 1 minuto</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">Veces por bloque</label>
                        <select
                          value={voiceSettings.randomTimes}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, randomTimes: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={3}>3 veces</option>
                          <option value={5}>5 veces</option>
                          <option value={10}>10 veces</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium text-slate-600">Frases (una por línea)</label>
                    <textarea
                      value={voiceSettings.phrases.join('\n')}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, phrases: e.target.value.split('\n') })}
                      className="w-full flex-1 min-h-[120px] bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Escribe una frase por línea..."
                    />
                    <button
                      onClick={() => {
                        const validPhrases = voiceSettings.phrases.filter(p => p.trim() !== '');
                        if (validPhrases.length > 0) {
                          const randomPhrase = validPhrases[Math.floor(Math.random() * validPhrases.length)];
                          playPhrase(randomPhrase, voiceSettings.voiceType);
                        }
                      }}
                      className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Probar Voz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<Activity className="text-blue-500" />}
          title="Juegos"
          value={stats.totalGames}
        />
        <StatCard
          icon={<CheckCircle className="text-emerald-500" />}
          title="Cumplidos"
          value={stats.completedBlocks}
        />
        <StatCard
          icon={<XCircle className="text-rose-500" />}
          title="Fallados"
          value={stats.failedBlocks}
        />
        <StatCard
          icon={<AlertTriangle className="text-orange-500" />}
          title="Inconclusos"
          value={stats.abandonedGames || 0}
        />
        <StatCard
          icon={<Trophy className="text-amber-500" />}
          title="Mejor Strike"
          value={stats.bestStrike}
        />
        <div className="col-span-2 md:col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <span className="text-slate-600 font-medium">Promedio de Éxito</span>
          <span className="text-2xl font-bold text-slate-800">
            {successRate}%
          </span>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-500" />
          Configuración General
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-md">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Hora de dormir
            </label>
            <p className="text-xs text-slate-500">
              Te avisaremos cuando sea hora de descansar.
            </p>
          </div>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => onBedtimeChange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* History */}
      {stats.history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <List className="w-5 h-5 text-slate-500" />
            Historial Reciente
          </h3>
          <div className="space-y-3">
            {stats.history.slice(0, 10).map((game) => {
              const plannedSeconds = game.durationPerBlock * game.totalBlocks * 60;
              const actualSeconds = game.actualSeconds || plannedSeconds;
              const diffSeconds = actualSeconds - plannedSeconds;
              const diffMinutes = Math.floor(Math.abs(diffSeconds) / 60);
              const diffStr = diffSeconds > 0 ? `+${diffMinutes}m` : diffSeconds < 0 ? `-${diffMinutes}m` : 'Exacto';
              
              return (
                <div
                  key={game.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    game.status === 'abandoned' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-500">
                        {new Date(game.date).toLocaleDateString()}
                      </div>
                      {game.status === 'abandoned' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          Inconcluso
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-slate-800">
                      {game.durationPerBlock}m x {game.totalBlocks} bloques
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded-lg" title="Tiempo Real vs Planeado">
                      <Clock className="w-4 h-4" /> 
                      {Math.floor(actualSeconds / 60)}m ({diffStr})
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-4 h-4" /> {game.completedBlocks}/{game.totalBlocks}
                    </div>
                    <div className="flex items-center gap-1 text-amber-600 font-medium">
                      <Trophy className="w-4 h-4" /> Strike: {game.strike}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-2">
      <div className="p-3 bg-slate-50 rounded-full">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </div>
      </div>
    </div>
  );
}
