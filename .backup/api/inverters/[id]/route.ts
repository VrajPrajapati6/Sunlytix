import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');
        const inverter = await db.collection('inverters').findOne({ id: params.id });

        if (!inverter) {
            return NextResponse.json({ error: 'Inverter not found' }, { status: 404 });
        }

        return NextResponse.json(inverter);
    } catch (error) {
        console.error('Error fetching inverter:', error);
        return NextResponse.json({ error: 'Failed to fetch inverter' }, { status: 500 });
    }
}
