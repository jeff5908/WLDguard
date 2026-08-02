import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { walletAddress, intentData, signature } = await req.json();

    if (!walletAddress || !intentData || !signature) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // 1. Find the User ID associated with this wallet
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // 2. Save the Intent with the Cryptographic Signature (Legal Proof)
    const newProposal = await prisma.proposal.create({
      data: {
        userId: user.id,
        type: intentData.type,
        targetPrice: intentData.targetPrice,
        description: intentData.description,
        expectedYield: intentData.expectedYield,
        signature: signature, // The mathematical proof they pushed the button!
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ status: 'success', proposal: newProposal });

  } catch (error: any) {
    console.error("Failed to save intent:", error.message);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}