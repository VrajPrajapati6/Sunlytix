import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    // Root path now shows the landing page — no redirect needed
    return NextResponse.next();
}

export const config = {
    // Only match paths that need middleware processing
    matcher: [],
};
