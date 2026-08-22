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
      return NextResponse.json({ receipt: null });
    }

    // Find the most recently executed intent for this user
    const executedIntent = await prisma.proposal.findFirst({
      where: {
        userId: user.id,
        status: 'EXECUTED_ON_CHAIN'
      },
      orderBy: { updatedAt: 'desc' } // Get the newest one
    });

    return NextResponse.json({ receipt: executedIntent });

  } catch (error: any) {
    console.error("Receipt Fetch Error:", error.message);
    return NextResponse.json({ receipt: null }); 
  }
}