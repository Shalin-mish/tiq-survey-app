import { useState, useEffect, useCallback } from 'react'
import Logo from '../components/Logo'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { identities, painOptions, step2Titles } from '../data/surveyData'

type Step = 0 | 1 | 2 | 3 | 4
interface FormData { name: string; email: string; phone: string; organisation: string }

const MAX_PAIN = 2
const progressWidth: Record<number, string> = { 0: '0%', 1: '25%', 2: '50%', 3: '75%', 4: '100%' }

const howItWorks = [
  { num: '01', title: 'Identify Yourself',     desc: 'Your role in NDT, QA, or inspection.' },
  { num: '02', title: 'Share Your Challenges', desc: 'Up to two pain points pressing right now.' },
  { num: '03', title: 'Leave Your Details',    desc: 'So we can reach you as TIQ World grows.' },
]

/* ══════════════════════════════════════
   TRANSITION HOOK
   Wraps step changes with fade-out → update → fade-in
══════════════════════════════════════ */
function useStepTransition(initial: Step) {
  const [step, setStepRaw]    = useState<Step>(initial)
  const [visible, setVisible] = useState(true)

  const goTo = useCallback((next: Step) => {
    setVisible(false)
    setTimeout(() => {
      setStepRaw(next)
      setVisible(true)
    }, 200)
  }, [])

  return { step, visible, goTo }
}

