import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: address }
    });

    if (!user) {
      return NextResponse.json({ proposal: null });
    }

    // Find the most recent active intent for this user
    const activeIntent = await prisma.proposal.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ proposal: activeIntent });

  } catch (error: any) {
    console.error("Active Intent Fetch Error:", error.message);
    // If database is locked/sleeping, fail gracefully so the UI doesn't crash
    return NextResponse.json({ proposal: null }); 
  }
}