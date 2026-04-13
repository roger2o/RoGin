'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BatchData } from '@/lib/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

export default function BatchLogPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const res = await fetch('/api/batches');
        if (!res.ok) throw new Error('Failed to load batches');
        const data: BatchData[] = await res.json();
        setBatches(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, []);

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingNotesId(null);
  }

  function startEditingNotes(batch: BatchData) {
    setEditingNotesId(batch.id);
    setEditedNotes(batch.notes);
  }

  async function saveNotes(batchId: number) {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editedNotes }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, notes: editedNotes } : b))
      );
      setEditingNotesId(null);
    } catch {
      alert('Failed to save notes. Please try again.');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: 'var(--accent)' }}
        >
          Batch Log
        </h1>
        <div className="flex flex-col items-center gap-3 py-16">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--accent)',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading batches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: 'var(--accent)' }}
        >
          Batch Log
        </h1>
        <div className="card p-6 text-center">
          <p style={{ color: 'var(--accent)' }} className="font-medium">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary mt-4 text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in-up">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--accent)' }}
      >
        Batch Log
      </h1>

      {batches.length === 0 ? (
        <div className="card p-8 text-center">
          <p
            className="text-lg mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            No batches yet
          </p>
          <p style={{ color: 'var(--text-muted)' }}>
            Once you brew your first batch, it will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => {
            const isExpanded = expandedId === batch.id;

            return (
              <div key={batch.id} className="card overflow-hidden">
                {/* Collapsed card header — always visible */}
                <button
                  onClick={() => toggleExpand(batch.id)}
                  className="w-full text-left p-5 cursor-pointer"
                  style={{ background: 'transparent' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2
                          className="text-lg font-bold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {batch.name || 'Untitled Batch'}
                        </h2>
                        <span
                          className="text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {formatDate(batch.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-1">
                        <span
                          className="text-sm font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {Math.round(batch.totalVolume)} ml total
                        </span>
                        {batch.recipeName && (
                          <span
                            className="text-sm"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            from {batch.recipeName}
                          </span>
                        )}
                      </div>

                      {!isExpanded && (
                        <p
                          className="mt-2 text-sm leading-relaxed"
                          style={{
                            color: batch.notes
                              ? 'var(--text-secondary)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {batch.notes
                            ? truncate(batch.notes, 120)
                            : 'No notes'}
                        </p>
                      )}
                    </div>

                    {/* Expand chevron */}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="flex-shrink-0 mt-1 transition-transform duration-200"
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                      }}
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail section */}
                {isExpanded && (
                  <div
                    className="px-5 pb-5 border-t"
                    style={{ borderColor: 'var(--border-light)' }}
                  >
                    {/* Tasting notes */}
                    <div className="mt-4 mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="text-sm font-bold uppercase tracking-wider"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Tasting Notes
                        </h3>
                        {editingNotesId !== batch.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingNotes(batch);
                            }}
                            className="text-xs font-medium"
                            style={{ color: 'var(--accent)' }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingNotesId === batch.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="input text-sm"
                            rows={3}
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                            style={{ resize: 'vertical' }}
                            maxLength={2000}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveNotes(batch.id);
                              }}
                              className="btn-primary text-xs py-2 px-4"
                              disabled={savingNotes}
                            >
                              {savingNotes ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNotesId(null);
                              }}
                              className="btn-secondary text-xs py-2 px-4"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            color: batch.notes
                              ? 'var(--text-secondary)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {batch.notes || 'No notes'}
                        </p>
                      )}
                    </div>

                    {/* Botanicals list */}
                    <div className="mb-5">
                      <h3
                        className="text-sm font-bold uppercase tracking-wider mb-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Botanicals
                      </h3>
                      <div className="flex flex-col gap-2">
                        {batch.items.map((item) => (
                          <div
                            key={item.botanicalId}
                            className="flex items-center justify-between py-2 px-3 rounded-lg"
                            style={{ background: 'var(--highlight-bg)' }}
                          >
                            <div className="min-w-0">
                              <span
                                className="font-medium text-sm"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {item.botanicalName}
                              </span>
                              {item.botanicalNameHe && (
                                <span
                                  className="ml-2 text-xs"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {item.botanicalNameHe}
                                </span>
                              )}
                            </div>
                            <span
                              className="font-mono text-sm font-medium flex-shrink-0 ml-3"
                              style={{ color: 'var(--accent)' }}
                            >
                              {Math.round(item.amount)} ml
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total volume summary */}
                    <div
                      className="flex items-center justify-between py-2 px-3 rounded-lg mb-5"
                      style={{
                        background: 'var(--highlight-bg)',
                        borderTop: '2px solid var(--border)',
                      }}
                    >
                      <span
                        className="font-bold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Total Volume
                      </span>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: 'var(--accent)' }}
                      >
                        {Math.round(batch.totalVolume)} ml
                      </span>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/builder?from=${batch.id}`);
                      }}
                      className="btn-primary w-full text-sm"
                    >
                      Use as Starting Point
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
