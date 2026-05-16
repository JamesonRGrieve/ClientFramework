import { NextResponse } from 'next/server';

export async function GET(_request) {
  return NextResponse.json(global.__RUNTIME_CONFIG__ || {});
}
