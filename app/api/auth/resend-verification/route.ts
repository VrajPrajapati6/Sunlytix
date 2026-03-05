import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Missing email' }, { status: 400 });
        }

        console.log('Resend request for:', email);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('User not found:', email);
            return NextResponse.json({ message: 'If an account exists, a new verification link has been sent.' });
        }

        if (user.email_verified) {
            console.log('User already verified:', email);
            return NextResponse.json({ message: 'Email is already verified.' });
        }

        // Rate limiting: 60 seconds between resends
        const now = new Date();
        const lastSent = (user as any).last_verification_sent;
        console.log('Checking rate limit for:', email, 'Last sent:', lastSent);

        if (lastSent && (now.getTime() - new Date(lastSent).getTime() < 60000)) {
            const waitSeconds = Math.ceil((60000 - (now.getTime() - new Date(lastSent).getTime())) / 1000);
            return NextResponse.json({ error: `Please wait ${waitSeconds} seconds before requesting another link.` }, { status: 429 });
        }

        const verification_token = crypto.randomBytes(32).toString('hex');

        console.log('Updating user with new token...');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verification_token,
                last_verification_sent: now,
            } as any, // Cast to any to bypass potential stale lint
        });

        console.log('Sending email...');
        await sendVerificationEmail(email, verification_token);
        console.log('Resend success!');

        return NextResponse.json({ message: 'A new verification link has been sent.' });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
