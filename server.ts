import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import textToSpeech from "@google-cloud/text-to-speech";

// Define an interface extending standard Request if needed, but standard Request is fine here
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Google Cloud TTS Client with the provided credentials
  let ttsClient: any = null;
  try {
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      ttsClient = new textToSpeech.TextToSpeechClient({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          // Replace literal '\n' with actual newlines for Vercel compatibility
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        projectId: process.env.GOOGLE_PROJECT_ID,
      });
      console.log("Google Cloud TTS initialized via Environment Variables.");
    } else {
      const keyFilename = path.resolve(process.cwd(), 'google-credentials.json');
      ttsClient = new textToSpeech.TextToSpeechClient({
        keyFilename
      });
      console.log("Google Cloud TTS initialized via google-credentials.json file.");
    }
  } catch (err) {
    console.error("Failed to initialize Google Cloud TTS client:", err);
  }

  // API Route for text-to-speech
  app.post("/api/tts", async (req, res) => {
    if (!ttsClient) {
      return res.status(500).json({ error: "TTS client not initialized" });
    }

    const { text, voiceName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    try {
      // Setup voice request
      const request = {
        input: { text: text },
        // Select the language and SSML voice gender (optional)
        voice: {
          languageCode: 'es-ES',
          name: voiceName || 'es-ES-Journey-F',
        },
        // select the type of audio encoding
        audioConfig: { audioEncoding: 'MP3' as const },
      };

      // Performs the text-to-speech request
      const [response] = await ttsClient.synthesizeSpeech(request);
      
      // Send the audio content back
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(response.audioContent);
    } catch (error) {
      console.error('Error generating speech:', error);
      res.status(500).json({ error: "Failed to synthesize speech" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
