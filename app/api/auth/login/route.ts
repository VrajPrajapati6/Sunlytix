import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // User not found or incorrect password
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return NextResponse.json({
                error: 'Invalid email or password.',
                showForgotPassword: true
            }, { status: 401 });
        }

        // Email not verified
        if (!user.email_verified) {
            return NextResponse.json({
                error: 'Please verify your email before logging in.',
                unverified: true
            }, { status: 403 });
        }

        // Success - create JWT
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: '1d',
        });

        // Set cookie
        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return NextResponse.json({ message: 'Login successful' }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
