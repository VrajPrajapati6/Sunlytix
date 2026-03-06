import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');

        // Returns insights sorted by most recent first
        const insights = await db
            .collection('insights')
            .find({})
            .sort({ timestamp: -1 })
            .toArray();

        return NextResponse.json(insights);
    } catch (error) {
        console.error('Error fetching insights:', error);
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }
}
