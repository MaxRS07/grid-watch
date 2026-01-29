import { NextRequest } from "next/server";
import { DownloadList } from "@/types/file";

const GRID_API_URL = 'https://api.grid.gg/file-download/list/';
const GRID_API_KEY = process.env.GRID_KEY;

if (!GRID_API_KEY) {
    throw new Error("GRID_KEY is not set in your environment variables!");
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    const seriesId = searchParams.get('seriesId');
    const download = searchParams.get('download');
    const fileType = searchParams.get('fileType');

    if (!seriesId) {
        return new Response('Missing seriesId parameter', { status: 400 });
    }

    try {
        if (download === 'true') {
            // Download endpoint: fetch the file list and download the files
            return await downloadFiles(seriesId!, fileType!);
        } else {
            // List endpoint: return the DownloadList
            return await getFileList(seriesId!);
        }
    } catch (error) {
        console.error(error);
        return new Response('Error fetching files', { status: 500 });
    }
}

async function getFileList(seriesId: string): Promise<Response> {
    const headers = {
        'Accept': 'application/json',
        'x-api-key': GRID_API_KEY!,
    };

    const res = await fetch(`${GRID_API_URL}${seriesId}`, {
        method: 'GET',
        headers
    });

    if (!res.ok) {
        return new Response(`Backend API error: ${res.status}`, { status: res.status });
    }

    const data = await res.json() as DownloadList;
    return Response.json(data);
}

async function downloadFiles(seriesId: string, endpoint: string): Promise<Response> {
    const headers = {
        'Accept': 'application/json',
        'x-api-key': GRID_API_KEY!,
    };

    // Fetch the zipped JSONL file directly from Grid
    const res = await fetch(`https://api.grid.gg/file-download/${endpoint}/grid/series/${seriesId}`, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        return new Response(`Backend API error: ${res.status}`, { status: res.status });
    }

    // Get the zip as an ArrayBuffer
    const zipBuffer = await res.arrayBuffer();

    // Return the zip directly to the client
    return new Response(zipBuffer, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="series-${seriesId}.zip"`,
        },
    });
}
