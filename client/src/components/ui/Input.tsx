import { type InputHTMLAttributes, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export default function Input({ label, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px', fontWeight: 500,
        letterSpacing: '0.8px', textTransform: 'uppercase',
        color: focused ? 'var(--copper)' : 'var(--text-muted)',
        marginBottom: '6px',
        transition: 'color var(--t-base)',
      }}>
        {label}
      </label>
      <input
        style={{
          width: '100%', height: '46px',
          background: 'var(--surface-3)',
          border: `1px solid ${focused ? 'var(--copper)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius)',
          padding: '0 14px',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '14px', color: 'var(--text)',
          outline: 'none',
          transition: 'border-color var(--t-base), box-shadow var(--t-base)',
          boxShadow: focused ? '0 0 0 3px hsl(25 85% 58% / 0.12)' : 'none',
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
        {...props}
      />
    </div>
  )
}
