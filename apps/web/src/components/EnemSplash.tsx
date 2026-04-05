'use client'
import { useState, useEffect, useRef } from 'react'
import { GraduationCap, ArrowRight, Check, ChevronRight } from 'lucide-react'

/* ── score → visual info ─────────────────────────────────────────────────── */
function getScoreInfo(score: number) {
  if (score < 450) return { label: 'Continue se dedicando', color: '#94a3b8', bar: '#cbd5e1', pct: score / 10 }
  if (score < 550) return { label: 'Bom começo!',           color: '#3b82f6', bar: '#93c5fd', pct: score / 10 }
  if (score < 650) return { label: 'Bom resultado!',        color: '#0d9488', bar: '#5eead4', pct: score / 10 }
  if (score < 750) return { label: 'Muito bom!',            color: '#16a34a', bar: '#86efac', pct: score / 10 }
  if (score < 850) return { label: 'Ótimo resultado!',      color: '#d97706', bar: '#fcd34d', pct: score / 10 }
  if (score < 950) return { label: 'Excelente!',            color: '#ea580c', bar: '#fdba74', pct: score / 10 }
  return             { label: 'Nota incrível!',             color: '#db2777', bar: '#f9a8d4', pct: 100 }
}

/* ── digit animation ─────────────────────────────────────────────────────── */
function AnimatedDigit({ digit }: { digit: string }) {
  const [prev, setPrev] = useState(digit)
  const [current, setCurrent] = useState(digit)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (digit === current) return
    setAnimating(true)
    setPrev(current)
    setCurrent(digit)
    const t = setTimeout(() => setAnimating(false), 200)
    return () => clearTimeout(t)
  }, [digit])

  return (
    <span
      className="inline-block tabular-nums leading-none transition-all duration-150"
      style={{
        transform: animating ? 'translateY(-4px)' : 'translateY(0)',
        opacity: animating ? 0.5 : 1,
      }}
    >
      {current}
    </span>
  )
}

