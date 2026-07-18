'use client';
import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, ReactNode } from 'react';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🚨 Activating the official hardware bridge using your real App ID!
    MiniKit.install('app_dedd1afaa8a8e8f839438c78814b996f'); 
  }, []);

  return <>{children}</>;
}