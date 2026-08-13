// SPDX-License-Identifier: AGPL-3.0-or-later
import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
