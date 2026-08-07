interface AvatarProps {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const initials = name?.trim().slice(0, 1) ?? '?';
  const style = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name ?? 'avatar'}
        style={style}
        className={`flex-shrink-0 rounded-full border border-border object-cover ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...style, background: 'color-mix(in srgb, var(--brand) 15%, transparent)', color: 'var(--brand-700)' }}
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
    >
      {initials}
    </div>
  );
}
