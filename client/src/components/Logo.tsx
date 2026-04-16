export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Copper indicator dot — matches tiq_workplace */}
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: 'var(--copper)', flexShrink: 0,
        display: 'inline-block',
      }} />
      {/* Favicon */}
      <img
        src="/custom-favicon.png"
        alt="TIQ"
        style={{ height: '26px', objectFit: 'contain', flexShrink: 0 }}
      />
      {/* Wordmark */}
      <span style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '15px', fontWeight: 700,
        letterSpacing: '-0.2px', lineHeight: 1,
      }}>
        <span style={{ color: 'var(--copper)' }}>TIQ</span>
        <span style={{ color: 'var(--text)' }}> World</span>
      </span>
    </div>
  )
}
