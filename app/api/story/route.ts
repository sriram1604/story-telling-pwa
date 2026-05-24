import { GoogleGenerativeAI } from '@google/generative-ai';
import { LANGUAGE_NAMES } from '../../utils/constants';
import type { LanguageCode, MoodType } from '../../types';

// ── Route segment config ──────────────────────────────────────────────────────
// Keep this route dynamic so it never gets statically cached
export const dynamic = 'force-dynamic';

// ── Gemini client (reuse across invocations) ──────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;

/**
 * Build a Gemini prompt that generates a children's story.
 */
function buildPrompt(userInput: string, language: LanguageCode, mood: MoodType): string {
  const langName = LANGUAGE_NAMES[language];

  const moodInstructions: Record<MoodType, string> = {
    moral:     'The story must strongly revolve around a clear life lesson.',
    funny:     'Make it extremely funny with silly characters, unexpected jokes, and playful dialogues.',
    adventure: 'Make it thrilling with danger, challenges, and a brave hero.',
    magical:   'Include magical worlds, powers, talking animals, and fantasy elements.',
    scary:     'Make it mildly spooky and suspenseful but safe for kids.',
  };

  return `
You are a MASTER children's storyteller AI. Your job is to create HIGHLY ENGAGING, LONG, and MEANINGFUL stories.

STRICT RULES (MUST FOLLOW):
- Minimum length: 700 words (DO NOT STOP EARLY)
- Use SIMPLE, CHILD-FRIENDLY ${langName} ONLY
- Story must be COMPLETE (beginning → middle → ending)
- MUST include dialogues between characters
- MUST include emotions (happy 😄, sad 😢, funny 😂, surprise 😲)
- MUST be VERY INTERESTING (no boring or generic writing)
- NEVER cut the story midway
- NEVER produce incomplete sentences

STRUCTURE:
1. Introduction (characters + setting)
2. Big Problem / Adventure
3. Emotional + Fun + Engaging events
4. Strong Climax
5. Satisfying Ending

STYLE:
- Make kids CURIOUS to know "what happens next?"
- Add humor, imagination, and twists
- Use expressive storytelling

MOOD REQUIREMENT:
${moodInstructions[mood]}

ENDING:
- MUST end with:
Moral: <clear lesson>

USER IDEA:
"${userInput}"

OUTPUT:
Return ONLY the story text in ${langName}.
DO NOT explain anything.
DO NOT add title.
DO NOT stop early.
`;
}

/**
 * POST /api/story
 * Body: { prompt: string, language: LanguageCode, mood: MoodType }
 */
export async function POST(request: Request) {
  // ── Validate API key ────────────────────────────────────────────────────────
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  // ── Parse request body ──────────────────────────────────────────────────────
  let body: { prompt?: string; language?: string; mood?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { prompt, language = 'en-IN', mood = 'moral' } = body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return Response.json({ error: 'prompt is required and must be a non-empty string.' }, { status: 400 });
  }

  // ── Call Gemini ─────────────────────────────────────────────────────────────
  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use gemini-1.5-pro for high quality creative writing
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const generationConfig = {
      temperature:     0.8,  
      topP:            0.95,
      topK:            40,
      maxOutputTokens: 4096, 
    };

    const geminiPrompt = buildPrompt(
      prompt.trim(),
      language as LanguageCode,
      mood as MoodType
    );

    const result   = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: geminiPrompt }] }],
      generationConfig,
    });

    let storyText = result.response.text().trim();

    if (!storyText) {
      return Response.json(
        { error: 'Gemini returned an empty story. Please try again.' },
        { status: 502 }
      );

    }

    if (!storyText.includes('Moral:')) {
      const continuation = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Continue and COMPLETE this story properly with a strong ending and moral:\n\n${storyText}`
          }]
        }]
      });

      storyText += "\n" + continuation.response.text().trim();
    }

    // Derive a title from the first sentence
    const firstSentence = storyText.split(/[.!?।]\s+/)[0] ?? storyText.slice(0, 60);
    const title = firstSentence.trim();

    return Response.json({ story: storyText, title }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/story] Gemini error:', message);
    return Response.json(
      { error: `Story generation failed: ${message}` },
      { status: 502 }
    );
  }
}
