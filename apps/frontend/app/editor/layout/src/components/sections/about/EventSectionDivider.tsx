import React from 'react';

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className = '' }: SectionDividerProps) {
  return (
    <div className={`flex items-center gap-4 w-full max-w-[280px] opacity-80 ${className}`}>
      <div className="h-[1px] w-full bg-[#32174d]/50" />
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#32174d] flex-shrink-0">
        <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="currentColor"/>
      </svg>
      <div className="h-[1px] w-full bg-[#32174d]/50" />
    </div>
  );
}
