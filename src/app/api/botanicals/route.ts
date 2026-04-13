import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
