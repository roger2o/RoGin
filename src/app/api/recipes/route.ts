import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        items: {
          include: { botanical: true },
          orderBy: { botanical: { sortOrder: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = recipes.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
      items: r.items.map((item) => ({
        botanicalId: item.botanicalId,
        botanicalName: item.botanical.name,
        botanicalNameHe: item.botanical.nameHe,
        ratio: item.ratio,
        amount: 0, // Recipes store ratios, not amounts
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
