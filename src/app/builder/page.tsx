'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { roundTo5 } from '@/lib/types';
import type { BatchData, BotanicalData } from '@/lib/types';
import { WizardChat } from './WizardChat';

interface EditorItem {
  botanicalId: number;
  name: string;
  nameHe: string;
  amount: number;
  inputValue: string; // separate string state for controlled input
}

// ─── Step 1: Juniper Amount ───────────────────────────────────

function JuniperStep({
  juniperMl,
  onJuniperChange,
  onNext,
}: {
  juniperMl: string;
  onJuniperChange: (v: string) => void;
  onNext: () => void;
}) {
  const value = parseInt(juniperMl, 10);
  const valid = !isNaN(value) && value > 0;

  return (
    <div className="animate-fade-in-up">
      <div className="card p-6 md:p-8">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--accent)' }}
        >
          How much Juniper infusion?
        </h2>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Enter the total amount of Juniper + Lemon infusion you have ready (in
          ml). This drives all the other botanical amounts.
        </p>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            className="input text-2xl font-bold text-center"
            style={{ maxWidth: 200, fontSize: '1.5rem' }}
            placeholder="e.g. 500"
            value={juniperMl}
            onChange={(e) => onJuniperChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && valid) onNext();
            }}
            min={0}
            step={5}
            inputMode="numeric"
          />
          <span
            className="text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            ml
          </span>
        </div>
        <button
          className="btn-primary mt-6"
          disabled={!valid}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Choose Starting Point ────────────────────────────