/* ══════════════════════════════════════
   RIGHT PANEL — dynamic survey area
══════════════════════════════════════ */
function RightPanel() {
  const { step, visible, goTo }   = useStepTransition(0)
  const [identity, setIdentity]   = useState<string | null>(null)
  const [pains, setPains]         = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm]           = useState<FormData>({ name: '', email: '', phone: '', organisation: '' })
  const [viewOpen, setViewOpen]   = useState(false)
  const [viewStatus, setViewStatus] = useState<'idle'|'loading'|'found'|'not_found'|'error'>('idle')
  const [entry, setEntry]         = useState<{ email: string; created_at: string }|null>(null)

  const painList = identity ? painOptions[identity] : []

  function togglePain(idx: number) {
    setPains(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx)
        : prev.length < MAX_PAIN ? [...prev, idx] : prev
    )
  }

  function goToStep(next: Step) {
    if (next === 1) { setPains([]) }
    goTo(next)
  }

  const contactValid =
    form.name.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.phone.trim().length > 5 &&
    form.organisation.trim().length > 1

  async function handleSubmit() {
    if (!contactValid || !identity) return
    setSubmitting(true)
    try {
      await fetch('http://localhost:4000/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity,
          pain_1: painList[pains[0]]?.main ?? '',
          pain_2: painList[pains[1]]?.main ?? '',
          name: form.name, email: form.email,
          phone: form.phone, organisation: form.organisation,
        }),
      })
    } catch { /* show thank-you even if server offline during UI dev */ }
    finally {
      setSubmitting(false)
      goTo(4)
    }
  }

  async function handleViewData() {
    setViewOpen(true)
    setViewStatus('loading')
    try {
      const res = await fetch(`http://localhost:4000/api/view?email=${encodeURIComponent(form.email)}`)
      if (res.status === 404) { setViewStatus('not_found'); return }
      if (!res.ok) throw new Error()
      setEntry(await res.json())
      setViewStatus('found')
    } catch { setViewStatus('error') }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  /* ── Shared styles ── */
  const monoLabel: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px', fontWeight: 500,
    letterSpacing: '1px', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: '6px', display: 'block',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  }

  /* ── Option card (identity + pain) ── */
  function OptionCard({
    selected, onClick, children,
  }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
    const [hovered, setHovered] = useState(false)
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: selected
            ? '1px solid var(--copper)'
            : hovered ? '1px solid var(--slate-400)'
            : '1px solid var(--border-color)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          cursor: 'pointer',
          background: selected
            ? 'hsl(25 85% 58% / 0.09)'
            : hovered ? 'var(--surface-2)'
            : 'var(--surface)',
          transition: 'border-color var(--t-base), background var(--t-base)',
          userSelect: 'none',
        }}
      >
        {children}
      </div>
    )
  }

  /* ── Content per step ── */
  function StepContent() {
    /* STEP 0 — Intro */
    if (step === 0) return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        flex: 1, padding: '40px 32px', textAlign: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: '380px', ...cardStyle }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--copper), var(--teal))' }} />
          <div style={{ padding: '36px 28px' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--copper)',
              display: 'block', marginBottom: '16px',
            }}>
              Interest Survey
            </span>
            <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.45, marginBottom: '10px', letterSpacing: '-0.3px' }}>
              Share your perspective<br />with TIQ World
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '28px' }}>
              3 steps · ~2 minutes · no login
            </p>
            <Button
              variant="primary"
              onClick={() => goTo(1)}
              style={{ width: '100%', height: '48px', fontSize: '15px' }}
            >
              Begin Survey
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    )

    /* STEP 1 — Identity */
    if (step === 1) return (
      <div style={{ padding: '32px', maxWidth: '520px', width: '100%', margin: '0 auto' }}>
        <span style={monoLabel}>Step 1 of 3</span>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(17px,2vw,20px)', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)', marginBottom: '6px' }}>
          How would you identify yourself?
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '20px' }}>
          This helps us show you what's most relevant.
        </p>

        <div
          className="identity-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}
        >
          {identities.map((id) => (
            <OptionCard key={id.val} selected={identity === id.val} onClick={() => setIdentity(id.val)}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: identity === id.val ? 'var(--copper)' : 'var(--text-dim)', marginBottom: '5px' }}>{id.tag}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>{id.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{id.sublabel}</div>
            </OptionCard>
          ))}
        </div>

        <Button variant="primary" disabled={!identity} onClick={() => goToStep(2)} style={{ width: '100%' }}>
          Continue
        </Button>
      </div>
    )

    /* STEP 2 — Pain points */
    if (step === 2 && identity) return (
      <div style={{ padding: '32px', maxWidth: '520px', width: '100%', margin: '0 auto' }}>
        <span style={monoLabel}>Step 2 of 3</span>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(17px,2vw,20px)', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)', marginBottom: '6px' }}>
          {step2Titles[identity]}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '4px' }}>
          Pick up to two that feel most pressing right now.
        </p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-dim)', marginBottom: '16px' }}>
          {pains.length} of {MAX_PAIN} selected
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '20px' }}>
          {painList.map((opt, i) => (
            <OptionCard key={i} selected={pains.includes(i)} onClick={() => togglePain(i)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {/* Checkbox */}
                <div style={{
                  width: '16px', height: '16px', flexShrink: 0, marginTop: '2px',
                  border: `1px solid ${pains.includes(i) ? 'var(--copper)' : 'var(--slate-600)'}`,
                  borderRadius: '4px',
                  background: pains.includes(i) ? 'var(--copper)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background var(--t-base), border-color var(--t-base)',
                }}>
                  {pains.includes(i) && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-5" stroke="hsl(217,24%,8%)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>{opt.main}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
              </div>
            </OptionCard>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" onClick={() => goToStep(1)}>Back</Button>
          <Button variant="primary" disabled={pains.length === 0} onClick={() => goToStep(3)} style={{ flex: 1 }}>Continue</Button>
        </div>
      </div>
    )

    /* STEP 3 — Contact */
    if (step === 3) return (
      <div style={{ padding: '32px', maxWidth: '520px', width: '100%', margin: '0 auto' }}>
        <span style={monoLabel}>Step 3 of 3</span>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(17px,2vw,20px)', fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)', marginBottom: '6px' }}>
          A bit about you
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '20px' }}>
          So we can keep you in the loop as we build.
        </p>

        <Input label="Full name"    type="text"  placeholder="Your name"              value={form.name}         onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
        <Input label="Work email"   type="email" placeholder="name@company.com"       value={form.email}        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
        <Input label="Phone number" type="tel"   placeholder="+91 98765 43210"        value={form.phone}        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
        <Input label="Organisation" type="text"  placeholder="Company or institution" value={form.organisation} onChange={(e) => setForm(f => ({ ...f, organisation: e.target.value }))} />

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="outline" onClick={() => goToStep(2)}>Back</Button>
          <Button
            variant="primary"
            disabled={!contactValid || submitting}
            onClick={handleSubmit}
            style={{ flex: 1 }}
          >
            {submitting
              ? <><span className="spinner" />&nbsp;Submitting…</>
              : 'Submit'}
          </Button>
        </div>
      </div>
    )

    /* STEP 4 — Thank you */
    if (step === 4) return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px', textAlign: 'center' }}>
          {/* Animated check circle */}
          <div style={{
            width: '54px', height: '54px',
            border: '1.5px solid var(--copper)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            position: 'relative',
          }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M4 11l5 5 9-9" stroke="var(--copper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Ping ring */}
            <div style={{
              position: 'absolute', inset: '-6px',
              border: '1px solid var(--copper)',
              borderRadius: '50%', opacity: 0,
              animation: 'pingSlow 2s cubic-bezier(0,0,0.2,1) 0.3s infinite',
            }} />
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '10px' }}>
            Thank you
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: '320px', margin: '0 auto 20px' }}>
            We've noted what matters to you. TIQ World is being built for people exactly like you — we'll be in touch.
          </p>

          <div style={{ height: '1px', background: 'var(--border-color)', maxWidth: '100px', margin: '0 auto 12px' }} />
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '24px' }}>
            tiqworld.com
          </p>

          {/* View my data */}
          {!viewOpen ? (
            <button
              onClick={handleViewData}
              style={{
                width: '100%', height: '44px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px', fontWeight: 500,
                color: 'var(--text-muted)', cursor: 'pointer',
                transition: 'border-color var(--t-base), color var(--t-base)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--copper)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              View my data
            </button>
          ) : (
            <div className="slide-up" style={{ textAlign: 'left' }}>
              {viewStatus === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '16px', width: '60%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '50%' }} />
                </div>
              )}
              {viewStatus === 'not_found' && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>No entry found for this email.</p>
              )}
              {viewStatus === 'error' && (
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'hsl(0,72%,56%)', padding: '12px 0' }}>Could not fetch. Is the server running?</p>
              )}
              {viewStatus === 'found' && entry && (
                <div style={{ background: 'var(--surface)', border: '1px solid hsl(25 85% 58% / 0.35)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--copper), var(--teal))' }} />
                  <div style={{ padding: '18px 20px' }}>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '14px' }}>Your latest entry</p>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '3px' }}>Email</p>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{entry.email}</p>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '12px 0' }} />
                    <div>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '3px' }}>Submitted</p>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--text-muted)' }}>{fmt(entry.created_at)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )

    return null
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar (visible on steps 1-4) */}
      <div style={{
        height: '3px',
        background: 'var(--surface-3)',
        overflow: 'hidden',
        opacity: step === 0 ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{
          height: '100%',
          width: progressWidth[step],
          background: 'linear-gradient(90deg, var(--copper), var(--teal))',
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {/* Step label row */}
      {step > 0 && step < 4 && (
        <div style={{
          padding: '10px 32px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)' }}>
            Step {step} of 3
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-dim)' }}>
            {step === 1 ? 'Identity' : step === 2 ? 'Challenges' : 'Details'}
          </span>
        </div>
      )}

      {/* Animated content */}
      <div
        className="step-wrap"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.22s cubic-bezier(0.4,0,0.2,1), transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <StepContent />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════ */
export default function Landing() {
  // Detect tablet/mobile for responsive left panel
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const check = () => setIsTablet(window.innerWidth <= 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="page-shell">

      {/* ── NAV ── */}
      <nav className="app-nav">
        <Logo />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.5px',
        }}>
          survey.tiqworld.com
        </span>
      </nav>

      {/* ── SPLIT LAYOUT ── */}
      <div className="split-layout">

        {/* ── LEFT — fixed ── */}
        <div className="panel-left">
          {/* Blueprint grid */}
          <div className="blueprint-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'radial-gradient(ellipse 80% 80% at 20% 50%, transparent 10%, var(--bg) 80%)',
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '460px' }}>
            {/* Badge */}
            <div className="anim-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '5px 14px',
              background: 'hsl(25 85% 58% / 0.1)',
              border: '1px solid hsl(25 85% 58% / 0.3)',
              borderRadius: '100px', marginBottom: isTablet ? '16px' : '24px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--copper)', flexShrink: 0 }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', fontWeight: 500,
                color: 'var(--copper)', letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                Interest Survey
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`anim-up-d1 hero-headline`}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: isTablet ? 'clamp(28px,5vw,42px)' : 'clamp(36px,4vw,56px)',
                fontWeight: 700, lineHeight: 1,
                letterSpacing: '-0.03em', textTransform: 'uppercase',
                color: 'var(--text)',
                marginBottom: isTablet ? '12px' : '18px',
              }}
            >
              Tell us<br />who you<br />
              <span style={{ color: 'var(--copper)' }}>are.</span>
            </h1>

            <p className="anim-up-d2" style={{
              fontSize: isTablet ? '13px' : '15px',
              color: 'var(--text-muted)', lineHeight: 1.75,
              maxWidth: '360px',
              marginBottom: isTablet ? '20px' : '36px',
            }}>
              We're building TIQ World around what actually matters to people in inspection, NDT, and QA.
            </p>

            {/* Divider */}
            {!isTablet && (
              <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '28px', maxWidth: '340px' }} />
            )}

            {/* How it works */}
            <div className={`anim-up-d3 left-how-it-works`} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {howItWorks.map((s) => (
                <div key={s.num} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px', fontWeight: 600,
                    color: 'var(--border-color)', minWidth: '22px', marginTop: '2px',
                  }}>
                    {s.num}
                  </span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{s.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — dynamic survey ── */}
        <div className="panel-right">
          <RightPanel />
        </div>

      </div>
    </div>
  )
}
