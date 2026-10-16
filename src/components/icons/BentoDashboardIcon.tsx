import React from 'react';

export const BentoDashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Top Left - horizontal */}
      <rect x="2.5" y="2.5" width="8" height="5.5" rx="1.75" />
      {/* Bottom Left - vertical */}
      <rect x="2.5" y="10.5" width="8" height="11" rx="1.75" />
      {/* Top Right - vertical */}
      <rect x="13.5" y="2.5" width="8" height="11" rx="1.75" />
      {/* Bottom Right - horizontal */}
      <rect x="13.5" y="16" width="8" height="5.5" rx="1.75" />
    </svg>
  );
};
