import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '46px',
    borderRadius: 'var(--radius)',
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.2px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity var(--t-base), background var(--t-base), border-color var(--t-base)',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.35 : 1,
    border: 'none',
  }

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: 'var(--copper)',
      color: 'hsl(217, 24%, 8%)',
      padding: '0 24px',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border-color)',
      padding: '0 20px',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      padding: '0 20px',
    },
  }

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '0.82' }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.opacity = '1' }}
      {...props}
    >
      {children}
    </button>
  )
}
