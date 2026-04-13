import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = parseInt(id, 10);

    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        items: {
          include: { botanical: true },
          orderBy: { botanical: { sortOrder: 'asc' } },
        },
        recipe: { select: { id: true, name: true } },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: batch.id,
      name: batch.name,
      date: batch.date.toISOString().split('T')[0],
      totalVolume: batch.totalVolume,
      notes: batch.notes,
      recipeId: batch.recipe?.id ?? null,
      recipeName: batch.recipe?.name ?? null,
      items: batch.items.map((item) => ({
        botanicalId: item.botanicalId,
        botanicalName: item.botanical.name,
        botanicalNameHe: item.botanical.nameHe,
        amount: item.amount,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = parseInt(id, 10);

    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    const body = await request.json();
    const { notes } = body;

    if (typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes must be a string' }, { status: 400 });
    }

    if (notes.length > 2000) {
      return NextResponse.json({ error: 'Notes too long (max 2000 chars)' }, { status: 400 });
    }

    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: { notes },
    });

    return NextResponse.json({ id: updated.id, notes: updated.notes });
  } catch (error) {
    console.error('Failed to update batch:', error);
    return NextResponse.json(
      { error: 'Failed to update batch' },
      { status: 500 }
    );
  }
}
