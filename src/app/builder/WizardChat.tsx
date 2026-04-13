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
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14l-2 15H7L5 3z" />
            <path d="M9 18h6" />
            <path d="M12 18v3" />
            <path d="M8 21h8" />
            <path d="M7 7h10" />
          </svg>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            RoGin AI Distiller
          </h3>
        </div>
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          Chat with an AI distiller to craft your next recipe
        </p>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
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
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                animation: 'fade-in-up 0.3s ease-out',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: isUser
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: isUser ? 'var(--accent)' : 'var(--card-bg)',
                  color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                  border: isUser ? 'none' : '1px solid var(--border)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                }}
              >
                {renderMessageText(displayText)}

                {/* Recipe card */}
                {recipe && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'var(--highlight-bg)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 8px 0',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--accent)',
                      }}
                    >
                      Suggested Recipe
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {recipe.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                            borderBottom:
                              i < recipe.items.length - 1
                                ? '1px solid var(--border)'
                                : 'none',
                          }}
                        >
                          <span>
                            {item.botanicalName}{' '}
                            <span
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: '12px',
                              }}
                            >
                              ({item.botanicalNameHe})
                            </span>
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--accent)',
                            }}
                          >
                            {item.ratio === 1.0
                              ? '1.0 (base)'
                              : item.ratio.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {recipe.description && (
                      <p
                        style={{
                          margin: '8px 0 0 0',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        {recipe.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
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
              <span
                style={{
                  display: 'inline-flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                Thinking
                <span className="animate-pulse">...</span>
              </span>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#FFF0F0',
              border: '1px solid #FFCCCC',
              color: '#CC3333',
              fontSize: '13px',
            }}
          >
            {error}
            <button
              onClick={() => {
                setError(null);
                // Retry: resend current messages
                sendMessages(messages);
              }}
              style={{
                marginLeft: '8px',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                color: '#CC3333',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* "Use This Recipe" button — shown when a recipe has been generated */}
      {extractedRecipe && !recipeUsed && (
        <div
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
            Use This Recipe
          </button>
        </div>
      )}

      {recipeUsed && (
        <div
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
          Recipe loaded into the editor!
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
