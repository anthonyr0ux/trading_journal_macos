import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

interface HelpBadgeProps {
  section: 'dashboard' | 'calculator' | 'journal' | 'import' | 'settings' | 'concepts' | 'faq';
  className?: string;
}

export function HelpBadge({ section, className = '' }: HelpBadgeProps) {
  return (
    <Link
      to={`/help?section=${section}#${section}`}
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors ${className}`}
      title="View help"
    >
      <HelpCircle className="h-3.5 w-3.5" />
    </Link>
  );
}
