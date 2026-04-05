'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TABS = [
  { modo: 'cursos', label: 'Cursos', placeholder: 'Ex: Medicina, Engenharia, Direito...' },
  { modo: 'universidades', label: 'Universidades', placeholder: 'Ex: USP, PUC, UFMG...' },
  { modo: 'universidades', label: 'Cidade', placeholder: 'Ex: São Paulo, Campinas, Rio...', useCity: true },
]

const UNI_PATTERNS = [
  /\bpuc\b/i, /\busp\b/i, /\bufmg\b/i, /\bufsp\b/i, /\bufrj\b/i,
  /\bunb\b/i, /\bunicamp\b/i, /\bfgv\b/i, /\bmackenzie\b/i,
  /\bsenac\b/i, /\bsesc\b/i, /\bsesi\b/i,
  /\bfaculdade\b/i, /\buniversidade\b/i, /\bcentro universit/i,
  /\binstituto\b/i, /\bescola superior\b/i,
  /^[A-Z]{2,6}$/,
]

const COURSE_PATTERNS = [
  /\bmedicina\b/i, /\bdireito\b/i, /\bengenharia\b/i, /\bpedagogia\b/i,
  /\bpsicologia\b/i, /\badministra/i, /\bcontábeis\b/i, /\bcontabeis\b/i,
  /\bnurse\b/i, /\benfermagem\b/i, /\bfisioterapia\b/i, /\bodontologia\b/i,
  /\bnutri/i, /\bfarmácia\b/i, /\bfarmacia\b/i, /\barquitetur/i,
  /\bcomputação\b/i, /\bcomputacao\b/i, /\bsistemas\b/i, /\binformática\b/i,
  /\bbiologia\b/i, /\bquímica\b/i, /\bfísica\b/i, /\bmatematica\b/i,
  /\bletras\b/i, /\bhistória\b/i, /\bgeografia\b/i, /\bfilosofia\b/i,
  /\beconomia\b/i, /\bmarketing\b/i, /\bdesign\b/i, /\bjornalismo\b/i,
  /\bpublicidade\b/i, /\bturismo\b/i, /\bgastronomia\b/i, /\bmoda\b/i,
  /\bveterinária\b/i, /\bveterinaria\b/i, /\bagronomia\b/i,
]

function looksLikeUniversity(q: string) {
  return UNI_PATTERNS.some((p) => p.test(q.trim()))
}

function looksLikeCourse(q: string) {
  return COURSE_PATTERNS.some((p) => p.test(q.trim()))
}

export function SearchBar() {
  const [activeTab, setActiveTab] = useState(0)
  const [query, setQuery] = useState('')
  const [hintVisible, setHintVisible] = useState(false)
  const [autoSwitching, setAutoSwitching] = useState(false)
  const router = useRouter()

  const showUniHint = useMemo(
    () => activeTab === 0 && query.length >= 2 && looksLikeUniversity(query),
    [activeTab, query]
  )

  // Hint para curso digitado nas abas Universidades ou Cidade
  const showCourseHint = useMemo(
    () => activeTab !== 0 && query.length >= 3 && looksLikeCourse(query),
    [activeTab, query]
  )

  const [courseHintVisible, setCourseHintVisible] = useState(false)

  // Animate hints in/out
  useEffect(() => {
    if (showUniHint) {
      const t = setTimeout(() => setHintVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setHintVisible(false)
    }
  }, [showUniHint])

  useEffect(() => {
    if (showCourseHint) {
      const t = setTimeout(() => setCourseHintVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setCourseHintVisible(false)
    }
  }, [showCourseHint])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (showUniHint) {
      // Bloqueado — anima e direciona para universidades
      switchToUni()
      return
    }
    const tab = TABS[activeTab]
    const params = new URLSearchParams()
    params.set('modo', tab.modo)
    if (query.trim()) params.set(tab.useCity ? 'city' : 'q', query.trim())
    router.push(`/busca?${params.toString()}`)
  }

  function switchToUni() {
    setAutoSwitching(true)
    setTimeout(() => {
      setActiveTab(1)
      setAutoSwitching(false)
    }, 350)
  }

  function switchToCursos() {
    setAutoSwitching(true)
    setTimeout(() => {
      setActiveTab(0)
      setAutoSwitching(false)
    }, 350)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => { setActiveTab(i); setQuery('') }}
            className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2 mt-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={TABS[activeTab].placeholder}
            className={`w-full px-5 py-4 text-lg text-gray-900 placeholder-gray-400 border-2 rounded-xl focus:outline-none transition-all duration-200 bg-white ${
              showUniHint
                ? 'border-amber-400 focus:border-amber-500'
                : 'border-gray-200 focus:border-blue-500'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={autoSwitching}
          className={`px-8 py-4 text-white text-lg font-semibold rounded-xl transition-all duration-200 ${
            showUniHint
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:opacity-60`}
        >
          {autoSwitching ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </span>
          ) : showUniHint ? '→ Uni' : 'Buscar'}
        </button>
      </form>

      {/* University hint — elegant card */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ease-out ${
          hintVisible ? 'max-h-24 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-1'
        }`}
        style={{ transform: hintVisible ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 text-base">
            🎓
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 leading-tight">
              Buscando uma universidade?
            </p>
            <p className="text-xs text-amber-700 mt-0.5 truncate">
              <span className="font-medium">"{query}"</span> parece ser uma instituição de ensino
            </p>
          </div>
          <button
            type="button"
            onClick={switchToUni}
            className="flex-shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Ir para Universidades →
          </button>
        </div>
      </div>

      {/* Course hint — when typing a course in Universidades or Cidade tab */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ease-out ${
          courseHintVisible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ transform: courseHintVisible ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0 text-base">
            📚
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900 leading-tight">
              Buscando um curso?
            </p>
            <p className="text-xs text-blue-700 mt-0.5 truncate">
              <span className="font-medium">"{query}"</span> parece ser o nome de um curso
            </p>
          </div>
          <button
            type="button"
            onClick={switchToCursos}
            className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Ir para Cursos →
          </button>
        </div>
      </div>

      {/* Default helper text */}
      {activeTab === 0 && !showUniHint && query.length === 0 && (
        <p className="text-xs text-gray-400 mt-2 text-left">
          Digite o nome do <strong>curso</strong> que deseja — ex: Medicina, Engenharia de Software, Direito
        </p>
      )}
    </div>
  )
}
