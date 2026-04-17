import { useState, Fragment } from 'react'
import Logo from '../components/Logo'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { identities, painOptions, step2Titles } from '../data/surveyData'

type Step = 0 | 1 | 2 | 3 | 4
interface FormData { name: string; email: string; phone: string; organisation: string }

const MAX_PAIN = 2


const howItWorks = [
  { title: 'Choose Your Role' },
  { title: 'Share Challenges' },
  { title: 'Leave Your Details' },
]

/* ── Selectable option card — defined outside RightPanel to keep
   component identity stable across parent re-renders ── */
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
          : hovered ? '1px solid hsl(217 14% 36%)' : '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '8px 12px',
        cursor: 'pointer',
        background: selected
          ? 'hsl(25 85% 58% / 0.08)'
          : hovered ? 'hsl(217 16% 22%)' : 'hsl(217 18% 19%)',
        transition: 'border-color 150ms ease, background 150ms ease',
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  )
}

/* ── Step indicator (steps 1–3 only) — defined outside RightPanel ── */
function StepIndicator({ step }: { step: Step }) {
  if (step === 0 || step === 4) return null
  const labels = ['Identity', 'Challenges', 'Details']
  return (
    <div style={{
      padding: '14px 24px 12px',
      borderBottom: '1px solid var(--border-color)',
      flexShrink: 0,
    }}>
      {/*
        Lines are absolutely positioned behind the circles.
        Layer spans from center of circle 1 to center of circle 3.
        Spacer in the middle covers circle 2, so lines butt up to circle edges — no gap.
      */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Absolute line layer */}
        <div style={{ position: 'absolute', top: '11px', left: '12px', right: '12px', display: 'flex', pointerEvents: 'none' }}>
          <div style={{ flex: 1, height: '1px', background: step > 1 ? 'var(--copper)' : 'hsl(217 14% 28%)', opacity: step > 1 ? 0.6 : 0.35, transition: 'background 0.3s ease' }} />
          <div style={{ width: '24px' }} />
          <div style={{ flex: 1, height: '1px', background: step > 2 ? 'var(--copper)' : 'hsl(217 14% 28%)', opacity: step > 2 ? 0.6 : 0.35, transition: 'background 0.3s ease' }} />
        </div>
        {/* Circles + labels */}
        {labels.map((label, i) => {
          const s = i + 1; const active = s === step; const done = s < step
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                border: `1.5px solid ${done || active ? 'var(--copper)' : 'hsl(217 14% 32%)'}`,
                background: done ? 'var(--copper)' : active ? 'hsl(25 85% 58% / 0.12)' : 'hsl(217 18% 15%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.3s ease, background 0.3s ease',
              }}>
                {done ? (
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-5" stroke="hsl(217,24%,8%)" strokeWidth="1.7"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', fontWeight: 700,
                    color: active ? 'var(--copper)' : 'var(--text-dim)', transition: 'color 0.3s ease',
                  }}>{s}</span>
                )}
              </div>
              <span className="step-label" style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '8px',
                letterSpacing: '0.4px', textTransform: 'uppercase',
                color: active ? 'var(--copper)' : done ? 'var(--text-muted)' : 'var(--text-dim)',
                transition: 'color 0.3s ease', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   RIGHT PANEL
   Card layout (desktop):
     ┌─────────────────────┐
     │ 2px accent          │  ← fixed
     │ StepIndicator       │  ← fixed (steps 1-3)
     │ card-scroll-body    │  ← flex: 1, overflow-y: auto, no scrollbar
     │ card-action-bar     │  ← fixed bottom (steps 0-3)
     └─────────────────────┘
══════════════════════════════════════ */
function RightPanel() {
  const [step, setStep]               = useState<Step>(0)
  const [stepKey, setStepKey]         = useState(0)
  const [identity, setIdentity]       = useState<string | null>(null)
  const [pains, setPains]             = useState<number[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [form, setForm]               = useState<FormData>({ name: '', email: '', phone: '', organisation: '' })
  const [viewOpen, setViewOpen]       = useState(false)
  const [viewStatus, setViewStatus]   = useState<'idle'|'loading'|'found'|'not_found'|'error'>('idle')
  const [entry, setEntry]             = useState<{ email: string; created_at: string }|null>(null)

  const painList = identity ? painOptions[identity] : []

  function goTo(next: Step) {
    if (next === 1) setPains([])
    setStep(next)
    setStepKey(k => k + 1)
  }

  function togglePain(idx: number) {
    setPains(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx)
        : prev.length < MAX_PAIN ? [...prev, idx] : prev
    )
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
      const res = await fetch('http://localhost:4000/api/submit', {
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
      if (res.status === 409) setIsDuplicate(true)
    } catch { /* show thank-you even if server offline */ }
    finally {
      setSubmitting(false)
      setStepKey(k => k + 1)
      setStep(4)
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

  return (
    <div className="survey-card" style={{ maxWidth: '460px' }}>

      {/* ── Top accent line ── */}
      <div style={{ height: '2px', background: 'hsl(217 14% 28%)', flexShrink: 0 }} />

      {/* ── Step indicator (steps 1-3) ── */}
      <StepIndicator step={step} />

      {/*
        ── Scrollable body ──
        Array wrapper with changing key → React unmounts/remounts div on each step
        change, reliably re-firing the CSS entrance animation.
        No scrollbar shown (CSS: scrollbar-width:none).
      */}
      {[
        <div key={stepKey} className="card-scroll-body"
          style={{ animation: 'stepIn 0.28s cubic-bezier(0.4,0,0.2,1) both' }}
        >

          {/* Step 0 — Intro (centered, no button here — button is in action bar) */}
          {step === 0 && (
            <div className="card-center-content" style={{ padding: '32px 32px 16px' }}>
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px',
                background: 'hsl(25 85% 58% / 0.1)',
                border: '1px solid hsl(25 85% 58% / 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="var(--copper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                letterSpacing: '2px', textTransform: 'uppercase',
                color: 'var(--copper)', marginBottom: '10px',
              }}>
                Interest Survey
              </p>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px',
                fontWeight: 700, color: 'var(--text)',
                letterSpacing: '-0.4px', lineHeight: 1.35, marginBottom: '8px',
              }}>
                Share your perspective<br />with TIQ World
              </h3>
              <p style={{
                fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7,
                maxWidth: '280px', margin: '0 auto',
              }}>
                3 steps · ~2 minutes · no login required
              </p>
            </div>
          )}

          {/* Step 1 — Identity (buttons in action bar) */}
          {step === 1 && (
            <div style={{ padding: '16px 22px 10px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '6px' }}>Step {step} of 3</p>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 700,
                letterSpacing: '-0.3px', color: 'var(--text)', marginBottom: '4px',
              }}>
                How would you identify yourself?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '10px' }}>
                This helps us show you the most relevant insights.
              </p>
              <div className="identity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {identities.map((id) => (
                  <OptionCard key={id.val} selected={identity === id.val} onClick={() => setIdentity(id.val)}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                      color: identity === id.val ? 'var(--copper)' : 'var(--text-dim)',
                      marginBottom: '2px', letterSpacing: '0.5px',
                    }}>
                      {id.tag}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{id.label}</div>
                    <div className="identity-sublabel" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>{id.sublabel}</div>
                  </OptionCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Pain points (buttons in action bar) */}
          {step === 2 && identity && (
            <div style={{ padding: '16px 22px 10px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '6px' }}>Step {step} of 3</p>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 700,
                letterSpacing: '-0.3px', color: 'var(--text)', marginBottom: '4px',
              }}>
                {step2Titles[identity]}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2px' }}>
                Pick up to two that feel most pressing right now.
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                color: 'var(--text-dim)', marginBottom: '8px',
              }}>
                {pains.length} of {MAX_PAIN} selected
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {painList.map((opt, i) => (
                  <OptionCard key={i} selected={pains.includes(i)} onClick={() => togglePain(i)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '16px', height: '16px', flexShrink: 0, marginTop: '2px',
                        border: `1px solid ${pains.includes(i) ? 'var(--copper)' : 'hsl(217 12% 38%)'}`,
                        borderRadius: '4px',
                        background: pains.includes(i) ? 'var(--copper)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 120ms ease, background 120ms ease',
                      }}>
                        {pains.includes(i) && (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <path d="M1.5 5l2.5 2.5 4.5-5" stroke="hsl(217,24%,8%)" strokeWidth="1.6"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35 }}>{opt.main}</div>
                        <div className="option-desc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px', lineHeight: 1.4 }}>{opt.desc}</div>
                      </div>
                    </div>
                  </OptionCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Contact (buttons in action bar) */}
          {step === 3 && (
            <div style={{ padding: '16px 22px 10px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--copper)', marginBottom: '6px' }}>Step {step} of 3</p>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 700,
                letterSpacing: '-0.3px', color: 'var(--text)', marginBottom: '4px',
              }}>
                A bit about you
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '18px' }}>
                So we can keep you in the loop as we build.
              </p>
              <Input label="Full name"    type="text"  placeholder="Your name"
                value={form.name}         onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <Input label="Work email"   type="email" placeholder="name@company.com"
                value={form.email}        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              {form.email.length > 0 && (
                <p style={{
                  fontSize: '11px', marginTop: '-10px', marginBottom: '14px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                    ? 'hsl(142 65% 42%)' : 'hsl(0 72% 56%)',
                }}>
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                    ? '✓ Looks good' : '✗ Enter a valid email'}
                </p>
              )}
              <Input label="Phone number" type="tel"   placeholder="+91 98765 43210"
                value={form.phone}        onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input label="Organisation" type="text"  placeholder="Company or institution"
                value={form.organisation} onChange={(e) => setForm(f => ({ ...f, organisation: e.target.value }))} />
            </div>
          )}

          {/* Step 4 — Thank you (full content, no action bar) */}
          {step === 4 && (
            <div className="card-center-content" style={{ padding: '44px 32px' }}>
              <div style={{
                width: '56px', height: '56px',
                background: 'hsl(25 85% 58% / 0.1)',
                border: '1px solid hsl(25 85% 58% / 0.22)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M4 11l5 5 9-9" stroke="var(--copper)" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 style={{
                fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px',
                fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)', marginBottom: '10px',
              }}>
                {isDuplicate ? 'Already on the list' : 'Thank you'}
              </h3>
              <p style={{
                fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.75,
                maxWidth: '300px', margin: '0 auto 20px',
              }}>
                {isDuplicate
                  ? "We already have your details on record. We'll reach out when TIQ World launches."
                  : "We've noted what matters to you. TIQ World is being built for people exactly like you — we'll be in touch."}
              </p>
              <div style={{ height: '1px', background: 'var(--border-color)', maxWidth: '80px', margin: '0 auto 12px' }} />
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                color: 'var(--text-dim)', letterSpacing: '0.5px', marginBottom: '24px',
              }}>
                tiqworld.com
              </p>
              {!viewOpen ? (
                <button
                  onClick={handleViewData}
                  style={{
                    width: '100%', height: '44px', background: 'transparent',
                    border: '1px solid var(--border-color)', borderRadius: '10px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '14px', fontWeight: 500,
                    color: 'var(--text-muted)', cursor: 'pointer',
                    transition: 'border-color 150ms ease, color 150ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'hsl(217 14% 40%)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  View my data
                </button>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  {viewStatus === 'loading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="skeleton" style={{ height: '16px', width: '60%' }} />
                      <div className="skeleton" style={{ height: '14px', width: '80%' }} />
                      <div className="skeleton" style={{ height: '14px', width: '50%' }} />
                    </div>
                  )}
                  {viewStatus === 'not_found' && (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      No entry found for this email.
                    </p>
                  )}
                  {viewStatus === 'error' && (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'hsl(0,72%,56%)', padding: '12px 0' }}>
                      Could not fetch. Is the server running?
                    </p>
                  )}
                  {viewStatus === 'found' && entry && (
                    <div className="slide-up" style={{
                      background: 'hsl(217 18% 18%)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '18px 20px' }}>
                        <p style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                          letterSpacing: '1.5px', textTransform: 'uppercase',
                          color: 'var(--copper)', marginBottom: '14px',
                        }}>
                          Your latest entry
                        </p>
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
          )}

        </div>
      ]}

      {/* ── Sticky action bar — OUTSIDE the animated wrapper, steps 0-3 only ──
          Always visible at the card bottom, never scrolls away. */}
      {step < 4 && (
        <div className="card-action-bar">

          {/* Step 0 */}
          {step === 0 && (
            <Button
              variant="primary"
              onClick={() => goTo(1)}
              style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: 600 }}
            >
              Begin Survey
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <Button variant="primary" disabled={!identity} onClick={() => goTo(2)} style={{ width: '100%' }}>
              Continue
            </Button>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" onClick={() => goTo(1)}>Back</Button>
              <Button variant="primary" disabled={pains.length === 0} onClick={() => goTo(3)} style={{ flex: 1 }}>
                Continue
              </Button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" onClick={() => goTo(2)}>Back</Button>
                <Button variant="primary" disabled={!contactValid || submitting} onClick={handleSubmit} style={{ flex: 1 }}>
                  {submitting ? <><span className="spinner" />&nbsp;Submitting…</> : 'Submit'}
                </Button>
              </div>
              <p style={{
                fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center',
                marginTop: '10px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.2px',
              }}>
                Your data is private — never shared or sold.
              </p>
            </>
          )}

        </div>
      )}

    </div>
  )
}

