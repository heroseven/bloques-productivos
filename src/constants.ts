import { Template } from "./types";

export const TEMPLATES: Template[] = [
  { id: "default", name: "Por Defecto (3m x 3)", duration: 3, blocksCount: 3 },
  {
    id: "pomodoro",
    name: "Pomodoro Clásico (25m x 4)",
    duration: 25,
    blocksCount: 4,
  },
  {
    id: "sprint",
    name: "Sprint Rápido (10m x 3)",
    duration: 10,
    blocksCount: 3,
  },
  {
    id: "deep",
    name: "Trabajo Profundo (20m x 2)",
    duration: 20,
    blocksCount: 2,
  },
];

export const INSPIRATIONAL_MESSAGES = [
  "¡El éxito es la suma de pequeños esfuerzos repetidos día tras día!",
  "¡No te detengas hasta que te sientas orgulloso!",
  "¡La disciplina es el puente entre metas y logros!",
  "¡Cada minuto enfocado te acerca a tu objetivo!",
  "¡Haz de hoy tu obra maestra!",
  "¡La constancia vence a lo que la dicha no alcanza!",
  "¡Un bloque a la vez, una meta a la vez!",
];
