import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');

        // Returns time-series telemetry for a given inverter, sorted by time ascending
        const telemetry = await db
            .collection('telemetry')
            .find({ inverterId: params.id })
            .sort({ time: 1 })
            .toArray();

        return NextResponse.json(telemetry);
    } catch (error) {
        console.error('Error fetching telemetry:', error);
        return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
    }
}
