import { FlatEvent } from '@/lib/grid/seriesAnalysis';

interface TimelineEventProps {
    event: FlatEvent;
    position: number; // 0-100 percentage
    onClick?: (event: FlatEvent) => void;
}

export default function TimelineEvent({ event, position, onClick }: TimelineEventProps) {
    const eventColor = getEventColor(event.type);
    const shortType = event.type.split('_')[0].toLowerCase();

    // Calculate if we should show tooltip on left or right based on position
    const showTooltipLeft = position > 50;

    return (
        <div
            className="absolute flex flex-col items-center cursor-pointer group"
            style={{
                left: `${position}%`,
                transform: 'translateX(-50%)',
            }}
            onClick={() => onClick?.(event)}
        >
            {/* Event Marker Badge - Smart Positioning */}
            <div
                className="px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                style={{
                    backgroundColor: eventColor,
                    marginBottom: '8px',
                    position: 'absolute',
                    bottom: '100%',
                    left: showTooltipLeft ? 'auto' : 0,
                    right: showTooltipLeft ? 0 : 'auto',
                    transform: showTooltipLeft ? 'translateX(0)' : 'translateX(0)',
                }}
                title={event.type}
            >
                {shortType}
            </div>

            {/* Timeline Point */}
            <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-md flex-shrink-0"
                style={{ backgroundColor: eventColor }}
            />
        </div>
    );
}

function getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
        kill: '#ef4444',          // red
        death: '#8b5cf6',          // purple
        round_start: '#3b82f6',    // blue
        round_end: '#06b6d4',      // cyan
        game_start: '#10b981',     // emerald
        game_end: '#f59e0b',       // amber
        clutch: '#ec4899',         // pink
        bomb_plant: '#14b8a6',     // teal
        bomb_defuse: '#06b6d4',    // cyan
        site: '#f97316',           // orange
    };

    // Check if the event type starts with a known key
    for (const [key, color] of Object.entries(colorMap)) {
        if (eventType.toLowerCase().includes(key)) {
            return color;
        }
    }

    // Default color
    return '#6b7280'; // gray
}
