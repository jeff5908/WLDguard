'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, ReactNode } from 'react';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🚨 CRITICAL: The hardware bridge will return 'null' if this is missing or incorrect.
    // Replace 'app_YOUR_REAL_ID_HERE' with your actual App ID from the developer portal!
    MiniKit.install('app_dedd1afaa8a8e8f839438c78814b996f'); 
  }, []);

  return <>{children}</>;
}