import textToSpeech from "@google-cloud/text-to-speech";

export default async function handler(req: any, res: any) {
  // Configurar CORS por si acaso
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let ttsClient: any = null;
  try {
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      ttsClient = new textToSpeech.TextToSpeechClient({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          // Reemplaza los saltos de línea literales por reales para Vercel
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
      });
      console.log("Google Cloud TTS initialized via Environment Variables in Vercel.");
    } else {
      // Fallback
      ttsClient = new textToSpeech.TextToSpeechClient();
    }
  } catch (err) {
    console.error("Failed to initialize Google Cloud TTS client:", err);
    return res.status(500).json({ error: "Failed to initialize TTS client" });
  }

  const { text, voiceName } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const request = {
      input: { text: text },
      voice: {
        languageCode: 'es-ES',
        name: voiceName || 'es-ES-Journey-F',
      },
      audioConfig: { audioEncoding: 'MP3' as const }, // MP3 encoding
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Convertir a Buffer (Vercel Node.js Serverless Functions lo soportan)
    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: "Failed to synthesize speech" });
  }
}
