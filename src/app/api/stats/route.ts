import { NextResponse } from 'next/server';
// Swapped the '@' shortcut for the exact relative path!
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const aggregations = await prisma.user.aggregate({
      _sum: { wldBalance: true },
    });

    // Genuine baseline: Starting with the Founder and your initial 100 WLD!
    const baseUsers = 1;
    const baseWld = 100;

    const totalUsers = baseUsers + userCount;
    const totalWld = baseWld + (aggregations._sum.wldBalance || 0);

    return NextResponse.json({ totalUsers, totalWld });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ totalUsers: 1, totalWld: 100 });
  }
}