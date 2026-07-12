import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { walletAddress, termsAccepted } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    // Upsert the user: Create them if they are new, update them if they exist
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { 
        termsAccepted,
        termsAcceptedAt: new Date(),
        // 🚨 SEEDING REAL BALANCE: Ensures the AI knows you have exactly 95.07 WLD to deploy
        wldBalance: 95.07
      },
      create: {
        worldId: `beta-${walletAddress.slice(0, 8)}`,
        walletAddress,
        termsAccepted,
        termsAcceptedAt: new Date(),
        wldBalance: 95.07
      }
    });

    return NextResponse.json({ status: 'success', user });
  } catch (error: any) {
    console.error('User Registration Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}