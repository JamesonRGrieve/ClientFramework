import { NextResponse } from 'next/server';

const RUNTIME_CONFIG_KEY = '__RUNTIME_CONFIG__';

type RuntimeConfig = Record<string, unknown>;

export function GET(): NextResponse {
  const runtimeGlobal = globalThis as typeof globalThis & Record<string, RuntimeConfig | undefined>;
  return NextResponse.json(runtimeGlobal[RUNTIME_CONFIG_KEY] ?? {});
}
