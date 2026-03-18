declare module '@ducanh2912/next-pwa' {
  import type { NextConfig } from 'next';

  type PWAOptions = {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    [key: string]: any;
  };

  type WithPWA = (options?: PWAOptions) => (config?: NextConfig) => NextConfig;

  const withPWA: WithPWA;
  export default withPWA;
}
