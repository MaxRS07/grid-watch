import { PlayerValorantAnalysis } from '@/lib/grid/playerAnalysisTypes';
import { formatPlayerAnalysisForLLMCompact } from '@/lib/grid/playerAnalysis';

export interface ParsedAnalysis {
    strengths: string[];
    weaknesses: string[];
    overview: string;
    rawText: string;
}

/**
 * Parse the AI response into structured sections
 */
export function parseAnalysisResponse(text: string): ParsedAnalysis {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let overview = '';

    // Split by section headers
    const strengthsMatch = text.match(/STRENGTHS:\s*([\s\S]*?)(?=WEAKNESSES:|$)/i);
    const weaknessesMatch = text.match(/WEAKNESSES:\s*([\s\S]*?)(?=OVERVIEW:|$)/i);
    const overviewMatch = text.match(/OVERVIEW:\s*([\s\S]*?)$/i);

    // Parse strengths
    if (strengthsMatch) {
        const bulletPoints = strengthsMatch[1].match(/^[\s]*[•\-*]\s+(.+?)$/gm);
        if (bulletPoints) {
            strengths.push(
                ...bulletPoints.map(point =>
                    point.replace(/^[\s]*[•\-*]\s+/, '').trim()
                )
            );
        }
    }

    // Parse weaknesses
    if (weaknessesMatch) {
        const bulletPoints = weaknessesMatch[1].match(/^[\s]*[•\-*]\s+(.+?)$/gm);
        if (bulletPoints) {
            weaknesses.push(
                ...bulletPoints.map(point =>
                    point.replace(/^[\s]*[•\-*]\s+/, '').trim()
                )
            );
        }
    }

    // Parse overview
    if (overviewMatch) {
        overview = overviewMatch[1].trim();
    }

    return {
        strengths,
        weaknesses,
        overview,
        rawText: text,
    };
}

/**
 * Fetch AI analysis from the Gemini API with streaming support
 * @param analysis - Player analysis data to send for review
 * @param onChunk - Callback function called with each streamed chunk
 * @param onError - Callback function called if an error occurs
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves when streaming completes
 */
export async function getPlayerAnalysis(
    analysis: PlayerValorantAnalysis,
    onChunk: (chunk: string) => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal
): Promise<void> {
    let abortController: AbortController | null = null;

    try {
        // Format the analysis data for LLM consumption (compact format)
        const formattedData = formatPlayerAnalysisForLLMCompact(analysis);

        // Create abort controller if not provided
        if (!signal) {
            abortController = new AbortController();
            signal = abortController.signal;
        }

        // Set a timeout (30 seconds)
        const timeoutId = setTimeout(() => {
            abortController?.abort();
        }, 30000);

        console.log('[AI Analysis] Starting request for player:', analysis.playerId);

        // Fetch from the API with streaming
        const response = await fetch('/api/analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerData: formattedData,
                playerId: analysis.playerId,
                playerName: analysis.playerName,
                timestamp: new Date().toISOString(),
            }),
            signal,
        });

        clearTimeout(timeoutId);

        console.log('[AI Analysis] Response received:', response.status, response.statusText);

        // Check for HTTP errors
        if (!response.ok) {
            let errorMessage = `API error: ${response.status} ${response.statusText}`;

            // Try to parse error details from response
            try {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                } else {
                    const text = await response.text();
                    errorMessage = text || errorMessage;
                }
            } catch (parseErr) {
            }

            throw new Error(errorMessage);
        }

        // Validate response has a body
        if (!response.body) {
            throw new Error('No response stream available - API may not support streaming');
        }

        console.log('[AI Analysis] Starting to stream response...');

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let chunkCount = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log(`[AI Analysis] Stream complete. Total chunks: ${chunkCount}`);
                    // Process any remaining buffer
                    if (buffer.trim()) {
                        onChunk(buffer);
                    }
                    break;
                }

                if (!value) continue;

                // Decode chunk
                const text = decoder.decode(value, { stream: true });
                buffer += text;
                chunkCount++;

                console.log(`[AI Analysis] Received chunk ${chunkCount}: ${text.length} characters`);

                // Send the buffered content
                if (buffer.length > 0) {
                    onChunk(buffer);
                    buffer = '';
                }
            }
        } finally {
            reader.releaseLock();
        }

        console.log('[AI Analysis] Successfully completed analysis');
    } catch (error) {
        // Don't treat abort as an error if it was intentional
        if (error instanceof Error && error.name === 'AbortError') {
            console.warn('[AI Analysis] Request was cancelled');
            return;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[AI Analysis] Error:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
        });
        onError?.(err);
        throw err;
    }
}

/**
 * Fetch AI analysis and accumulate the full response
 * Simpler version if you want to wait for the complete analysis
 * @param analysis - Player analysis data to send for review
 * @returns Promise resolving to the complete analysis text
 */
export async function getPlayerAnalysisComplete(
    analysis: PlayerValorantAnalysis
): Promise<string> {
    return new Promise((resolve, reject) => {
        let fullResponse = '';

        getPlayerAnalysis(
            analysis,
            (chunk) => {
                fullResponse += chunk;
            },
            (error) => {
                reject(error);
            }
        )
            .then(() => resolve(fullResponse))
            .catch(reject);
    });
}

/**
 * Fetch AI analysis with progress callback
 * Useful for tracking analysis generation progress
 * @param analysis - Player analysis data
 * @param onProgress - Callback with progress updates
 * @returns Promise resolving to complete analysis text
 */
export async function getPlayerAnalysisWithProgress(
    analysis: PlayerValorantAnalysis,
    onProgress?: (progress: { chunksReceived: number; text: string }) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        let fullResponse = '';
        let chunksReceived = 0;

        getPlayerAnalysis(
            analysis,
            (chunk) => {
                // Accumulate the chunk to the full response
                fullResponse += chunk;
                chunksReceived++;

                console.log(`[Progress] Chunk ${chunksReceived}: "${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}"`);

                // Callback with the accumulated text (not just the chunk)
                onProgress?.({
                    chunksReceived,
                    text: fullResponse,
                });
            },
            (error) => {
                reject(error);
            }
        )
            .then(() => resolve(fullResponse))
            .catch(reject);
    });
}
