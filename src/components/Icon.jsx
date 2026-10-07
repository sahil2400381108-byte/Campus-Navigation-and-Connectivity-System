const paths = {
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  skip: (
    <>
      <path d="m5 5 10 7-10 7V5Zm13 0v14" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  graph: (
    <>
      <path d="m6 6 12 4-9 9L6 6Z" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="10" r="3" />
      <circle cx="9" cy="19" r="3" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </>
  ),
  both: (
    <>
      <path d="M4 12h16M8 8l-4 4 4 4m8-8 4 4-4 4" />
    </>
  ),
  weight: (
    <>
      <path d="m4 16 12-12 4 4L8 20l-4-4Zm6-6 2 2m2-6 2 2m-10 6 2 2" />
    </>
  ),
  play: <path d="m9 5 10 7-10 7V5Z" />,
  reset: (
    <>
      <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  matrix: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 10h16M4 15h16M10 4v16m5-16v16" />
    </>
  ),
  route: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M7 6h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.01" />
    </>
  ),
};

export default function Icon({ name, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.graph}
    </svg>
  );
}