/* ── main component ──────────────────────────────────────────────────────── */
export function EnemSplash() {
  const [visible, setVisible]   = useState(false)
  const [mounted, setMounted]   = useState(false)
  const [scoreStr, setScoreStr] = useState('')
  const [email, setEmail]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (localStorage.getItem('enem_splash_done')) return
    setVisible(true)
    setTimeout(() => {
      setMounted(true)
      setTimeout(() => inputRef.current?.focus(), 400)
    }, 50)
  }, [])

  if (!visible) return null

  const score     = parseFloat(scoreStr) || 0
  const scoreInfo = scoreStr ? getScoreInfo(score) : null
  const digits    = scoreStr.padStart(3, ' ').split('')
  const pct       = scoreInfo ? Math.min(scoreInfo.pct, 100) : 0
  const canSubmit = score >= 300 && score <= 1000 && email.includes('@')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enem/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, score }),
      })
    } catch { /* silent */ }
    // Save locally regardless
    localStorage.setItem('enem_splash_done', '1')
    localStorage.setItem('enem_score', String(score))
    localStorage.setItem('enem_email', email)
    setDone(true)
    setTimeout(() => {
      setMounted(false)
      setTimeout(() => setVisible(false), 500)
    }, 1400)
  }

  function skip() {
    localStorage.setItem('enem_splash_done', 'skipped')
    setMounted(false)
    setTimeout(() => setVisible(false), 400)
  }

  return (
    <>
      {/* ── CSS keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes orb-drift-1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-80px) scale(1.12); }
          66%      { transform: translate(-40px,50px) scale(0.92); }
        }
        @keyframes orb-drift-2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-80px,60px) scale(1.18); }
        }
        @keyframes orb-drift-3 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(50px,40px) scale(0.88); }
          80%      { transform: translate(-30px,-60px) scale(1.08); }
        }
        @keyframes star-pulse {
          0%,100% { opacity:.15; transform:scale(1); }
          50%      { opacity:.35; transform:scale(1.3); }
        }
        .orb-1 { animation: orb-drift-1 12s ease-in-out infinite; }
        .orb-2 { animation: orb-drift-2  9s ease-in-out infinite; }
        .orb-3 { animation: orb-drift-3 15s ease-in-out infinite; }
        .star  { animation: star-pulse   3s ease-in-out infinite; }
        .star:nth-child(2) { animation-delay:.8s; }
        .star:nth-child(3) { animation-delay:1.6s; }
        .star:nth-child(4) { animation-delay:2.4s; }
        .star:nth-child(5) { animation-delay:3.2s; }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          transition: 'opacity 0.4s ease',
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Floating orbs */}
        <div className="orb-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)' }} />
        <div className="orb-2 absolute bottom-[-15%] right-[-8%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' }} />
        <div className="orb-3 absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)' }} />

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[
            { top: '12%', left: '18%', size: 3 },
            { top: '25%', left: '75%', size: 2 },
            { top: '60%', left: '8%',  size: 2 },
            { top: '80%', left: '55%', size: 3 },
            { top: '45%', left: '90%', size: 2 },
          ].map((s, i) => (
            <div key={i} className="star absolute rounded-full bg-white"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size }} />
          ))}
        </div>

        {/* ── Card ────────────────────────────────────────────────── */}
        <div
          className="relative w-full max-w-md"
          style={{
            transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
            opacity: mounted ? 1 : 0,
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Top accent bar */}
            <div className="h-1 w-full" style={{
              background: scoreInfo
                ? `linear-gradient(90deg, ${scoreInfo.bar}, ${scoreInfo.color})`
                : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
            }} />

            <div className="px-8 pt-8 pb-10">

              {/* Badge */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <GraduationCap size={16} className="text-white" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ENEM 2024 / 2025</span>
              </div>

              {done ? (
                /* ── Success state ───────────────────────────────── */
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"
                    style={{ animation: 'star-pulse 1s ease-out 1' }}>
                    <Check size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Tudo certo!</h2>
                  <p className="text-sm text-slate-500">
                    Vamos mostrar as melhores faculdades para a sua nota.
                  </p>
                </div>

              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Headline */}
                  <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-1">
                    Qual foi sua nota
                  </h1>
                  <h1 className="text-3xl font-bold leading-tight mb-2" style={{ color: scoreInfo?.color ?? '#3b82f6' }}>
                    no ENEM?
                  </h1>
                  <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                    Vamos indicar faculdades e bolsas ideais para a sua pontuação.
                  </p>

                  {/* Score display */}
                  <div className="mb-2">
                    <div className="relative">
                      {/* Animated digit display overlay */}
                      <div
                        className="absolute inset-0 flex items-center pointer-events-none px-5"
                        aria-hidden
                      >
                        <span
                          className="text-4xl font-black tracking-widest tabular-nums"
                          style={{ color: scoreInfo?.color ?? '#cbd5e1' }}
                        >
                          {scoreStr
                            ? digits.map((d, i) => <AnimatedDigit key={i} digit={d} />)
                            : <span className="text-slate-300 font-light text-2xl">000 – 1000</span>
                          }
                        </span>
                      </div>
                      <input
                        ref={inputRef}
                        type="number"
                        min={0}
                        max={1000}
                        value={scoreStr}
                        onChange={e => {
                          const v = e.target.value
                          if (v === '' || (Number(v) >= 0 && Number(v) <= 1000)) setScoreStr(v)
                        }}
                        placeholder=" "
                        className="w-full text-4xl font-black tracking-widest tabular-nums px-5 py-4 rounded-2xl border-2 transition-all outline-none bg-slate-50"
                        style={{
                          color: 'transparent',
                          caretColor: scoreInfo?.color ?? '#3b82f6',
                          borderColor: scoreInfo?.color ?? '#e2e8f0',
                          boxShadow: scoreInfo ? `0 0 0 4px ${scoreInfo.color}15` : undefined,
                        }}
                      />
                    </div>

                    {/* Score bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            background: scoreInfo
                              ? `linear-gradient(90deg, ${scoreInfo.bar}, ${scoreInfo.color})`
                              : '#e2e8f0',
                          }}
                        />
                      </div>
                      {scoreInfo && (
                        <span
                          className="text-xs font-bold flex-shrink-0 transition-all duration-300"
                          style={{ color: scoreInfo.color }}
                        >
                          {scoreInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mt-6 mb-6">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Seu e-mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nome@email.com"
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-900 text-sm placeholder-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>

                  {/* CTA */}
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all duration-200"
                    style={{
                      background: canSubmit
                        ? `linear-gradient(135deg, ${scoreInfo?.color ?? '#3b82f6'}, ${scoreInfo?.bar ?? '#93c5fd'})`
                        : undefined,
                      color: canSubmit ? 'white' : undefined,
                      boxShadow: canSubmit ? `0 8px 24px ${(scoreInfo?.color ?? '#3b82f6')}40` : undefined,
                      backgroundColor: !canSubmit ? '#f1f5f9' : undefined,
                    }}
                    aria-label="Descobrir faculdades"
                  >
                    {submitting ? (
                      <span className="animate-pulse">Salvando...</span>
                    ) : (
                      <>
                        <span className={canSubmit ? 'text-white' : 'text-slate-400'}>
                          Descobrir faculdades
                        </span>
                        <ArrowRight size={16} className={canSubmit ? 'text-white' : 'text-slate-400'} />
                      </>
                    )}
                  </button>

                  {/* Skip */}
                  <div className="text-center mt-5">
                    <button
                      type="button"
                      onClick={skip}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                    >
                      Pular por agora <ChevronRight size={11} />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Hint text below card */}
          {!done && (
            <p className="text-center text-[11px] text-slate-500 mt-4 opacity-60">
              Seus dados são privados e não serão compartilhados.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
