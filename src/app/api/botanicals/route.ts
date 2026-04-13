import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const botanicals = await prisma.botanical.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(botanicals);
  } catch (error) {
    console.error('Failed to fetch botanicals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch botanicals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameHe } = body as { name: string; nameHe?: string };

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Botanical name is required' },
        { status: 400 }
      );
    }

    // Find the highest sortOrder so the new botanical goes at the end
    const last = await prisma.botanical.findFirst({ orderBy: { sortOrder: 'desc' } });
    const sortOrder = (last?.sortOrder ?? 0) + 1;

    const botanical = await prisma.botanical.create({
      data: {
        name: name.trim(),
        nameHe: nameHe?.trim() || '',
        sortOrder,
      },
    });

    return NextResponse.json(botanical, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A botanical with that name already exists' },
        { status: 409 }
      );
    }
    console.error('Failed to create botanical:', error);
    return NextResponse.json(
      { error: 'Failed to create botanical' },
      { status: 500 }
    );
  }
}
