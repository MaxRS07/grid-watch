export const runtime = 'nodejs';

import { GoogleGenAI } from "@google/genai"

const GEMINI_API_KEY = process.env.GEMINI_KEY;
const MODEL = 'gemini-2.5-flash-lite';

export async function POST(req: Request) {
    try {
        // Validate API key
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_KEY is not set');
            return new Response(
                JSON.stringify({ error: "GEMINI_KEY is not configured in environment variables" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Parse request body
        let body: any;
        try {
            const text = await req.text();

            // Check payload size (warn at 1MB, error at 5MB)
            const sizeInMB = Buffer.byteLength(text, 'utf8') / (1024 * 1024);
            if (sizeInMB > 5) {
                console.error(`Request body too large: ${sizeInMB.toFixed(2)}MB`);
                return new Response(
                    JSON.stringify({ error: "Request payload too large. Try analyzing fewer games or a shorter time window." }),
                    { status: 413, headers: { "Content-Type": "application/json" } }
                );
            }
            if (sizeInMB > 1) {
                console.warn(`Large request body: ${sizeInMB.toFixed(2)}MB`);
            }

            body = JSON.parse(text);
        } catch (error) {
            console.error('Failed to parse request body:', error);
            return new Response(
                JSON.stringify({ error: "Invalid JSON in request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate body
        if (!body) {
            console.error('Request body is empty');
            return new Response(
                JSON.stringify({ error: "Request body is empty" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Initialize Gemini client
        let genai: GoogleGenAI;
        try {
            genai = new GoogleGenAI({
                apiKey: GEMINI_API_KEY,
            });
        } catch (error) {
            console.error('Failed to initialize Gemini client:', error);
            return new Response(
                JSON.stringify({ error: "Failed to initialize AI service" }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Create system prompt
        const systemInstruction = `You are an expert Valorant scouting analyst. Analyze the provided player performance data and generate a concise scouting report in the following format:

STRENGTHS:
• [1-2 line strength with specific stat reference]
• [1-2 line strength with specific stat reference]
• [1-2 line strength with specific stat reference]

WEAKNESSES:
• [1-2 line weakness with specific stat reference]
• [1-2 line weakness with specific stat reference]
• [1-2 line weakness with specific stat reference]

OVERVIEW:
[2-3 sentence overall assessment of player skill level, playstyle, and potential]

Be concise, specific with statistics, and actionable in your feedback.`;

        console.log('Starting AI analysis for player:', body.playerId);

        // Create a custom streaming response
        let textContent = '';
        const chunks: string[] = [];

        try {
            console.log('Calling Gemini API...');
            const response = await genai.models.generateContentStream({
                model: MODEL,
                contents: [
                    {
                        role: "user",
                        parts: [{ text: JSON.stringify(body) }],
                    },
                ],
                config: {
                    systemInstruction,
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            });

            console.log('Streaming response from Gemini...');
            let chunkCount = 0;

            // Collect all chunks as they arrive
            for await (const chunk of response) {
                if (chunk.text) {
                    chunkCount++;
                    console.log(`Received chunk ${chunkCount}: ${chunk.text.length} characters`);
                    chunks.push(chunk.text);
                    textContent += chunk.text;
                }
            }

            console.log(`Finished streaming. Total chunks: ${chunkCount}`);

        } catch (streamError) {
            const errorMessage = streamError instanceof Error ? streamError.message : 'Unknown streaming error';
            const errorStack = streamError instanceof Error ? streamError.stack : '';
            console.error('Stream generation error:', {
                message: errorMessage,
                stack: errorStack,
                error: streamError,
            });
            throw streamError;
        }

        // Create a proper streaming response that sends chunks one at a time
        const encoder = new TextEncoder();
        let streamIndex = 0;

        const stream = new ReadableStream({
            pull(controller) {
                if (streamIndex < chunks.length) {
                    const chunk = chunks[streamIndex];
                    console.log(`Enqueuing chunk ${streamIndex + 1}/${chunks.length}: ${chunk.length} characters`);
                    controller.enqueue(encoder.encode(chunk));
                    streamIndex++;
                } else if (streamIndex === chunks.length) {
                    console.log('Stream complete, closing controller');
                    controller.close();
                    streamIndex++;
                }
            }
        });

        return new Response(stream, {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Transfer-Encoding": "chunked",
            },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : '';
        console.error('Analysis API error:', {
            message: errorMessage,
            stack: errorStack,
            error: error,
        });

        return new Response(
            JSON.stringify({
                error: "Failed to generate analysis",
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}