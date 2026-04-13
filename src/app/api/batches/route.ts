import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        items: {
          include: { botanical: true },
          orderBy: { botanical: { sortOrder: 'asc' } },
        },
        recipe: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const result = batches.map((b) => ({
      id: b.id,
      name: b.name,
      date: b.date.toISOString().split('T')[0],
      totalVolume: b.totalVolume,
      notes: b.notes,
      recipeId: b.recipe?.id ?? null,
      recipeName: b.recipe?.name ?? null,
      items: b.items.map((item) => ({
        botanicalId: item.botanicalId,
        botanicalName: item.botanical.name,
        botanicalNameHe: item.botanical.nameHe,
        amount: item.amount,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, date, notes, items } = body as {
      name: string;
      date: string;
      notes: string;
      items: { botanicalId: number; amount: number }[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one botanical item is required' },
        { status: 400 }
      );
    }

    const totalVolume = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

    const batch = await prisma.batch.create({
      data: {
        name: name || '',
        date: new Date(date),
        notes: notes || '',
        totalVolume,
        items: {
          create: items
            .filter((item: { amount: number }) => item.amount > 0)
            .map((item: { botanicalId: number; amount: number }) => ({
              botanicalId: item.botanicalId,
              amount: item.amount,
            })),
        },
      },
      include: {
        items: {
          include: { botanical: true },
          orderBy: { botanical: { sortOrder: 'asc' } },
        },
      },
    });

    return NextResponse.json({
      id: batch.id,
      name: batch.name,
      date: batch.date.toISOString().split('T')[0],
      totalVolume: batch.totalVolume,
      notes: batch.notes,
      recipeId: null,
      recipeName: null,
      items: batch.items.map((item) => ({
        botanicalId: item.botanicalId,
        botanicalName: item.botanical.name,
        botanicalNameHe: item.botanical.nameHe,
        amount: item.amount,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
