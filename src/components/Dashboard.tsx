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
  ChevronLeft,
  ChevronRight,
  Calendar,
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
import { Stats, GameSettings, Template, VoiceSettings, ReminderSettings } from "../types";
import { TEMPLATES } from "../constants";
import { playPhrase } from "../utils/voice";

interface DashboardProps {
  stats: Stats;
  onStartGame: (settings: GameSettings) => void;
  bedtime: string;
  onBedtimeChange: (time: string) => void;
  workdayEnd: string;
  onWorkdayEndChange: (time: string) => void;
  lunchTime: string;
  onLunchTimeChange: (time: string) => void;
  motivation: string;
  onMotivationChange: (text: string) => void;
  reminderSettings: ReminderSettings;
  onReminderSettingsChange: (settings: ReminderSettings) => void;
  isCompact?: boolean;
}

export default function Dashboard({ 
  stats, onStartGame, bedtime, onBedtimeChange, 
  workdayEnd, onWorkdayEndChange, lunchTime, onLunchTimeChange, 
  motivation, onMotivationChange, reminderSettings, onReminderSettingsChange,
  isCompact
}: DashboardProps) {
  const [duration, setDuration] = useState<number>(3);
  const [blocksCount, setBlocksCount] = useState<number>(3);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("default");
  const [backgroundSound, setBackgroundSound] = useState<string>("none");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [chartView, setChartView] = useState<'week' | 'month'>('week');
  const [chartOffset, setChartOffset] = useState<number>(0);
  
  const [alertSoundEnabled, setAlertSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("focusblocks_alert_sound") !== "false"; // Default true
  });
  
  const [alertVisualEnabled, setAlertVisualEnabled] = useState<boolean>(() => {
    return localStorage.getItem("focusblocks_alert_visual") !== "false"; // Default true
  });

  const [startSoundEnabled, setStartSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem("focusblocks_start_sound") !== "false"; // Default true
  });

  useEffect(() => {
    localStorage.setItem("focusblocks_alert_sound", alertSoundEnabled.toString());
  }, [alertSoundEnabled]);

  useEffect(() => {
    localStorage.setItem("focusblocks_alert_visual", alertVisualEnabled.toString());
  }, [alertVisualEnabled]);

  useEffect(() => {
    localStorage.setItem("focusblocks_start_sound", startSoundEnabled.toString());
  }, [startSoundEnabled]);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem("focusblocks_voice_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.voiceType || !['es-ES-Journey-F', 'es-ES-Journey-D', 'es-PE-AlexNeural', 'es-PE-CamilaNeural', 'femaleSexy1', 'femaleSexy2', 'femaleSexy3', 'female1', 'female2', 'female3', 'male1', 'male2', 'male3'].includes(parsed.voiceType)) {
          parsed.voiceType = 'es-ES-Journey-F';
        }
        return parsed;
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
      voiceType: 'es-ES-Journey-F',
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
    onStartGame({ duration, blocksCount, backgroundSound, voiceSettings, alertSoundEnabled, alertVisualEnabled, startSoundEnabled });
  };

  const successRate =
    stats.totalBlocks > 0
      ? Math.round((stats.completedBlocks / stats.totalBlocks) * 100)
      : 0;

  const getChartData = () => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chartView === 'week') {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - (chartOffset * 7));
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(endDate);
        d.setDate(d.getDate() - i);
        
        const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
        const dateLabel = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        
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
          dateLabel,
          bloques: blocksOnDay,
          juegos: gamesOnDay,
        });
      }
    } else {
      const targetDate = new Date(today);
      targetDate.setMonth(targetDate.getMonth() - chartOffset);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        if (d > today && chartOffset === 0) break;
        
        const dateLabel = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
        
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
          name: i.toString(),
          dateLabel,
          bloques: blocksOnDay,
          juegos: gamesOnDay,
        });
      }
    }
    return data;
  };

  const getTrend = () => {
    let currentPeriodBlocks = 0;
    let previousPeriodBlocks = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chartView === 'week') {
      const currentEndDate = new Date(today);
      currentEndDate.setDate(currentEndDate.getDate() - (chartOffset * 7));
      const currentStartDate = new Date(currentEndDate);
      currentStartDate.setDate(currentStartDate.getDate() - 6);
      
      const prevEndDate = new Date(currentStartDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      const prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - 6);

      stats.history.forEach(game => {
        const gameDate = new Date(game.date);
        gameDate.setHours(0, 0, 0, 0);
        if (gameDate >= currentStartDate && gameDate <= currentEndDate) {
          currentPeriodBlocks += game.completedBlocks;
        } else if (gameDate >= prevStartDate && gameDate <= prevEndDate) {
          previousPeriodBlocks += game.completedBlocks;
        }
      });
    } else {
      const targetDate = new Date(today);
      targetDate.setMonth(targetDate.getMonth() - chartOffset);
      const currentMonth = targetDate.getMonth();
      const currentYear = targetDate.getFullYear();
      
      const prevDate = new Date(targetDate);
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.getMonth();
      const prevYear = prevDate.getFullYear();

      stats.history.forEach(game => {
        const gameDate = new Date(game.date);
        if (gameDate.getMonth() === currentMonth && gameDate.getFullYear() === currentYear) {
          currentPeriodBlocks += game.completedBlocks;
        } else if (gameDate.getMonth() === prevMonth && gameDate.getFullYear() === prevYear) {
          previousPeriodBlocks += game.completedBlocks;
        }
      });
    }

    if (previousPeriodBlocks === 0) {
      if (currentPeriodBlocks === 0) return { percentage: 0, trend: 'neutral' };
      return { percentage: 100, trend: 'up' };
    }

    const percentage = Math.round(((currentPeriodBlocks - previousPeriodBlocks) / previousPeriodBlocks) * 100);
    
    if (percentage > 0) return { percentage, trend: 'up' };
    if (percentage < 0) return { percentage: Math.abs(percentage), trend: 'down' };
    return { percentage: 0, trend: 'neutral' };
  };

  const chartData = getChartData();
  
  const getChartLabel = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (chartView === 'week') {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - (chartOffset * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      return `${startDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`;
    } else {
      const targetDate = new Date(today);
      targetDate.setMonth(targetDate.getMonth() - chartOffset);
      return targetDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());
    }
  };

  if (isCompact) {
    return (
      <div className="w-full flex items-center justify-center gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis hidden sm:block">
          FocusBlocks
        </h1>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-full pr-4 pl-1 py-1 shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            onClick={handleStart}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-indigo-500/30 shrink-0"
            title="Empezar Nueva Serie"
          >
            <Play className="w-4 h-4 ml-0.5 fill-current" />
          </button>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            {blocksCount} x {duration}m
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            FocusBlocks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Juego de productividad por bloques de tiempo
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={motivation}
            onChange={(e) => onMotivationChange(e.target.value)}
            placeholder="¿Cuál es tu motivación?"
            className="w-full text-center bg-transparent border-b-2 border-slate-200 dark:border-slate-600 hover:border-indigo-300 focus:border-indigo-500 px-4 py-2 text-slate-600 dark:text-slate-300 font-medium focus:outline-none transition-colors placeholder:text-slate-300"
          />
        </div>
      </header>

      {/* Evolution Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Evolución
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => { setChartView('week'); setChartOffset(0); }}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartView === 'week' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 dark:text-slate-200'}`}
              >
                Semana
              </button>
              <button
                onClick={() => { setChartView('month'); setChartOffset(0); }}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${chartView === 'month' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 dark:text-slate-200'}`}
              >
                Mes
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setChartOffset(prev => prev + 1)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-2 min-w-[120px] justify-center">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {getChartLabel()}
                </span>
              </div>
              <button 
                onClick={() => setChartOffset(prev => Math.max(0, prev - 1))}
                disabled={chartOffset === 0}
                className={`p-1 rounded-md transition-colors ${chartOffset === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const { percentage, trend } = getTrend();
              if (trend === 'neutral' && percentage === 0) return null;
              
              return (
                <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border border-transparent ${
                  trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 dark:border-emerald-800/30' :
                  trend === 'down' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 dark:border-rose-800/30' :
                  'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 dark:border-slate-700'
                }`}>
                  {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                   trend === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                   <Minus className="w-4 h-4" />}
                  <span>{trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{percentage}%</span>
                  <span className="text-xs opacity-75 ml-1 font-normal hidden sm:inline">vs ant.</span>
                </div>
              );
            })()}
          </div>
        </div>
        <div className="h-64 w-full relative">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.dateLabel;
                  }
                  return label;
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="bloques" name="Bloques" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="juegos" name="Juegos" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* New Game Setup */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
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
          className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium flex items-center justify-center gap-1 transition-colors text-sm w-full mt-4 py-2"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showAdvanced ? "Ocultar configuración avanzada" : "Mostrar configuración avanzada"}
        </button>

        {/* Advanced Config Content */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Duración por bloque
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    setSelectedTemplate("custom");
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 3, 5, 10, 15, 20, 25].map((min) => (
                    <option key={min} value={min}>
                      {min} minuto{min !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
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
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Sonido de fondo
                </label>
                <select
                  value={backgroundSound}
                  onChange={(e) => setBackgroundSound(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">Sin sonido</option>
                  <option value="rain">Lluvia relajante</option>
                  <option value="waves">Olas del mar</option>
                  <option value="forest">Bosque</option>
                </select>
              </div>
            </div>

            <div className="mb-8 border-t border-slate-100 dark:border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Alertas Visuales y Sonoras</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={startSoundEnabled}
                      onChange={(e) => setStartSoundEnabled(e.target.checked)}
                    />
                    <div
                      className={`block w-12 h-6 rounded-full transition-colors ${
                        startSoundEnabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        startSoundEnabled ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">Sonido de Inicio de Serie</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={alertSoundEnabled}
                      onChange={(e) => setAlertSoundEnabled(e.target.checked)}
                    />
                    <div
                      className={`block w-12 h-6 rounded-full transition-colors ${
                        alertSoundEnabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        alertSoundEnabled ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">Alerta de Fin (Beep)</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={alertVisualEnabled}
                      onChange={(e) => setAlertVisualEnabled(e.target.checked)}
                    />
                    <div
                      className={`block w-12 h-6 rounded-full transition-colors ${
                        alertVisualEnabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        alertVisualEnabled ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">Alerta de Fin (Parpadeo)</span>
                </label>
              </div>
            </div>

            {/* Voice Settings Section */}
            <div className="mb-2 border-t border-slate-100 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Voz Motivacional</h3>
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
                        voiceSettings.enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white dark:bg-slate-200 w-6 h-6 rounded-full transition-transform ${
                        voiceSettings.enabled ? "transform translate-x-6" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {voiceSettings.enabled ? "Activada" : "Desactivada"}
                  </span>
                </label>
              </div>

              {voiceSettings.enabled && (
                <div className="grid md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-600">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Frase de inicio de bloque</label>
                      <input
                        type="text"
                        value={voiceSettings.startPhrase}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, startPhrase: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: ¡Comenzó el juego!"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Frase de fin de bloque</label>
                      <input
                        type="text"
                        value={voiceSettings.endPhrase || "Bloque terminado, prepárate para el siguiente."}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, endPhrase: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Bloque terminado"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Recordatorio entre bloques (cada min)</label>
                      <input
                        type="text"
                        value={voiceSettings.idlePhrase || "El reto de enfoque continúa, inicia el siguiente bloque."}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, idlePhrase: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: El reto continúa"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Tipo de Voz</label>
                      <select
                        value={voiceSettings.voiceType}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, voiceType: e.target.value as any })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="es-ES-Journey-F">Chirp 3 HD - España (Mujer)</option>
                        <option value="es-ES-Journey-D">Chirp 3 HD - España (Hombre)</option>
                        <option value="es-PE-AlexNeural">Microsoft Alex (Perú) - Masculino</option>
                        <option value="es-PE-CamilaNeural">Microsoft Camila (Perú) - Femenina</option>
                        <option value="femaleSexy1">Mujer Seductora 1 (Cálida/Susurrante)</option>
                        <option value="femaleSexy2">Mujer Seductora 2 (Profunda/Intensa)</option>
                        <option value="femaleSexy3">Mujer Seductora 3 (Suave/Sensual)</option>
                        <option value="female1">Mujer 1 (Natural/Suave)</option>
                        <option value="female2">Mujer 2 (Aguda/Dinámica)</option>
                        <option value="female3">Mujer 3 (Grave/Serena)</option>
                        <option value="male1">Hombre 1 (Natural/Claro)</option>
                        <option value="male2">Hombre 2 (Profundo/Calmado)</option>
                        <option value="male3">Hombre 3 (Agudo/Enérgico)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Frecuencia</label>
                      <select
                        value={voiceSettings.frequencyType}
                        onChange={(e) => setVoiceSettings({ ...voiceSettings, frequencyType: e.target.value as 'interval' | 'random' })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="interval">Intervalo regular</option>
                        <option value="random">Aleatorio por bloque</option>
                      </select>
                    </div>

                    {voiceSettings.frequencyType === 'interval' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Cada cuánto tiempo</label>
                        <select
                          value={voiceSettings.intervalSeconds}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, intervalSeconds: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={30}>Cada 30 segundos</option>
                          <option value={45}>Cada 45 segundos</option>
                          <option value={60}>Cada 1 minuto</option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Veces por bloque</label>
                        <select
                          value={voiceSettings.randomTimes}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, randomTimes: Number(e.target.value) })}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={3}>3 veces</option>
                          <option value={5}>5 veces</option>
                          <option value={10}>10 veces</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Frases (una por línea)</label>
                    <textarea
                      value={voiceSettings.phrases.join('\n')}
                      onChange={(e) => setVoiceSettings({ ...voiceSettings, phrases: e.target.value.split('\n') })}
                      className="w-full flex-1 min-h-[120px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
                      className="w-full bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mt-2"
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
        <div className="col-span-2 md:col-span-5 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Promedio de Éxito</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {successRate}%
          </span>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5 text-indigo-500" />
          Configuración General
        </h2>
        <div className="space-y-6 max-w-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Hora de almuerzo
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hora a la que tomas tu descanso para comer.
              </p>
            </div>
            <input
              type="time"
              value={lunchTime}
              onChange={(e) => onLunchTimeChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Fin de jornada
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hora a la que terminas de trabajar.
              </p>
            </div>
            <input
              type="time"
              value={workdayEnd}
              onChange={(e) => onWorkdayEndChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Hora de dormir
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Te avisaremos cuando sea hora de descansar.
              </p>
            </div>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => onBedtimeChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Recordatorio Fijo/Permanente */}
        <div className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recordatorio Permanente
            </h3>
            <div
              className="relative inline-block w-14 align-middle select-none cursor-pointer"
              onClick={() => onReminderSettingsChange({ ...reminderSettings, enabled: !reminderSettings.enabled })}
            >
              <div
                className={`block w-14 h-8 rounded-full transition-colors ${
                  reminderSettings.enabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                }`}
              ></div>
              <div
                className={`absolute left-1 top-1 bg-white dark:bg-slate-200 w-6 h-6 rounded-full transition-transform ${
                  reminderSettings.enabled ? "transform translate-x-6" : ""
                }`}
              ></div>
            </div>
          </div>

          {reminderSettings.enabled && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Frase a recordar</label>
                <textarea
                  value={reminderSettings.phrase}
                  onChange={(e) => onReminderSettingsChange({ ...reminderSettings, phrase: e.target.value })}
                  className="w-full min-h-[80px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Voz</label>
                  <select
                    value={reminderSettings.voiceType}
                    onChange={(e) => onReminderSettingsChange({ ...reminderSettings, voiceType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="es-ES-Journey-F">Chirp 3 HD - España (Mujer)</option>
                    <option value="es-ES-Journey-D">Chirp 3 HD - España (Hombre)</option>
                    <option value="es-PE-AlexNeural">Microsoft Alex (Perú) - Masculino</option>
                    <option value="es-PE-CamilaNeural">Microsoft Camila (Perú) - Femenina</option>
                    <option value="female1">Femenina 1 (Energética)</option>
                    <option value="male1">Masculino 1 (Profesional)</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Intervalo</label>
                  <select
                    value={reminderSettings.intervalMinutes}
                    onChange={(e) => onReminderSettingsChange({ ...reminderSettings, intervalMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="15">Cada 15 minutos</option>
                    <option value="30">Cada 30 minutos</option>
                    <option value="60">Cada 1 hora</option>
                    <option value="120">Cada 2 horas</option>
                    <option value="180">Cada 3 horas</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => playPhrase(reminderSettings.phrase, reminderSettings.voiceType)}
                className="w-full bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Probar Recordatorio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {stats.history.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <List className="w-5 h-5 text-slate-500 dark:text-slate-400" />
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
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    game.status === 'abandoned' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100 dark:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(game.date).toLocaleDateString()}
                      </div>
                      {game.status === 'abandoned' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                          Inconcluso
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {game.durationPerBlock}m x {game.totalBlocks} bloques
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg" title="Tiempo Real vs Planeado">
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center space-y-2">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-full">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </div>
      </div>
    </div>
  );
}
