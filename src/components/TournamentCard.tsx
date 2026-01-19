'use client';

interface TournamentCardProps {
  id: string;
  name: string;
  nameShortened?: string;
  onClick?: (id: string) => void;
}

export default function TournamentCard({ 
  id, 
  name, 
  nameShortened,
  onClick 
}: TournamentCardProps) {
  const displayName = nameShortened || name;
  
  return (
    <div 
      className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6 transition-all duration-300 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:translate-x-1 flex items-center gap-5"
      onClick={() => onClick?.(id)}
    >
      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-purple-700 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Trophy Icon Badge */}
      <div className="w-[60px] h-[60px] rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" 
          />
        </svg>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-black dark:text-white truncate">
          {displayName}
        </h3>
        {nameShortened && name !== nameShortened && (
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
            {name}
          </p>
        )}
      </div>
      
      {/* Arrow */}
      <div className="w-6 h-6 text-gray-400 dark:text-gray-600 flex-shrink-0 transition-all duration-300 group-hover:text-purple-500 group-hover:translate-x-1">
        <svg 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          className="w-full h-full"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
    </div>
  );
}
