import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

const PYTHON_API_URL = process.env.PYTHON_API_URL ?? 'http://localhost:8000';

/**
 * GET /api/predict/[id]
 *
 * 1. Fetches latest features from MongoDB `inverter_features`
 * 2. Calls FastAPI /predict
 * 3. Saves result to `predictions` collection
 * 4. Returns { riskScore, predictionWindow, confidence, status }
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db('sunlytix');

        // 1. Get feature snapshot for this inverter
        const featureDoc = await db
            .collection('inverter_features')
            .findOne({ inverterId: params.id });

        if (!featureDoc) {
            return NextResponse.json(
                { error: `No feature data found for inverter ${params.id}` },
                { status: 404 }
            );
        }

        // 2. Strip Mongo internals; pass all remaining fields + inverter_id
        const { _id, inverterId, seededAt, ...features } = featureDoc;

        const payload = { inverter_id: params.id, ...features };

        // 3. Call FastAPI
        const mlRes = await fetch(`${PYTHON_API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!mlRes.ok) {
            const err = await mlRes.text();
            console.error('[predict] FastAPI error:', err);
            return NextResponse.json(
                { error: `ML service error: ${mlRes.status}` },
                { status: 502 }
            );
        }

        const result = await mlRes.json();

        // 4. Persist prediction to MongoDB
        await db.collection('predictions').updateOne(
            { inverterId: params.id },
            {
                $set: {
                    inverterId:       params.id,
                    riskScore:        result.risk_score,
                    predictionWindow: result.prediction_window,
                    confidence:       result.confidence,
                    status:           result.status,
                    predictedAt:      new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({
            riskScore:        result.risk_score,
            predictionWindow: result.prediction_window,
            confidence:       result.confidence,
            status:           result.status,
        });
    } catch (error) {
        console.error('[predict] Error:', error);
        return NextResponse.json({ error: 'Failed to run prediction' }, { status: 500 });
    }
}
