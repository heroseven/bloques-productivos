export const playPhrase = (phrase: string, voiceType: string) => {
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