function StartingPointStep({
  batches,
  loading,
  onSelectBatch,
  onWizard,
  onBack,
}: {
  batches: BatchData[];
  loading: boolean;
  onSelectBatch: (batch: BatchData) => void;
  onWizard: () => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-4 text-sm font-medium flex items-center gap-1"
        style={{ color: 'var(--accent)' }}
      >
        &larr; Back
      </button>

      <h2
        className="text-2xl font-bold mb-6"
        style={{ color: 'var(--accent)' }}
      >
        Choose a starting point
      </h2>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <button
          onClick={onWizard}
          className="card p-6 text-left"
        >
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--accent)' }}>
            New Recipe Wizard
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Let an AI gin distiller guide you through creating a brand new recipe
          </p>
        </button>
      </div>

      <h3
        className="text-lg font-bold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        Or start from a previous batch
      </h3>

      {loading ? (
        <div className="py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
          Loading batches...
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map((batch) => (
            <button
              key={batch.id}
              onClick={() => onSelectBatch(batch)}
              className="card p-4 text-left"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {batch.name}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {batch.date}
                </span>
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {batch.items
                  .slice(0, 4)
                  .map((i) => `${i.botanicalName} ${i.amount}ml`)
                  .join(', ')}
                {batch.items.length > 4 && ` +${batch.items.length - 4} more`}
              </div>
              {batch.notes && (
                <div
                  className="text-xs mt-1 italic"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {batch.notes}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Recipe Editor ────────────────────────────────────

function RecipeEditor({
  items,
  juniperMl,
  sourceBatchName,
  onItemChange,
  onItemBlur,
  onSave,
  onBack,
  saving,
  saved,
}: {
  items: EditorItem[];
  juniperMl: number;
  sourceBatchName: string;
  onItemChange: (idx: number, value: string) => void;
  onItemBlur: (idx: number) => void;
  onSave: (name: string, date: string, notes: string) => void;
  onBack: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [batchName, setBatchName] = useState('');
  const [batchDate, setBatchDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [batchNotes, setBatchNotes] = useState('');

  const totalVolume = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="animate-fade-in-up">
      <button
        onClick={onBack}
        className="mb-4 text-sm font-medium flex items-center gap-1"
        style={{ color: 'var(--accent)' }}
      >
        &larr; Back
      </button>

      <div className="flex flex-wrap items-baseline gap-3 mb-1">
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--accent)' }}
        >
          Recipe Editor
        </h2>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Based on: {sourceBatchName}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Juniper base: {juniperMl}ml. Adjust any botanical amount below.
      </p>

      {/* Botanical items */}
      <div className="grid gap-3 mb-6">
        {items.map((item, idx) => (
          <div
            key={item.botanicalId}
            className="card p-4 flex items-center justify-between gap-4"
            style={
              idx === 0
                ? {
                    borderColor: 'var(--accent)',
                    background: 'var(--highlight-bg)',
                  }
                : undefined
            }
          >
            <div className="flex-1 min-w-0">
              <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.name}
              </div>
              <div
                className="text-sm"
                style={{ color: 'var(--text-muted)', direction: 'rtl' }}
              >
                {item.nameHe}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {idx === 0 ? (
                <span
                  className="text-xl font-bold tabular-nums"
                  style={{ color: 'var(--accent)' }}
                >
                  {item.amount}
                </span>
              ) : (
                <input
                  type="number"
                  className="input text-center font-bold tabular-nums"
                  style={{
                    width: 90,
                    fontSize: '1.1rem',
                    padding: '0.5rem',
                  }}
                  value={item.inputValue}
                  onChange={(e) => onItemChange(idx, e.target.value)}
                  onBlur={() => onItemBlur(idx)}
                  min={0}
                  step={5}
                  inputMode="numeric"
                />
              )}
              <span
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                ml
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="card p-4 mb-8 flex justify-between items-center"
        style={{ background: 'var(--highlight-bg)' }}
      >
        <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
          Total Volume
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {totalVolume} ml
        </span>
      </div>

      {/* Save section */}
      {saved ? (
        <div
          className="card p-6 text-center"
          style={{ borderColor: 'var(--accent)' }}
        >
          <div
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--accent)' }}
          >
            Batch saved!
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your batch has been logged. You can view it in the Batch Log.
          </p>
        </div>
      ) : (
        <div className="card p-6">
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--accent)' }}
          >
            Save to Batch Log
          </h3>

          <div className="grid gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batch Name
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Batch 9"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Date
              </label>
              <input
                type="date"
                className="input"
                value={batchDate}
                onChange={(e) => setBatchDate(e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Tasting Notes
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="How did this batch turn out?"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              className="btn-primary"
              disabled={saving || !batchName.trim()}
              onClick={() => onSave(batchName.trim(), batchDate, batchNotes)}
            >
              {saving ? 'Saving...' : 'Save Batch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Builder (inner component that uses useSearchParams) ─

function BuilderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode');

  // Redirect to wizard page if mode=wizard
  // (Wizard is being built by another agent; this just preserves the link)
  // We still render the builder but with a wizard redirect note if needed.

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [juniperInput, setJuniperInput] = useState('');
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [botanicals, setBotanicals] = useState<BotanicalData[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null);
  const [editorItems, setEditorItems] = useState<EditorItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch batches and botanicals on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [batchRes, botRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/botanicals'),
        ]);
        const batchData = await batchRes.json();
        const botData = await botRes.json();
        setBatches(batchData);
        setBotanicals(botData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setBatchesLoading(false);
      }
    }
    fetchData();
  }, []);

  // Build editor items when a batch is selected
  const buildEditorItems = useCallback(
    (batch: BatchData, juniperMl: number): EditorItem[] => {
      // Find the Juniper item from the selected batch
      const juniperItem = batch.items.find((i) => i.botanicalId === 1);
      const batchJuniperAmount = juniperItem?.amount || 1;

      // Build items for all botanicals, using the batch ratios
      return botanicals.map((bot) => {
        if (bot.id === 1) {
          // Juniper is always the entered amount
          return {
            botanicalId: bot.id,
            name: bot.name,
            nameHe: bot.nameHe,
            amount: juniperMl,
            inputValue: String(juniperMl),
          };
        }

        const batchItem = batch.items.find((i) => i.botanicalId === bot.id);
        const amount = batchItem
          ? roundTo5((batchItem.amount / batchJuniperAmount) * juniperMl)
          : 0;

        return {
          botanicalId: bot.id,
          name: bot.name,
          nameHe: bot.nameHe,
          amount,
          inputValue: String(amount),
        };
      });
    },
    [botanicals]
  );

  const handleSelectBatch = (batch: BatchData) => {
    const juniperMl = parseInt(juniperInput, 10);
    setSelectedBatch(batch);
    setEditorItems(buildEditorItems(batch, juniperMl));
    setSaved(false);
    setStep(3);
  };

  const handleItemChange = (idx: number, value: string) => {
    setEditorItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], inputValue: value };
      // Update amount in real time for total calculation
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        next[idx].amount = parsed;
      }
      return next;
    });
  };

  const handleItemBlur = (idx: number) => {
    setEditorItems((prev) => {
      const next = [...prev];
      const parsed = parseInt(next[idx].inputValue, 10);
      const snapped = isNaN(parsed) || parsed < 0 ? 0 : roundTo5(parsed);
      next[idx] = {
        ...next[idx],
        amount: snapped,
        inputValue: String(snapped),
      };
      return next;
    });
  };

  const handleSave = async (name: string, date: string, notes: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          date,
          notes,
          items: editorItems
            .filter((item) => item.amount > 0)
            .map((item) => ({
              botanicalId: item.botanicalId,
              amount: item.amount,
            })),
        }),
      });

      if (!res.ok) {
        throw new Error('Save failed');
      }

      setSaved(true);
    } catch (err) {
      console.error('Failed to save batch:', err);
      alert('Failed to save batch. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle ?from=batchId — auto-select a batch from the log
  const fromBatchId = searchParams.get('from');
  useEffect(() => {
    if (fromBatchId && batches.length > 0 && botanicals.length > 0 && step === 1) {
      const batch = batches.find((b) => b.id === parseInt(fromBatchId, 10));
      if (batch) {
        setSelectedBatch(batch);
        // Pre-fill juniper amount from the batch
        const juniperItem = batch.items.find((i) => i.botanicalId === 1);
        const juniperMl = juniperItem?.amount || 500;
        setJuniperInput(String(juniperMl));
        setEditorItems(buildEditorItems(batch, juniperMl));
        setSaved(false);
        setStep(3);
      }
    }
  }, [fromBatchId, batches, botanicals, step, buildEditorItems]);

  // Handle wizard generating a recipe
  const handleWizardRecipe = useCallback(
    (items: { botanicalName: string; botanicalNameHe: string; ratio: number }[]) => {
      const juniperMl = parseInt(juniperInput, 10) || 500;
      // Build editor items from wizard output
      const wizardEditorItems: EditorItem[] = botanicals.map((bot) => {
        if (bot.id === 1) {
          return {
            botanicalId: bot.id,
            name: bot.name,
            nameHe: bot.nameHe,
            amount: juniperMl,
            inputValue: String(juniperMl),
          };
        }
        const wizardItem = items.find(
          (i) => i.botanicalName.toLowerCase() === bot.name.toLowerCase()
        );
        const amount = wizardItem ? roundTo5(wizardItem.ratio * juniperMl) : 0;
        return {
          botanicalId: bot.id,
          name: bot.name,
          nameHe: bot.nameHe,
          amount,
          inputValue: String(amount),
        };
      });

      // Add any new botanicals the wizard suggested that aren't in our library
      for (const item of items) {
        const exists = botanicals.some(
          (b) => b.name.toLowerCase() === item.botanicalName.toLowerCase()
        );
        if (!exists && item.ratio > 0) {
          wizardEditorItems.push({
            botanicalId: -1, // placeholder for new botanical
            name: item.botanicalName,
            nameHe: item.botanicalNameHe,
            amount: roundTo5(item.ratio * juniperMl),
            inputValue: String(roundTo5(item.ratio * juniperMl)),
          });
        }
      }

      setSelectedBatch({ id: 0, name: 'Wizard Recipe', date: '', totalVolume: 0, notes: '', recipeId: null, recipeName: null, items: [] });
      setEditorItems(wizardEditorItems);
      setSaved(false);
      setStep(3);
    },
    [juniperInput, botanicals]
  );

  // If mode=wizard, show the wizard chat
  if (mode === 'wizard') {
    const juniperMl = parseInt(juniperInput, 10);
    // If no juniper amount entered yet, ask for it first
    if (!juniperMl || juniperMl <= 0) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push('/builder')}
            className="mb-4 text-sm font-medium flex items-center gap-1"
            style={{ color: 'var(--accent)' }}
          >
            &larr; Back to Builder
          </button>
          <JuniperStep
            juniperMl={juniperInput}
            onJuniperChange={setJuniperInput}
            onNext={() => {
              // Stay on wizard mode after entering Juniper amount
            }}
          />
          {parseInt(juniperInput, 10) > 0 && (
            <div className="mt-4 text-center">
              <button
                className="btn-primary"
                onClick={() => {
                  // Force re-render by updating state — wizard will now render
                  setJuniperInput(juniperInput);
                }}
              >
                Start Wizard
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8" style={{ height: 'calc(100vh - 56px)' }}>
        <button
          onClick={() => router.push('/builder')}
          className="mb-4 text-sm font-medium flex items-center gap-1"
          style={{ color: 'var(--accent)' }}
        >
          &larr; Back to Builder
        </button>
        <div style={{ height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column' }}>
          <WizardChat
            juniperAmount={juniperMl}
            onRecipeGenerated={handleWizardRecipe}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background:
                  step >= s ? 'var(--accent)' : 'var(--highlight-bg)',
                color: step >= s ? '#FFFFFF' : 'var(--text-muted)',
                border:
                  step >= s
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border)',
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className="w-8 h-0.5"
                style={{
                  background:
                    step > s ? 'var(--accent)' : 'var(--border)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <JuniperStep
          juniperMl={juniperInput}
          onJuniperChange={setJuniperInput}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StartingPointStep
          batches={batches}
          loading={batchesLoading}
          onSelectBatch={handleSelectBatch}
          onWizard={() => router.push('/builder?mode=wizard')}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && selectedBatch && (
        <RecipeEditor
          items={editorItems}
          juniperMl={parseInt(juniperInput, 10)}
          sourceBatchName={selectedBatch.name}
          onItemChange={handleItemChange}
          onItemBlur={handleItemBlur}
          onSave={handleSave}
          onBack={() => setStep(2)}
          saving={saving}
          saved={saved}
        />
      )}
    </div>
  );
}

// ─── Page wrapper with Suspense for useSearchParams ───────────

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="py-12 text-center" style={{ color: 'var(--text-secondary)' }}>
            Loading...
          </div>
        </div>
      }
    >
      <BuilderInner />
    </Suspense>
  );
}
