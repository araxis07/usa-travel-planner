import type { CSSProperties } from 'react';

export type IconName =
  | 'columns'
  | 'arrow'
  | 'arrow-up'
  | 'arrow-down'
  | 'pin'
  | 'heart'
  | 'search'
  | 'compass'
  | 'mountain'
  | 'sun'
  | 'moon'
  | 'city'
  | 'waves'
  | 'route'
  | 'calendar'
  | 'clock'
  | 'plus'
  | 'minus'
  | 'close'
  | 'menu'
  | 'check'
  | 'globe'
  | 'download'
  | 'upload'
  | 'bag'
  | 'external'
  | 'chevron'
  | 'trash'
  | 'users'
  | 'dollar'
  | 'pause'
  | 'play'
  | 'map'
  | 'book';
const paths: Record<IconName, React.ReactNode> = {
  columns: (
    <>
      <rect x="3" y="4" width="7" height="16" rx="1" />
      <rect x="14" y="4" width="7" height="16" rx="1" />
    </>
  ),
  moon: <path d="M20 14A9 9 0 0 1 10 3 9 9 0 1 0 20 14Z" />,
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  'arrow-up': <path d="M12 20V4m-6 6 6-6 6 6" />,
  'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  heart: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-2.4 5.6L8 16l2.4-5.6Z" />
    </>
  ),
  mountain: (
    <>
      <path d="m2 20 7-14 4 8 3-5 6 11H2Zm4-8 3 2 3-2" />
      <circle cx="18" cy="5" r="2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  city: (
    <>
      <path d="M3 21V8h7v13M10 21V3h10v18M1 21h22M6 11v1m0 3v1m8-9h2m-2 4h2m-2 4h2" />
    </>
  ),
  waves: (
    <>
      <path d="M2 10c3-4 5 4 10 0s7 4 10 0M2 16c3-4 5 4 10 0s7 4 10 0" />
      <path d="M8 5a4 4 0 0 1 8 0" />
    </>
  ),
  route: (
    <>
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  check: <path d="m5 12 4 4L19 6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M5 7h14M5 17h14" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5" />
    </>
  ),
  bag: (
    <>
      <rect x="4" y="7" width="16" height="14" rx="2" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2M8 11v2m8-2v2" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7" />
    </>
  ),
  chevron: <path d="m8 4 8 8-8 8" />,
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2v20m5-16H9a4 4 0 0 0 0 8h6a3 3 0 0 1 0 6H6" />
    </>
  ),
  pause: (
    <>
      <path d="M9 5v14M15 5v14" />
    </>
  ),
  play: <path d="m8 4 12 8-12 8Z" />,
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15" />
    </>
  ),
  book: (
    <>
      <path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2v16" />
    </>
  ),
};
export default function Icon({
  name,
  size = 20,
  className = '',
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`icon ${className}`}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
