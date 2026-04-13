import React, { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

interface BedtimeCountdownProps {
  bedtime?: string;
}

export default function BedtimeCountdown({ bedtime = "21:45" }: BedtimeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      
      const [hoursStr, minutesStr] = bedtime.split(':');
      const targetHours = parseInt(hoursStr, 10) || 21;
      const targetMinutes = parseInt(minutesStr, 10) || 45;

      target.setHours(targetHours, targetMinutes, 0, 0);

      // Si ya pasó la hora de dormir de hoy
      if (now.getTime() > target.getTime()) {
        const timeSinceBedtime = now.getTime() - target.getTime();
        // Si estamos dentro de las 6 horas posteriores a la hora de dormir, es hora de dormir
        if (timeSinceBedtime < 6 * 60 * 60 * 1000) {
          setIsUrgent(true);
          return "¡A dormir!";
        } else {
          // Si ya pasaron más de 6 horas, el próximo objetivo es mañana
          target.setDate(target.getDate() + 1);
        }
      }

      const diff = target.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      // Es urgente si falta 1 hora o menos
      setIsUrgent(hours === 0);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, [bedtime]);

  return (
    <div className={`fixed top-3 right-3 sm:top-6 sm:right-6 z-50 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg flex items-center gap-2 text-sm font-bold border transition-colors duration-500 ${
      isUrgent 
        ? 'bg-rose-500/90 text-white border-rose-400 shadow-rose-500/20' 
        : 'bg-indigo-900/80 text-white border-indigo-700/50 shadow-indigo-900/20'
    }`}>
      <Moon className={`w-4 h-4 ${isUrgent ? 'text-rose-200 animate-pulse' : 'text-indigo-300'}`} />
      <div className="flex flex-col">
        <span className={`text-[10px] uppercase tracking-wider leading-none mb-0.5 ${isUrgent ? 'text-rose-200' : 'text-indigo-200'}`}>
          Dormir en
        </span>
        <span className="leading-none">{timeLeft}</span>
      </div>
    </div>
  );
}
