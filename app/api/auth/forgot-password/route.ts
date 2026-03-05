import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // We don't want to leak if an email exists, so we always return success
        if (user) {
            const reset_token = crypto.randomBytes(32).toString('hex');
            const reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    reset_token,
                    reset_token_expires,
                },
            });

            try {
                await sendPasswordResetEmail(email, reset_token);
            } catch (error) {
                console.error('Failed to send reset email:', error);
            }
        }

        return NextResponse.json(
            { message: 'If an account with that email exists, we have sent a password reset link.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
