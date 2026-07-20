'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, ReactNode } from 'react';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🚨 CRITICAL: Look at your phone's Developer Settings screen.
    // Replace the string below with your EXACT App ID!
    MiniKit.install('app_dedd1afaa8a8e8f839438c78814b996f'); 
  }, []);

  return <>{children}</>;
}