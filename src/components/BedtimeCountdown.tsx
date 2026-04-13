import React, { useState, useEffect } from 'react';
import { Moon } from 'lucide-react';

export default function BedtimeCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(21, 45, 0, 0);

      // Si ya pasó las 9:45 PM
      if (now.getTime() > target.getTime()) {
        // Si es entre las 21:45 y las 03:59 AM, es hora de dormir
        if ((now.getHours() === 21 && now.getMinutes() >= 45) || now.getHours() >= 22 || now.getHours() < 4) {
          setIsUrgent(true);
          return "¡A dormir!";
        }
        // Si es después de las 4 AM (ej. 5 AM), el target debe ser las 21:45 de HOY, lo cual ya está seteado arriba
        // Pero wait, si son las 5 AM, now.getTime() NO es mayor que target.getTime() (que es a las 21:45 de hoy).
        // Así que esta rama solo se ejecuta si son más de las 21:45 de hoy.
      }

      let diff = target.getTime() - now.getTime();
      
      // Si diff es negativo, significa que ya pasó la hora (manejado arriba, pero por si acaso)
      if (diff < 0) {
        setIsUrgent(true);
        return "¡A dormir!";
      }

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
  }, []);

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
