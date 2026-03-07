import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');
        const inverters = await db.collection('inverters').find({}).toArray();
        return NextResponse.json(inverters);
    } catch (error) {
        console.error('Error fetching inverters:', error);
        return NextResponse.json({ error: 'Failed to fetch inverters' }, { status: 500 });
    }
}
