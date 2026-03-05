import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { name, email: rawEmail, password } = await req.json();
        const email = rawEmail?.toLowerCase().trim();
        console.log('Starting signup for:', email);

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const verification_token = crypto.randomBytes(32).toString('hex');

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password_hash,
                verification_token,
                last_verification_sent: new Date(),
            },
        });

        try {
            await sendVerificationEmail(email, verification_token);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        return NextResponse.json(
            { message: 'User created successfully. Please check your email to verify your account.' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
