const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const playPhrase = async (phrase: string, voiceType: string) => {
  // Check if it's a server-side TTS voice
  if (voiceType === 'es-ES-Journey-F' || voiceType === 'es-ES-Journey-D') {
    try {
      const cacheKey = `tts_${voiceType}_${phrase}`;
      const cachedAudio = localStorage.getItem(cacheKey);
      
      let audioUrl = '';
      
      if (cachedAudio) {
        audioUrl = cachedAudio;
      } else {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: phrase, voiceName: voiceType })
        });
        
        if (!response.ok) {
          throw new Error('TTS API failed');
        }
        
        const audioBlob = await response.blob();
        
        try {
          const base64Audio = await blobToBase64(audioBlob);
          localStorage.setItem(cacheKey, base64Audio);
        } catch (storageErr) {
          console.warn('Could not save audio to localStorage (might be full):', storageErr);
        }
        
        audioUrl = URL.createObjectURL(audioBlob);
      }

      const audio = new Audio(audioUrl);
      
      // Stop current browser synthesis if any
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      
      audio.play();
      
      // Cleanup
      audio.onended = () => {
        if (!cachedAudio) {
          URL.revokeObjectURL(audioUrl);
        }
      };
      
      return;
    } catch (err) {
      console.error('Failed to play server TTS:', err);
      // Fallback to browser TTS
    }
  }

  if (!("speechSynthesis" in window)) return;
  
  window.speechSynthesis.cancel(); // Stop any current speech
  
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = "es-ES";
  
  const voices = window.speechSynthesis.getVoices();
  const esVoices = voices.filter((v) => v.lang.startsWith("es"));
  
  // Separate into female and male pools based on heuristics
  const femaleVoices = esVoices.filter(v => 
    v.name.toLowerCase().includes("female") || 
    v.name.toLowerCase().includes("mujer") ||
    v.name.toLowerCase().includes("helena") ||
    v.name.toLowerCase().includes("laura") ||
    v.name.toLowerCase().includes("sabina") ||
    v.name.toLowerCase().includes("monica") ||
    v.name.toLowerCase().includes("paulina") ||
    v.name.toLowerCase().includes("lucia") ||
    v.name.toLowerCase().includes("conchita") ||
    v.name.toLowerCase().includes("mia") ||
    v.name.toLowerCase().includes("elvira") ||
    v.name.toLowerCase().includes("dahlia")
  );
  
  const maleVoices = esVoices.filter(v => 
    v.name.toLowerCase().includes("male") || 
    v.name.toLowerCase().includes("hombre") ||
    v.name.toLowerCase().includes("pablo") ||
    v.name.toLowerCase().includes("jorge") ||
    v.name.toLowerCase().includes("diego") ||
    v.name.toLowerCase().includes("carlos") ||
    v.name.toLowerCase().includes("enrique") ||
    v.name.toLowerCase().includes("alvaro") ||
    v.name.toLowerCase().includes("tomas")
  );

  // If we can't find explicitly gendered voices, just use the general pool
  const females = femaleVoices.length > 0 ? femaleVoices : esVoices;
  const males = maleVoices.length > 0 ? maleVoices : esVoices;

  let selectedVoice;
  
  switch(voiceType) {
    case 'es-PE-AlexNeural':
      selectedVoice = esVoices.find((v) => v.name.includes("es-PE-AlexNeural") || v.name.includes("Alex") || v.name.includes("Peru")) || males[0];
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      break;
    case 'es-PE-CamilaNeural':
      selectedVoice = esVoices.find((v) => v.name.includes("es-PE-CamilaNeural") || v.name.includes("Camila") || v.name.includes("Peru")) || females[0];
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
      break;
    case 'femaleSexy1': // Cálida/Susurrante
      selectedVoice = females.find((v) => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium")) || females[0];
      utterance.pitch = 0.85; // Un poco más grave da un tono más cálido
      utterance.rate = 0.8;   // Habla más pausada
      break;
    case 'femaleSexy2': // Profunda/Intensa
      selectedVoice = females.length > 1 ? females[1] : females[0];
      utterance.pitch = 0.7;  // Aún más grave
      utterance.rate = 0.85;  // Pausado
      break;
    case 'femaleSexy3': // Suave/Sensual
      selectedVoice = females.length > 2 ? females[2] : females[0];
      utterance.pitch = 1.0;  // Pitch normal
      utterance.rate = 0.75;  // Velocidad muy tranquila
      break;
    case 'female1':
      selectedVoice = females.find((v) => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium")) || females[0];
      utterance.pitch = 1.1;
      utterance.rate = 0.9;
      break;
    case 'female2':
      selectedVoice = females.length > 1 ? females[1] : females[0];
      utterance.pitch = 1.3; // Higher pitch
      utterance.rate = 0.95;
      break;
    case 'female3':
      selectedVoice = females.length > 2 ? females[2] : females[0];
      utterance.pitch = 0.9; // Lower pitch
      utterance.rate = 0.85;
      break;
    case 'male1':
      selectedVoice = males.find((v) => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium")) || males[0];
      utterance.pitch = 0.9;
      utterance.rate = 0.9;
      break;
    case 'male2':
      selectedVoice = males.length > 1 ? males[1] : males[0];
      utterance.pitch = 0.7; // Deeper
      utterance.rate = 0.85;
      break;
    case 'male3':
      selectedVoice = males.length > 2 ? males[2] : males[0];
      utterance.pitch = 1.1; // Higher
      utterance.rate = 0.95;
      break;
    default:
      selectedVoice = esVoices[0];
      utterance.pitch = 1.0;
      utterance.rate = 0.9;
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else if (esVoices.length > 0) {
    utterance.voice = esVoices[0];
  }
  
  window.speechSynthesis.speak(utterance);
};

// Pre-load voices
if (typeof window !== 'undefined' && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
