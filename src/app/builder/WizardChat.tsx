'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { WizardMessage, GeneratedRecipe } from '@/lib/types';

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

export function WizardChat() {
  const [messages, setMessages] = useState<WizardMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<GeneratedRecipe | null>(null);

  // Save-as-draft state
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedDraftId, setSavedDraftId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessages = useCallback(async (allMessages: WizardMessage[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
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
  }, []);

  // Auto-send the opening message when the component mounts
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;

    const openingMessage: WizardMessage = {
      role: 'user',
      content: "Hi! I'd like help creating a new gin recipe.",
    };
    setMessages([openingMessage]);
    sendMessages([openingMessage]);
  }, [sendMessages]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleSaveDraft = async () => {
    if (!extractedRecipe) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setSaveError('Give your draft a name first.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          description: extractedRecipe.description,
          items: extractedRecipe.items,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save draft');
      }

      const saved = await res.json();
      setSavedDraftId(saved.id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
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

      {/* Messages area */}
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

      {/* Save-as-draft area — appears once the AI has produced a recipe */}
      {extractedRecipe && !savedDraftId && (
        <div
          key="save-draft"
          className="animate-fade-in-up"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <label
            htmlFor="draft-name"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
            }}
          >
            Save this recipe as a draft for later
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="draft-name"
              type="text"
              className="input"
              placeholder="Name this draft (e.g. Citrus Forward #1)"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (saveError) setSaveError(null);
              }}
              disabled={saving}
              style={{ flex: 1 }}
              maxLength={120}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveDraft}
              disabled={saving || !draftName.trim()}
              style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}
            >
              {saving ? 'Saving…' : 'Save as draft'}
            </button>
          </div>
          {saveError && (
            <p role="alert" style={{ margin: 0, fontSize: '12px', color: 'var(--accent)' }}>
              {saveError}
            </p>
          )}
        </div>
      )}

      {savedDraftId && (
        <div
          key="draft-saved"
          className="animate-fade-in-up"
          role="status"
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            flexShrink: 0,
            fontSize: '14px',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          <span>Draft saved.</span>
          <Link
            href="/log"
            style={{ textDecoration: 'underline', fontWeight: 600 }}
          >
            View in Batch Log
          </Link>
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