/* ══════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════ */
export default function Landing() {
  return (
    <div className="page-shell">

      {/* ── NAV ── */}
      <header className="app-nav-header">
        <div className="app-nav-pill">
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
            background: 'var(--border-color)',
          }} />
          <Logo />
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px', color: 'var(--text-dim)',
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>
            survey.tiqworld.com
          </span>
        </div>
      </header>

      {/* ── SPLIT LAYOUT ── */}
      <div className="split-layout">

        {/* ── LEFT — hero ── */}
        <div className="panel-left">
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px', width: '100%' }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '3px 10px',
              background: 'hsl(25 85% 58% / 0.07)',
              border: '1px solid hsl(25 85% 58% / 0.18)',
              borderRadius: '100px',
              marginBottom: '28px',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--copper)', flexShrink: 0 }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px', fontWeight: 500,
                color: 'var(--copper)', letterSpacing: '1.5px', textTransform: 'uppercase',
              }}>
                Interest Survey · 2026
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-headline"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, lineHeight: 1.05,
                letterSpacing: '-0.04em', textTransform: 'uppercase',
                color: 'var(--text)', marginBottom: '22px',
              }}
            >
              Shape the<br />
              <span style={{ color: 'var(--copper)' }}>future</span> of<br />
              inspection.
            </h1>

            {/* Lead */}
            <p style={{
              fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.7,
              maxWidth: '420px', marginBottom: '8px', letterSpacing: '-0.01em',
            }}>
              Built for NDT, QA, and inspection professionals. Your input shapes every feature we build.
            </p>

            {/* How it works */}
            <div style={{ marginTop: '32px' }}>
              <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '28px', maxWidth: '340px' }} />
              <div className="left-how-it-works" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {howItWorks.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '40px', height: '40px', flexShrink: 0,
                      border: '1px solid var(--border-color)', borderRadius: '10px',
                      background: 'hsl(217 18% 14%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)',
                      }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                      {s.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT — survey card ── */}
        <div className="panel-right">
          <RightPanel />
        </div>

      </div>
    </div>
  )
}
