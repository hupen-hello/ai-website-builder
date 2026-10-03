import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageName?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ pageName, items, className = '' }: BreadcrumbProps) {
  // If items are provided, use them. Otherwise, default to Home > pageName
  const breadcrumbs = items || (pageName ? [
    { label: 'Home', href: '/' },
    { label: pageName }
  ] : []);

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${className || 'text-white/80'}`}>
      {breadcrumbs.map((crumb, idx) => {
        const isLast = idx === breadcrumbs.length - 1;
        const isFirst = idx === 0;

        return (
          <React.Fragment key={idx}>
            {isFirst ? (
              <Link 
                href={crumb.href || '/'} 
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Home size={16} />
                {crumb.label}
              </Link>
            ) : isLast ? (
              <span className="text-white">{crumb.label}</span>
            ) : (
              <Link 
                href={crumb.href || '#'} 
                className="hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            )}
            
            {!isLast && (
              <ChevronRight size={16} className="opacity-50" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
