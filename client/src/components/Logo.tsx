export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '34px', height: '34px',
        border: '1.5px solid var(--copper)',
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px', fontWeight: 600,
        letterSpacing: '-0.5px',
        color: 'var(--copper)',
        flexShrink: 0,
      }}>
        TIQ
      </div>
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '15px', fontWeight: 600,
        letterSpacing: '0.3px',
        color: 'var(--text)',
      }}>
        TIQ World
      </span>
    </div>
  )
}
