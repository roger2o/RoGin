import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { roundTo5 } from '@/lib/types';

// Drafts store the AI's ratios as ml using this placeholder Juniper base.
// When the user later loads the draft into the recipe editor and enters their
// real Juniper amount, the existing rescale logic converts these placeholder
// numbers into actual amounts.
const DRAFT_BASE_ML = 500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, items } = body as {
      name: string;
      description?: string;
      items: { botanicalName: string; botanicalNameHe: string; ratio: number }[];
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    const all = await prisma.botanical.findMany();
    const byName = new Map(all.map((b) => [b.name.toLowerCase(), b]));
    let nextSort =
      Math.max(0, ...all.map((b) => b.sortOrder)) + 1;

    const resolved: { botanicalId: number; amount: number }[] = [];
    for (const item of items) {
      const cleanName = item.botanicalName?.trim();
      if (!cleanName || !(item.ratio > 0)) continue;

      let bot = byName.get(cleanName.toLowerCase());
      if (!bot) {
        bot = await prisma.botanical.create({
          data: {
            name: cleanName,
            nameHe: item.botanicalNameHe?.trim() || '',
            sortOrder: nextSort++,
          },
        });
        byName.set(bot.name.toLowerCase(), bot);
      }

      const amount = roundTo5(item.ratio * DRAFT_BASE_ML);
      if (amount > 0) {
        resolved.push({ botanicalId: bot.id, amount });
      }
    }

    if (resolved.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 });
    }

    const totalVolume = resolved.reduce((sum, it) => sum + it.amount, 0);

    const batch = await prisma.batch.create({
      data: {
        name: name.trim(),
        date: new Date(),
        notes: (description || '').trim(),
        totalVolume,
        isDraft: true,
        items: { create: resolved },
      },
    });

    return NextResponse.json(
      { id: batch.id, name: batch.name },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to save draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}
