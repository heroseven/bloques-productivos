import React, { useState, useEffect } from "react";
import { Stats, GameSettings, GameRecord } from "./types";
import Dashboard from "./components/Dashboard";
import Game from "./components/Game";
import Summary from "./components/Summary";
import BedtimeCountdown from "./components/BedtimeCountdown";

type View = "dashboard" | "game" | "summary";

const DEFAULT_STATS: Stats = {
  totalGames: 0,
  totalBlocks: 0,
  completedBlocks: 0,
  failedBlocks: 0,
  bestStrike: 0,
  history: [],
};

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [currentSettings, setCurrentSettings] = useState<GameSettings | null>(
    null,
  );
  const [lastResults, setLastResults] = useState<{
    results: boolean[];
    strike: number;
    actualSeconds: number;
  } | null>(null);
  const [bedtime, setBedtime] = useState<string>(() => {
    return localStorage.getItem("focusblocks_bedtime") || "21:45";
  });

  useEffect(() => {
    const savedStats = localStorage.getItem("focusblocks_stats");
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Error parsing stats", e);
      }
    }
  }, []);

  const handleBedtimeChange = (newTime: string) => {
    setBedtime(newTime);
    localStorage.setItem("focusblocks_bedtime", newTime);
  };

  const saveStats = (newStats: Stats) => {
    setStats(newStats);
    localStorage.setItem("focusblocks_stats", JSON.stringify(newStats));
  };

  const handleStartGame = (settings: GameSettings) => {
    if (!settings.voiceSettings) {
      settings.voiceSettings = {
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
    } else {
      if (settings.voiceSettings.startPhrase === undefined) {
        settings.voiceSettings.startPhrase = "¡Comenzó el juego!";
      }
      if (settings.voiceSettings.endPhrase === undefined) {
        settings.voiceSettings.endPhrase = "Bloque terminado, prepárate para el siguiente.";
      }
      if (settings.voiceSettings.idlePhrase === undefined) {
        settings.voiceSettings.idlePhrase = "El reto de enfoque continúa, inicia el siguiente bloque.";
      }
    }
    
    if (!settings.backgroundSound) {
      settings.backgroundSound = "none";
    }
    
    setCurrentSettings(settings);
    setView("game");
  };

  const handleFinishGame = (results: boolean[], strike: number, actualSeconds: number) => {
    if (!currentSettings) return;

    const completed = results.filter(Boolean).length;
    const failed = results.length - completed;

    const newRecord: GameRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationPerBlock: currentSettings.duration,
      totalBlocks: currentSettings.blocksCount,
      completedBlocks: completed,
      results,
      strike,
      actualSeconds,
      status: 'completed',
    };

    const newStats: Stats = {
      ...stats,
      totalGames: stats.totalGames + 1,
      totalBlocks: stats.totalBlocks + currentSettings.blocksCount,
      completedBlocks: stats.completedBlocks + completed,
      failedBlocks: stats.failedBlocks + failed,
      bestStrike: Math.max(stats.bestStrike, strike),
      history: [newRecord, ...stats.history],
    };

    saveStats(newStats);
    setLastResults({ results, strike, actualSeconds });
    setView("summary");
  };

  const handleAbandon = (actualSeconds: number, results: boolean[], strike: number) => {
    if (!currentSettings) return;

    const completed = results.filter(Boolean).length;

    const newRecord: GameRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      durationPerBlock: currentSettings.duration,
      totalBlocks: currentSettings.blocksCount,
      completedBlocks: completed,
      results,
      strike,
      actualSeconds,
      status: 'abandoned',
    };

    const newStats: Stats = {
      ...stats,
      totalGames: stats.totalGames + 1,
      abandonedGames: (stats.abandonedGames || 0) + 1,
      history: [newRecord, ...stats.history],
    };

    saveStats(newStats);
    setCurrentSettings(null);
    setView("dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <BedtimeCountdown bedtime={bedtime} />
      
      {view === "dashboard" && (
        <Dashboard 
          stats={stats} 
          onStartGame={handleStartGame} 
          bedtime={bedtime}
          onBedtimeChange={handleBedtimeChange}
        />
      )}

      {view === "game" && currentSettings && (
        <Game
          settings={currentSettings}
          onFinish={handleFinishGame}
          onAbandon={handleAbandon}
        />
      )}

      {view === "summary" && currentSettings && lastResults && (
        <Summary
          settings={currentSettings}
          results={lastResults.results}
          strike={lastResults.strike}
          actualSeconds={lastResults.actualSeconds}
          onHome={() => setView("dashboard")}
          onRestart={() => handleStartGame(currentSettings)}
        />
      )}
    </div>
  );
}
