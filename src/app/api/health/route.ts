import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import logger from '@/lib/logger';
import { env } from '@/lib/env';

export async function GET() {
    try {
        logger.info('Health check initiated');
        await dbConnect();
        logger.info('Database connection successful');

        return NextResponse.json({
            status: 'ok',
            env: env.NODE_ENV,
            message: 'System operational'
        });
    } catch (error) {
        logger.error('Health check failed', error);
        return NextResponse.json({ status: 'error' }, { status: 500 });
    }
}
