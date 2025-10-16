'use client';

import { useEffect, useState } from 'react';

export function ClerkDebug() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const debugInfo = {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      keyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV,
      clerkLoaded: typeof window !== 'undefined' && !!(window as any).Clerk,
    };
    setInfo(debugInfo);
    console.log('🔍 Clerk Debug Info:', debugInfo);
  }, []);

  // Apenas mostrar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#1a1a2e',
      border: '2px solid #3b82f6',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxWidth: '400px',
      zIndex: 9999,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#3b82f6' }}>
        🔍 Clerk Debug
      </div>
      <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
        <div>
          <strong>Has Key:</strong> {info.hasPublishableKey ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Key Prefix:</strong> {info.keyPrefix || 'N/A'}
        </div>
        <div>
          <strong>Clerk Loaded:</strong> {info.clerkLoaded ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Environment:</strong> {info.nodeEnv}
        </div>
      </div>
    </div>
  );
}
