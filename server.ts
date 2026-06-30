import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Summary Generation
  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { orador, tema, congregacion, puntosFuertes, sugerencias, respuestasResumen } = req.body;

      if (!orador) {
        return res.status(400).json({ error: "El nombre del orador es requerido." });
      }

      // In some environments, the key might be in process.env.GEMINI_API_KEY
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "La clave API de Gemini no está configurada. Por favor, asegúrate de configurarla en la plataforma." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Construct a highly descriptive, warm, and structured prompt for balanced, encouraging feedback
      const prompt = `Actúa como un superintendente o consejero amable de la congregación. Tu tarea es redactar un único párrafo breve, claro y sumamente animador de apreciación del discurso basado en las observaciones recibidas.

Detalles del Orador:
- Orador: ${orador}
- Tema del Discurso: ${tema || "Discurso Público"}
- Congregación: ${congregacion || "Local"}

Comentarios de la congregación:
Puntos Fuertes:
${puntosFuertes && puntosFuertes.length > 0 ? puntosFuertes.map((p: string) => `- ${p}`).join("\n") : "Se destacó un buen desempeño general."}

Sugerencias o áreas de mejora:
${sugerencias && sugerencias.length > 0 ? sugerencias.map((s: string) => `- ${s}`).join("\n") : "Seguir manteniendo la preparación y entusiasmo."}

${respuestasResumen ? `Resumen de calificaciones generales:\n${respuestasResumen}` : ""}

Instrucciones de redacción obligatorias:
1. Redacta UN SOLO PÁRRAFO breve (máximo de 4 a 6 líneas).
2. Dirígete directamente al orador usando la segunda persona (tú o usted de manera muy cercana y fraternal). Ej. "Querido hermano [Nombre]...", "Estimado hermano [Nombre]...".
3. El tono debe ser sumamente EQUILIBRADO:
   - Felicita sinceramente al orador destacando sus puntos fuertes descritos de forma específica.
   - Ofrece consejos o sugerencias de forma muy clara, constructiva, amable y amorosa para ayudarle a seguir mejorando.
4. NUNCA menciones códigos técnicos, JSON, variables o nombres del sistema. El texto debe verse completamente natural y humano, listo para copiar y enviar.
5. Finaliza con un saludo afectuoso y edificante.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = response.text || "";
      res.json({ summary: text.trim() });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      let errorMessage = error?.message || "Ocurrió un error al generar la apreciación con la IA.";
      if (typeof errorMessage === "object") {
        errorMessage = JSON.stringify(errorMessage);
      }

      if (
        errorMessage.includes("API_KEY_SERVICE_BLOCKED") || 
        errorMessage.includes("blocked") || 
        errorMessage.includes("PERMISSION_DENIED")
      ) {
        errorMessage = "La clave API utilizada está bloqueada o restringida por Google Cloud. Esto ocurre porque estás intentando utilizar la clave web de Firebase, la cual tiene restricciones de uso. Para solucionarlo, por favor genera una clave API de Gemini dedicada (gratuita) desde Google AI Studio (https://aistudio.google.com/) y agrégala con el nombre GEMINI_API_KEY en las variables de entorno de tu proyecto en Vercel.";
      }

      res.status(500).json({ error: errorMessage });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
