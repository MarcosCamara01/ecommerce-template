/**
 * Line icons drawn for the Chromatic canvas: 24px grid, round caps,
 * 1.7–1.8 stroke. Decorative by default; label the control, not the icon.
 */
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "aria-hidden": true as const,
});

export const SearchIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.8" strokeLinecap="round" className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const HeartIcon = ({
  size = 18,
  className,
  filled = false,
}: IconProps & { filled?: boolean }) => (
  <svg
    {...base(size)}
    fill={filled ? "currentColor" : "none"}
    strokeWidth="1.7"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);

export const UserIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.7" strokeLinecap="round" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const MenuIcon = ({ size = 20, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.8" strokeLinecap="round" className={className}>
    <path d="M4 9h16M4 15h16" />
  </svg>
);

export const CloseIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="2" strokeLinecap="round" className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const OrdersIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.7" strokeLinejoin="round" className={className}>
    <path d="M5 8h14l-1 13H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const LogoutIcon = ({ size = 18, className }: IconProps) => (
  <svg
    {...base(size)}
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
  </svg>
);

export const ArrowRightIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.8" strokeLinecap="round" className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowUpRightIcon = ({ size = 22, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="1.6" strokeLinecap="round" className={className}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const PauseIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} strokeWidth="2.2" strokeLinecap="round" className={className}>
    <path d="M9 6.5v11M15 6.5v11" />
  </svg>
);

/** Sits a little right of centre, where a triangle looks centred. */
export const PlayIcon = ({ size = 16, className }: IconProps) => (
  <svg
    {...base(size)}
    fill="currentColor"
    strokeWidth="1.8"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 6.5v11l9-5.5-9-5.5Z" />
  </svg>
);
