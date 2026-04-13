import React, { useState, useEffect } from 'react';
import { Moon, Briefcase, Utensils } from 'lucide-react';

interface BedtimeCountdownProps {
  bedtime?: string;
  workdayEnd?: string;
  lunchTime?: string;
}

export default function BedtimeCountdown({ bedtime = "21:45", workdayEnd = "17:30", lunchTime = "13:00" }: BedtimeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [mode, setMode] = useState<'lunch' | 'work' | 'sleep'>('lunch');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Target: Lunch
      const lunchTarget = new Date();
      const [lH, lM] = lunchTime.split(':');
      lunchTarget.setHours(parseInt(lH, 10) || 13, parseInt(lM, 10) || 0, 0, 0);

      // Target: Workday End
      const workTarget = new Date();
      const [wH, wM] = workdayEnd.split(':');
      workTarget.setHours(parseInt(wH, 10) || 17, parseInt(wM, 10) || 30, 0, 0);

      // Target: Bedtime
      const sleepTarget = new Date();
      const [sH, sM] = bedtime.split(':');
      sleepTarget.setHours(parseInt(sH, 10) || 21, parseInt(sM, 10) || 45, 0, 0);

      let target: Date;
      let currentMode: 'lunch' | 'work' | 'sleep';
      let urgent = false;
      let text = "";

      // Logic to determine which target to show
      if (now.getTime() < lunchTarget.getTime()) {
        // Before lunch
        target = lunchTarget;
        currentMode = 'lunch';
      } else if (now.getTime() >= lunchTarget.getTime() && now.getTime() < workTarget.getTime()) {
        // After lunch, before workday ends
        target = workTarget;
        currentMode = 'work';
      } else if (now.getTime() >= workTarget.getTime() && now.getTime() < sleepTarget.getTime()) {
        // After workday ends, before bedtime
        target = sleepTarget;
        currentMode = 'sleep';
      } else {
        // After bedtime
        const timeSinceSleep = now.getTime() - sleepTarget.getTime();
        if (timeSinceSleep < 6 * 60 * 60 * 1000) {
          // Within 6 hours after bedtime -> Go to sleep!
          setMode('sleep');
          setIsUrgent(true);
          return "¡A dormir!";
        } else {
          // Next day's lunch
          target = new Date(lunchTarget);
          target.setDate(target.getDate() + 1);
          currentMode = 'lunch';
        }
      }

      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Urgent if less than 1 hour
      urgent = hours === 0;

      if (hours > 0) {
        text = `${hours}h ${minutes}m`;
      } else {
        text = `${minutes}m`;
      }

      setMode(currentMode);
      setIsUrgent(urgent);
      return text;
    };

    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 10000);

    return () => clearInterval(interval);
  }, [bedtime, workdayEnd, lunchTime]);

  const getStyles = () => {
    if (mode === 'sleep') {
      return isUrgent 
        ? 'bg-rose-500/90 text-white border-rose-400 shadow-rose-500/20' 
        : 'bg-indigo-900/80 text-white border-indigo-700/50 shadow-indigo-900/20';
    } else if (mode === 'work') {
      return isUrgent
        ? 'bg-amber-500/90 text-white border-amber-400 shadow-amber-500/20'
        : 'bg-sky-600/90 text-white border-sky-500/50 shadow-sky-600/20';
    } else {
      // Lunch mode
      return isUrgent
        ? 'bg-orange-500/90 text-white border-orange-400 shadow-orange-500/20'
        : 'bg-emerald-600/90 text-white border-emerald-500/50 shadow-emerald-600/20';
    }
  };

  const getIconStyles = () => {
    if (mode === 'sleep') {
      return isUrgent ? 'text-rose-200 animate-pulse' : 'text-indigo-300';
    } else if (mode === 'work') {
      return isUrgent ? 'text-amber-100 animate-pulse' : 'text-sky-200';
    } else {
      return isUrgent ? 'text-orange-100 animate-pulse' : 'text-emerald-200';
    }
  };

  const getLabelStyles = () => {
    if (mode === 'sleep') {
      return isUrgent ? 'text-rose-200' : 'text-indigo-200';
    } else if (mode === 'work') {
      return isUrgent ? 'text-amber-100' : 'text-sky-200';
    } else {
      return isUrgent ? 'text-orange-100' : 'text-emerald-200';
    }
  };

  const renderIcon = () => {
    if (mode === 'sleep') return <Moon className={`w-4 h-4 ${getIconStyles()}`} />;
    if (mode === 'work') return <Briefcase className={`w-4 h-4 ${getIconStyles()}`} />;
    return <Utensils className={`w-4 h-4 ${getIconStyles()}`} />;
  };

  const getLabelText = () => {
    if (mode === 'sleep') return 'Dormir en';
    if (mode === 'work') return 'Jornada en';
    return 'Almuerzo en';
  };

  return (
    <div className={`fixed top-3 right-3 sm:top-6 sm:right-6 z-50 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold border transition-colors duration-500 ${getStyles()}`}>
      {renderIcon()}
      <div className="flex flex-col">
        <span className={`text-[10px] uppercase tracking-wider leading-none mb-0.5 ${getLabelStyles()}`}>
          {getLabelText()}
        </span>
        <span className="leading-none">{timeLeft}</span>
      </div>
    </div>
  );
}
