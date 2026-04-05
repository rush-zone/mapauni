'use client'
import { useState, useEffect, useRef } from 'react'
import { GraduationCap, Check, Pencil } from 'lucide-react'

const ENEM_EVENT = 'enem-score-updated'

function scoreColor(s: number): string {
  if (s < 450) return '#94a3b8'
  if (s < 550) return '#3b82f6'
  if (s < 650) return '#0d9488'
  if (s < 750) return '#16a34a'
  if (s < 850) return '#d97706'
  if (s < 950) return '#ea580c'
  return '#db2777'
}

function scoreLabel(s: number): string {
  if (s < 450) return 'Continue estudando'
  if (s < 550) return 'Bom começo'
  if (s < 650) return 'Bom resultado'
  if (s < 750) return 'Muito bom'
  if (s < 850) return 'Ótimo'
  if (s < 950) return 'Excelente'
  return 'Incrível'
}

/* ── Input acima do formulário ────────────────────────────────────────────── */
export function EnemScoreInput() {
  const [raw, setRaw]       = useState('')
  const [saved, setSaved]   = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const v = localStorage.getItem('enem_score')
    if (v) setSaved(parseFloat(v))
    else setEditing(true)   // first time: show input
  }, [])

  function confirm() {
    const n = parseFloat(raw)
    if (!raw || n < 0 || n > 1000) return
    localStorage.setItem('enem_score', String(n))
    window.dispatchEvent(new CustomEvent(ENEM_EVENT, { detail: n }))
    setSaved(n)
    setEditing(false)
    setRaw('')
  }

  function startEdit() {
    setEditing(true)
    setRaw(saved ? String(saved) : '')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const color = saved ? scoreColor(saved) : '#94a3b8'
  const pct   = saved ? Math.min(saved / 10, 100) : 0

  return (
    <div className="mb-4 pb-4 border-b border-slate-100">
      {/* Label row */}
      <div className="flex items-center gap-2 mb-2.5">
        <GraduationCap size={14} style={{ color }} />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Sua nota no ENEM
        </span>
        {saved && !editing && (
          <button onClick={startEdit}
            className="ml-auto text-slate-300 hover:text-slate-500 transition-colors">
            <Pencil size={12} />
          </button>
        )}
      </div>

      {editing ? (
        /* ── input mode ──────────────────────────────────────── */
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="number"
            min={0}
            max={1000}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirm()}
            placeholder="Ex: 750"
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none text-sm font-semibold text-slate-900 bg-slate-50 transition-all"
          />
          <button
            onClick={confirm}
            disabled={!raw || parseFloat(raw) < 0 || parseFloat(raw) > 1000}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: color, color: 'white' }}
          >
            <Check size={16} />
          </button>
        </div>
      ) : saved ? (
        /* ── saved display ───────────────────────────────────── */
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-2xl font-black tabular-nums" style={{ color }}>
              {saved.toLocaleString('pt-BR')}
              <span className="text-sm font-semibold text-slate-400 ml-1">pts</span>
            </span>
            <span className="text-xs font-bold" style={{ color }}>{scoreLabel(saved)}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, background: color }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ── Badge no header ──────────────────────────────────────────────────────── */
export function EnemScoreBadge() {
  const [score, setScore] = useState<number | null>(null)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const v = localStorage.getItem('enem_score')
    if (v) setScore(parseFloat(v))

    function handle(e: Event) {
      const n = (e as CustomEvent<number>).detail
      setScore(n)
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }
    window.addEventListener(ENEM_EVENT, handle)
    return () => window.removeEventListener(ENEM_EVENT, handle)
  }, [])

  if (!score) return null

  const color = scoreColor(score)
  const label = scoreLabel(score)

  return (
    <div
      className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all duration-300"
      style={{
        color,
        borderColor: color + '40',
        background: color + '10',
        transform: pulse ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <GraduationCap size={12} style={{ color }} />
      <span>{score.toLocaleString('pt-BR')}</span>
      <span className="font-medium opacity-70">· {label}</span>
    </div>
  )
}
