'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { WizardMessage, GeneratedRecipe } from '@/lib/types';

interface WizardChatProps {
  juniperAmount: number;
  onRecipeGenerated: (
    items: { botanicalName: string; botanicalNameHe: string; ratio: number }[],
    description: string
  ) => void;
}

/**
 * Try to extract a JSON recipe block from the assistant's message.
 * Looks for ```json ... ``` markers containing a { "recipe": ... } object.
 */
function extractRecipe(text: string): GeneratedRecipe | null {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const match = text.match(jsonBlockRegex);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (
      parsed.recipe &&
      Array.isArray(parsed.recipe.items) &&
      parsed.recipe.items.length > 0
    ) {
      // Validate each item has the required fields
      const valid = parsed.recipe.items.every(
        (item: Record<string, unknown>) =>
          typeof item.botanicalName === 'string' &&
          typeof item.botanicalNameHe === 'string' &&
          typeof item.ratio === 'number'
      );
      if (valid) {
        return parsed.recipe as GeneratedRecipe;
      }
    }
  } catch {
    // JSON parse failed — not a valid recipe block
  }
  return null;
}

/**
 * Strip the raw JSON block from the display text so users see the
 * natural-language explanation without the raw JSON.
 */
function stripJsonBlock(text: string): string {
  return text.replace(/```json\s*[\s\S]*?```/, '').trim();
}

/**
 * Render message text with basic markdown-like formatting.
 * Handles **bold**, *italic*, and newlines.
 */
function renderMessageText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      elements.push(<br key={`br-${lineIdx}`} />);
    }

    // Process bold and italic within the line
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    parts.forEach((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        elements.push(
          <strong key={`${lineIdx}-${partIdx}`}>{part.slice(2, -2)}</strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*')) {
        elements.push(
          <em key={`${lineIdx}-${partIdx}`}>{part.slice(1, -1)}</em>
        );
      } else {
        elements.push(part);
      }
    });
  });

  return elements;
}

export function WizardChat({ juniperAmount, onRecipeGenerated }: WizardChatProps) {
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<GeneratedRecipe | null>(null);
  const [recipeUsed, setRecipeUsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFetchedInitial = useRef(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send messages to the API
  const sendMessages = useCallback(
    async (allMessages: WizardMessage[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/wizard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: allMessages, juniperAmount }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Request failed with status ${res.status}`
          );
        }

        const data = await res.json();
        const assistantMessage: WizardMessage = {
          role: 'assistant',
          content: data.message,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Check if the response contains a recipe
        const recipe = extractRecipe(data.message);
        if (recipe) {
          setExtractedRecipe(recipe);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [juniperAmount]
  );

  // Auto-send the opening message when the component mounts
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;

    const openingMessage: WizardMessage = {
      role: 'user',
      content:
        "Hi! I'd like help creating a new gin recipe.",
    };
    setMessages([openingMessage]);
    sendMessages([openingMessage]);
  }, [sendMessages]);

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: WizardMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    sendMessages(updatedMessages);
  };

  // Handle Enter key (submit on Enter, newline on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  // Handle "Use This Recipe" button
  const handleUseRecipe = () => {
    if (!extractedRecipe) return;
    setRecipeUsed(true);
    onRecipeGenerated(extractedRecipe.items, extractedRecipe.description);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header — single line, no redundant subtitle.
          Saves vertical space; the page already establishes context. */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 3h14l-2 15H7L5 3z" />
          <path d="M7 7h10" />
        </svg>
        <h3
          style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.01em',
          }}
        >
          RoGin AI Distiller
        </h3>
      </div>

      {/* Messages area.
          aria-live="polite" so screen readers announce assistant responses
          as they arrive. */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Distiller conversation"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minHeight: 0,
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          // Don't render the auto-sent opening message
          if (idx === 0 && isUser) return null;

          const isAssistant = msg.role === 'assistant';
          const recipe = isAssistant ? extractRecipe(msg.content) : null;
          const displayText = recipe
            ? stripJsonBlock(msg.content)
            : msg.content;

          return (
            <div
              key={idx}
              className="animate-fade-in-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '8px',
              }}
            >
              {/* Chat bubble */}
              {displayText && (
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: isUser ? 'var(--accent)' : 'var(--card-bg)',
                    color: isUser ? 'var(--bg-secondary)' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border)',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}
                >
                  {renderMessageText(displayText)}
                </div>
              )}

              {/* Recipe — rendered ADJACENT to the bubble, not nested inside.
                  Avoids the nested-card pattern. Semantic <table> so screen
                  readers announce rows as "Juniper, 1.0". */}
              {recipe && (
                <section
                  aria-labelledby={`recipe-${idx}-heading`}
                  style={{
                    width: '100%',
                    maxWidth: '85%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                  }}
                >
                  <header
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      gap: '8px',
                    }}
                  >
                    <h4
                      id={`recipe-${idx}-heading`}
                      style={{
                        margin: 0,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                      }}
                    >
                      Suggested Recipe
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {recipe.items.length} botanicals
                    </span>
                  </header>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <caption className="sr-only">Botanical ratios</caption>
                    <tbody>
                      {recipe.items.map((item, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom:
                              i < recipe.items.length - 1
                                ? '1px solid var(--border)'
                                : 'none',
                          }}
                        >
                          <td style={{ padding: '6px 0', color: 'var(--text-primary)' }}>
                            {item.botanicalName}
                          </td>
                          <td
                            lang="he"
                            style={{
                              padding: '6px 4px',
                              color: 'var(--text-muted)',
                              fontSize: '12px',
                              direction: 'rtl',
                              textAlign: 'left',
                            }}
                          >
                            {item.botanicalNameHe}
                          </td>
                          <td
                            style={{
                              padding: '6px 0',
                              textAlign: 'right',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {item.ratio === 1.0
                              ? '1.00 base'
                              : item.ratio.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recipe.description && (
                    <p
                      style={{
                        margin: '12px 0 0 0',
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {recipe.description}
                    </p>
                  )}
                </section>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div
            className="animate-fade-in-up"
            style={{ display: 'flex', justifyContent: 'flex-start' }}
            aria-label="Distiller is thinking"
          >
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '16px 16px 16px 4px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              Thinking…
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(140, 29, 44, 0.06)',
              border: '1px solid var(--accent-muted)',
              color: 'var(--accent)',
              fontSize: '13px',
            }}
          >
            {error}
            <button
              onClick={() => {
                setError(null);
                sendMessages(messages);
              }}
              style={{
                marginLeft: '8px',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* "Use This Recipe" CTA — state-marking entrance (a state change, not decoration). */}
      {extractedRecipe && !recipeUsed && (
        <div
          key="use-recipe-cta"
          className="animate-fade-in-up"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <button
            className="btn-primary"
            onClick={handleUseRecipe}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            Use this recipe
          </button>
        </div>
      )}

      {recipeUsed && (
        <div
          key="recipe-loaded-confirmation"
          className="animate-fade-in-up"
          role="status"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '14px',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          Recipe loaded into the editor
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're looking for..."
          disabled={isLoading}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            minHeight: '44px',
            maxHeight: '120px',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 20px',
            flexShrink: 0,
            height: '44px',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
