import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.redirect(new URL('/login?error=Missing+token', req.url));
        }

        const user = await prisma.user.findFirst({ where: { verification_token: token } });

        if (!user) {
            return NextResponse.redirect(new URL('/login?error=Invalid+or+expired+token', req.url));
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email_verified: true,
                verification_token: null, // Clear token after use
            },
        });

        return NextResponse.redirect(new URL('/login?verified=true', req.url));
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
