'use client';

interface TeamCardProps {
  id: string;
  name: string;
  colorPrimary: string;
  colorSecondary: string;
  logoUrl?: string;
  onClick?: (id: string) => void;
}

export default function TeamCard({ 
  id, 
  name, 
  colorPrimary, 
  colorSecondary, 
  logoUrl,
  onClick 
}: TeamCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Provide default colors if not available
  const primaryColor = colorPrimary || '#667eea';
  const secondaryColor = colorSecondary || '#764ba2';

  return (
    <div 
      className="relative overflow-hidden bg-white dark:bg-zinc-900 rounded-lg p-6 transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 border-2"
      onClick={() => onClick?.(id)} 
      style={{ 
        borderColor: primaryColor,
      }}
    >
      {/* Top accent bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      />
      
      <div className="flex items-center gap-4">
        <div 
          className="w-[70px] h-[70px] rounded-full flex items-center justify-center font-bold text-white text-2xl flex-shrink-0 shadow-lg"
          style={{
            background: logoUrl 
              ? `url(${logoUrl}) center/cover` 
              : `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            border: `3px solid ${primaryColor}`
          }}
        >
          {!logoUrl && initials}
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold text-black dark:text-white">
            {name}
          </div>
        </div>
      </div>
    </div>
  );
}
