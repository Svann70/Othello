/**
 * CreditsFooter Component
 * Professional credit section with team member references
 */

import { memo } from 'react';

const TEAM_MEMBERS = [
  { handle: '@ivanderdniel', url: 'https://github.com/ivanderdniel' },
  { handle: '@notharis.png', url: 'https://github.com/notharis' },
  { handle: '@robbyifelse', url: 'https://github.com/robbyifelse' },
  { handle: '@mayamahdiya29', url: 'https://github.com/mayamahdiya29' },
];

const CreditsFooter = memo(function CreditsFooter() {
  return (
    <footer className="mt-auto pt-6">
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground text-center mb-2">
          Developed by
        </p>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {TEAM_MEMBERS.map((member, index) => (
            <span key={member.handle} className="flex items-center">
              <a
                href={member.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-accent transition-colors duration-200"
              >
                {member.handle}
              </a>
              {index < TEAM_MEMBERS.length - 1 && (
                <span className="text-muted-foreground/50 ml-3">|</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
});

export default CreditsFooter;
