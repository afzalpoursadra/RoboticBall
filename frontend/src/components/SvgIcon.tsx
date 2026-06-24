type IconProps = {
  name: "wifi" | "bolt" | "shield" | "radar" | "gauge" | "bot" | "spark" | "wave";
  className?: string;
};

export function SvgIcon({ name, className = "" }: IconProps) {
  if (name === "wifi") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M4 9.2a12.2 12.2 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7.5 12.7a7 7 0 0 1 9 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10.3 16a2.7 2.7 0 0 1 3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="19" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (name === "bolt") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M13.2 2.8 5.8 13h5l-.9 8.2 8.4-11.4h-5.4l.3-7Z" fill="currentColor" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M12 3.2 19 6v5.2c0 4.4-2.8 8-7 9.6-4.2-1.6-7-5.2-7-9.6V6l7-2.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="m9.2 12 1.8 1.8 4-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "radar") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" opacity=".55" />
        <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.8" opacity=".8" />
        <path d="M12 12 18.2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="18.2" cy="7" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (name === "gauge") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M4.5 15.5a7.5 7.5 0 1 1 15 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 15.5 16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "bot") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M12 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="5" y="7" width="14" height="11" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="9.2" cy="12.4" r="1.3" fill="currentColor" />
        <circle cx="14.8" cy="12.4" r="1.3" fill="currentColor" />
        <path d="M9.2 16h5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "spark") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
        <path d="M12 2.8 14 9l6.2 2-6.2 2-2 6.2-2-6.2-6.2-2 6.2-2L12 2.8Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3 12c3-5 6-5 9 0s6 5 9 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 17c3-5 6-5 9 0s6 5 9 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}
