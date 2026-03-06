import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

/**
 * GET /api/predict/[id]
 *
 * Reads the latest prediction for a given inverter.
 * The ML model teammate writes prediction documents to the
 * `predictions` collection in this format:
 * {
 *   inverterId: string,
 *   riskScore: number,          // 0–1 scale
 *   predictionWindow: string,   // e.g. "7 Days"
 *   confidence: number,         // 0–1
 *   predictedAt: Date,
 * }
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');

        // Get the most recent prediction for this inverter
        const prediction = await db
            .collection('predictions')
            .findOne(
                { inverterId: params.id },
                { sort: { predictedAt: -1 } }
            );

        if (!prediction) {
            return NextResponse.json(
                { error: 'No prediction found for this inverter' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            riskScore: prediction.riskScore,
            predictionWindow: prediction.predictionWindow,
            confidence: prediction.confidence,
        });
    } catch (error) {
        console.error('Error fetching prediction:', error);
        return NextResponse.json({ error: 'Failed to fetch prediction' }, { status: 500 });
    }
}
