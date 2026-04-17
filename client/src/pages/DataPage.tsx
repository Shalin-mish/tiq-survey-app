import { useState, useEffect } from 'react'
import Logo from '../components/Logo'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

interface Response {
  id: number
  name: string
  email: string
  identity: string
  pain_1: string
  pain_2: string
  phone: string
  organisation: string
  created_at: string
}

const identityLabel: Record<string, string> = {
  professional:        'Working Professional',
  freelancer:          'Freelancer',
  manufacturer:        'Manufacturer / EPC',
  inspection_provider: 'Inspection Provider',
  fresher:             'Fresher / Student',
  vendor:              'Vendor / OEM',
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

function exportCSV(responses: Response[]) {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Organisation', 'Identity', 'Challenge 1', 'Challenge 2', 'Submitted']
  const rows = responses.map(r => [
    r.id,
    r.name,
    r.email,
    r.phone,
    r.organisation,
    identityLabel[r.identity] ?? r.identity,
    r.pain_1,
    r.pain_2 || '',
    fmt(r.created_at),
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `tiqworld-survey-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Admin data view ── */
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [responses, setResponses]   = useState<Response[]>([])
  const [loading, setLoading]       = useState(false)
  const [loaded, setLoaded]         = useState(false)
  const [error, setError]           = useState('')

  // Auto-load on mount
  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:4000/api/admin/responses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setResponses(await res.json())
      setLoaded(true)
    } catch {
      setError('Failed to load data. Is the server running?')
    } finally { setLoading(false) }
  }

  if (!loaded) return (
    <div style={{ flex: 1, padding: '32px 40px' }}>
      {error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '16px' }}>
          <p style={{ color: 'hsl(0,72%,56%)', fontSize: '13px' }}>{error}</p>
          <Button variant="primary" onClick={loadData}>Retry</Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius)' }} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '4px' }}>
            Survey Responses
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)' }}>
            {responses.length} {responses.length === 1 ? 'submission' : 'submissions'}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => exportCSV(responses)} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={loadData} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
            Refresh
          </Button>
          <Button variant="ghost" onClick={onLogout} style={{ height: '36px', padding: '0 16px', fontSize: '13px', color: 'var(--text-dim)' }}>
            Logout
          </Button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: '48px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No responses yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {responses.map((r) => (
            <div
              key={r.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                transition: 'border-color var(--t-base)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'hsl(25 85% 58% / 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {/* Row header */}
              <div style={{
                padding: '14px 20px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'hsl(25 85% 58% / 0.15)',
                    border: '1px solid hsl(25 85% 58% / 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '13px', fontWeight: 600, color: 'var(--copper)',
                    flexShrink: 0,
                  }}>
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{r.name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.email}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px', letterSpacing: '0.5px',
                    color: 'var(--copper)',
                    background: 'hsl(25 85% 58% / 0.1)',
                    border: '1px solid hsl(25 85% 58% / 0.25)',
                    borderRadius: '6px', padding: '3px 10px',
                  }}>
                    {identityLabel[r.identity] ?? r.identity}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-dim)' }}>
                    {fmt(r.created_at)}
                  </span>
                </div>
              </div>

              {/* Row body */}
              <div style={{ padding: '14px 20px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Challenge 1</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.pain_1 || '—'}</p>
                </div>
                {r.pain_2 && (
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Challenge 2</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.pain_2}</p>
                  </div>
                )}
                <div style={{ flex: '0 1 auto' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Organisation</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.organisation}</p>
                </div>
                <div style={{ flex: '0 1 auto' }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Phone</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.phone}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Admin login ── */
export default function DataPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [token, setToken]       = useState(() => sessionStorage.getItem('admin_token') || '')

  async function handleLogin() {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:4000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.status === 401) { setError('Invalid credentials'); setLoading(false); return }
      if (!res.ok) throw new Error()
      const { token: t } = await res.json()
      sessionStorage.setItem('admin_token', t)
      setToken(t)
    } catch {
      setError('Server error. Is the backend running?')
    } finally { setLoading(false) }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_token')
    setToken('')
  }

  if (token) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <header className="app-nav-header">
        <div className="app-nav-pill">
          <Logo />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Admin View
          </span>
        </div>
      </header>
      <div style={{ paddingTop: '70px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminDashboard token={token} onLogout={handleLogout} />
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'hsl(217 18% 15%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}>
        <div style={{ height: '2px', background: 'hsl(217 14% 28%)' }} />
        <div style={{ padding: '36px 32px' }}>
          <div style={{ marginBottom: '28px' }}>
            <Logo />
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '6px' }}>
            Admin Access
          </p>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text)', marginBottom: '24px' }}>
            Sign in to view responses
          </h2>

          <Input label="Email"    type="email"    placeholder="admin@tiqworld.com" value={email}    onChange={(e) => { setEmail(e.target.value); setError('') }} />
          <Input label="Password" type="password" placeholder="••••••••"           value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />

          {error && (
            <p style={{ fontSize: '13px', color: 'hsl(0,72%,56%)', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {error}
            </p>
          )}

          <Button
            variant="primary"
            disabled={!email || !password || loading}
            onClick={handleLogin}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>
      </div>
    </div>
  )
}
