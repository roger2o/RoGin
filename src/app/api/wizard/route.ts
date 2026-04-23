import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { WizardMessage } from '@/lib/types';
import { DEFAULT_BOTANICALS } from '@/lib/botanicals';

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter: max 20 requests per rolling 60-second window
// ---------------------------------------------------------------------------
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

function isRateLimited(): boolean {
  const now = Date.now();
  // Purge timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT_MAX) {
    return true;
  }
  requestTimestamps.push(now);
  return false;
}

// ---------------------------------------------------------------------------
// Fetch all batches with tasting notes from the database
// ---------------------------------------------------------------------------
async function fetchBatchHistory(): Promise<string> {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        items: {
          include: { botanical: true },
          orderBy: { botanical: { sortOrder: 'asc' } },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (batches.length === 0) {
      return 'No previous batches found in the database.';
    }

    return batches
      .map((b) => {
        const itemLines = b.items
          .map((item) => `  - ${item.botanical.name} (${item.botanical.nameHe}): ${item.amount} ml`)
          .join('\n');
        const notes = b.notes ? `  Tasting notes: "${b.notes}"` : '  Tasting notes: (none recorded)';
        return `Batch: ${b.name} (${b.date.toISOString().split('T')[0]})\n${notes}\n  Botanicals:\n${itemLines}`;
      })
      .join('\n\n');
  } catch (error) {
    console.error('Failed to fetch batch history for wizard:', error);
    return 'Could not retrieve batch history from the database.';
  }
}

// ---------------------------------------------------------------------------
// Build the system prompt as two blocks — a cached static prefix and a
// dynamic suffix containing the batch history.
//
// Prompt caching is a prefix match: any byte change invalidates everything
// after it. By placing the batch history (which grows whenever the user
// logs a new batch) *after* the cache breakpoint, the ~1,500-token static
// prefix is served from cache on repeat wizard calls — roughly 90% cheaper
// on those tokens and 1–2 seconds faster time-to-first-token.
// ---------------------------------------------------------------------------
function buildSystemPrompt(batchHistory: string): Anthropic.TextBlockParam[] {
  const botanicalList = DEFAULT_BOTANICALS.map(
    (b) => `- ${b.name} (${b.nameHe})${b.notes ? ` — ${b.notes}` : ''}`
  ).join('\n');

  const staticPrompt = `You are an experienced gin distiller and botanical expert helping a home gin maker craft their next recipe. Your name is "The RoGin AI Distiller". You are knowledgeable, creative, and enthusiastic about gin.

## Your role
- Have a natural, friendly conversation to understand what the user wants in their next gin batch
- Ask intelligent, contextual follow-up questions — think like a real distiller, not a form with 5 fixed options
- Consider: flavour profile preferences, the occasion, their mood, what they liked or disliked in past batches, whether they want to experiment or stick with a proven formula, seasonal considerations, food pairings
- After 2-3 exchanges (when you have enough information), generate a recipe

## The user's botanical library
These are the botanicals they currently have available:
${botanicalList}

You may also suggest NEW botanicals they don't yet have. Since the user shops in Israel, always include the Hebrew name (שם בעברית) for any new botanical you suggest, so they can find it easily at the spice market. Common Israeli spice market botanicals include: lavender (לבנדר), dried rose petals (עלי ורד), lemongrass (למון גראס), cubeb pepper (פלפל קוביבה), angelica root (שורש אנג'ליקה), orris root (שורש אירוס), grains of paradise (גרעיני גן עדן), dried citrus peel (קליפות הדרים), za'atar (זעתר), sumac (סומאק), dried hibiscus (היביסקוס), pink peppercorn (פלפל ורוד), bay leaves (עלי דפנה), fennel seeds (זרעי שומר), star anise (כוכב אניס), dried ginger (ג'ינג'ר מיובש), dried chamomile (קמומיל), dried mint (נענע מיובשת).

## Key observations to keep in mind
- Batch 1 was "Fantastic!!" — this is a proven baseline recipe
- Batch 3 had "Too much cinnamon" — Ceylon Cinnamon ratio was 0.25 of Juniper. Be cautious with cinnamon, keep ratio below 0.15
- Batch 7 had "Too many flavours?" — it used 10 different botanicals. When using many botanicals, keep secondary ones at lower ratios
- Batch 8 was "Ginnier" — it had a very high Juniper ratio relative to other botanicals. The user may enjoy a juniper-forward profile
- The user has been making gin since 2022 and has 8 batches of experience. They are not a beginner.

## Recipe output format
When you have enough information (after 2-3 conversational exchanges), generate a recipe. Output it as a JSON block wrapped in triple-backtick json markers. The JSON must follow this EXACT structure:

\`\`\`json
{
  "recipe": {
    "items": [
      {"botanicalName": "Juniper + Lemon", "botanicalNameHe": "ערער + לימון פרסי", "ratio": 1.0},
      {"botanicalName": "Anise", "botanicalNameHe": "אניס", "ratio": 0.15}
    ],
    "description": "A brief description of this recipe and what makes it special"
  }
}
\`\`\`

### Recipe rules:
- "Juniper + Lemon" is ALWAYS the first item with ratio 1.0 (this is the base)
- All other ratios are relative to Juniper (e.g., 0.15 means 15% of the Juniper amount)
- Ratios should be between 0.01 and 0.5 for non-Juniper botanicals
- Keep cinnamon ratio at or below 0.15 (lesson learned from Batch 3)
- Include the Hebrew name for every botanical
- Provide a short, evocative description of the recipe's character

## Conversation style
- Be warm but concise — don't write walls of text
- Use gin and distilling terminology naturally
- Reference their past batches by name when relevant (e.g., "Your Batch 1 was a hit — want to build on that?")
- When suggesting ideas, explain WHY a botanical combination works (e.g., "cardamom and vanilla create a warm, rounded sweetness")
- Don't ask more than 2 questions at a time
- After generating the recipe, explain your reasoning and invite feedback`;

  const dynamicPrompt = `## Past batch history
Review this carefully. Use tasting notes to guide suggestions — avoid repeating issues, build on successes.
${batchHistory}`;

  return [
    { type: 'text', text: staticPrompt, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicPrompt },
  ];
}

// ---------------------------------------------------------------------------
// POST /api/wizard
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // Rate limit check
  if (isRateLimited()) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { messages, juniperAmount } = body as {
      messages: WizardMessage[];
      juniperAmount: number;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    // Fetch batch history from the database
    const batchHistory = await fetchBatchHistory();
    const systemPrompt = buildSystemPrompt(batchHistory);

    // Build messages for Claude — include Juniper context in the first user message
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map(
      (msg, index) => {
        if (index === 0 && msg.role === 'user') {
          // Append Juniper amount context to the first user message
          const juniperContext = juniperAmount
            ? `\n\n[System note: The user has set their Juniper + Lemon base amount to ${juniperAmount} ml for this batch.]`
            : '';
          return { role: msg.role, content: msg.content + juniperContext };
        }
        return { role: msg.role, content: msg.content };
      }
    );

    const client = new Anthropic();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    });

    // Log token usage so cache hits are observable in server logs.
    // Look for `cache_read_input_tokens > 0` on repeat calls to confirm
    // the static prefix is being served from cache.
    console.log('[wizard] usage:', response.usage);

    // Extract text content from the response
    const assistantMessage = response.content
      .filter((block) => block.type === 'text')
      .map((block) => {
        if (block.type === 'text') return block.text;
        return '';
      })
      .join('');

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Wizard API error:', error);

    if (error instanceof Anthropic.APIError) {
      const status = error.status || 500;
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
