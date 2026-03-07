import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db('sunlytix');
    await db.collection('inverters').deleteMany({});
    await db.collection('telemetry').deleteMany({});
    await db.collection('insights').deleteMany({});
    return NextResponse.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
  }
}
