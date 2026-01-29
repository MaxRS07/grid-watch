import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { events, playerId } = await request.json();

        // Create debug directory if it doesn't exist
        const debugDir = join(process.cwd(), 'debug');
        await mkdir(debugDir, { recursive: true });

        // Write events to file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `events-${playerId}-${timestamp}.json`;
        const filepath = join(debugDir, filename);

        await writeFile(filepath, JSON.stringify(events, null, 2));

        console.log(`Events saved to ${filepath}`);

        return NextResponse.json({
            success: true,
            filename,
            path: filepath,
            eventCount: Object.values(events).reduce((sum: number, arr: any) => sum + arr.length, 0),
        });
    } catch (error) {
        console.error('Error saving events:', error);
        return NextResponse.json(
            { success: false, error: (error as Error).message },
            { status: 500 }
        );
    }
}
