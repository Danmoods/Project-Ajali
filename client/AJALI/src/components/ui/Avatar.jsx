export default function Avatar({ name = 'A', size = 40, src, className = '' }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover border border-white/10 ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-ink-700 text-white font-semibold border border-white/10 ${className}`}
    >
      <span style={{ fontSize: size * 0.38 }}>{initials || 'A'}</span>
    </div>
  )
}

