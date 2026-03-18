/**
 * Health Check Endpoint
 *
 * Verifica a saúde da aplicação e suas dependências.
 * Útil para monitoramento e load balancers.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV,
  };

  try {
    // Verificar conexão com banco de dados
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    // Tudo OK
    return NextResponse.json(
      {
        status: 'healthy',
        checks,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    // Banco de dados com problema
    return NextResponse.json(
      {
        status: 'unhealthy',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
