import express from 'express';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/recommend', async (req, res) => {
    const { vibe } = req.body as { vibe?: string };
    if (!vibe || typeof vibe !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "vibe" in request body.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-openai-api-key-here') {
      return res.status(500).json({ error: 'Server configuration error: OPENAI_API_KEY is missing or not set.' });
    }

    try {
      const openai = new OpenAI({ apiKey });
      const prompt = `
You are an expert movie recommender. The user has provided the following vibe/mood description:
"${vibe}"

Based on this vibe, recommend exactly 4 movies that perfectly match what they are looking for.
Choose 1 as the absolute best "Top Pick", and 3 as alternative options.

For the Top Pick, write a short, engaging, and personalized recommendation (2-3 sentences) explaining why this specific movie fits their mood.

IMPORTANT: For each movie, provide the exact IMDB ID (e.g., "tt0133093", "tt0829482"). This will be used to fetch the movie poster.

Respond with a valid JSON object in this exact format:
{
  "recommendation": {
    "movieId": "exact title of the top pick movie",
    "recommendationText": "personalized message explaining why it fits"
  },
  "movies": [
    {
      "id": 1,
      "title": "Movie Title",
      "overview": "Short plot summary (1-2 sentences)",
      "imdb_id": "tt1234567",
      "release_date": "YYYY-MM-DD",
      "vote_average": 8.5
    },
    // ... 3 more movies
  ]
}

Do not include any other text or explanations outside the JSON.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content?.trim();
      if (!responseText) {
        return res.status(502).json({ error: 'Empty response from OpenAI API.' });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response. Raw text:', responseText);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          return res.status(502).json({ error: 'The AI returned an invalid format. Please try again.' });
        }
      }

      return res.json(data);
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);

      let message = error?.message || 'Unknown server error.';
      try {
        const parsed = typeof message === 'string' ? JSON.parse(message) : null;
        if (parsed && parsed.error && typeof parsed.error.message === 'string') {
          message = parsed.error.message;
        }
      } catch {
      }

      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
