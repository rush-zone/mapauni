import Link from 'next/link'
import { StepSearch } from '@/components/search/StepSearch'
import { AreaSearch } from '@/components/search/AreaSearch'
import { UniversidadesProximas } from '@/components/UniversidadesProximas'
import { ArrowRight, MapPin, BarChart2, Zap } from 'lucide-react'


const UF_DESTAQUE = [
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'PE', nome: 'Pernambuco' },
]

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/stats`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json() as Promise<{ universities: number; courses: number }>
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-slate-900 tracking-tight">InfoUni</Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/busca" className="text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium">
              Explorar
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Entrar
            </Link>
            <Link href="/registro"
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
              style={{ background: '#0F172A' }}>
              Para universidades
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-14">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-6">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span className="text-xs font-medium text-slate-600 tracking-wide">
                {stats
                  ? `${stats.universities.toLocaleString('pt-BR')} instituições · ${stats.courses.toLocaleString('pt-BR')} cursos`
                  : 'Dados oficiais MEC/INEP'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.08] tracking-tight mb-6">
              Encontre o curso certo<br />
              <span className="text-blue-600">para o seu futuro.</span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-xl leading-relaxed">
              Compare cursos e universidades em todo o Brasil com dados oficiais do MEC. Filtre por nota ENEM, localização, modalidade e muito mais.
            </p>
          </div>
        </div>

        {/* Search — full width of the 6xl container */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="bg-white rounded-2xl border border-slate-200 p-6"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <StepSearch />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap gap-8 items-center">
          {[
            { label: 'Instituições cadastradas', value: stats?.universities.toLocaleString('pt-BR') ?? '—' },
            { label: 'Cursos disponíveis',       value: stats?.courses.toLocaleString('pt-BR')      ?? '—' },
            { label: 'Estados cobertos',          value: '27' },
            { label: 'Fonte dos dados',           value: 'MEC / INEP' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              Icon: Zap,
              title: 'Busca inteligente',
              desc: 'Filtre por área, modalidade, turno, grau e localização. Resultados em tempo real.',
            },
            {
              Icon: BarChart2,
              title: 'Notas e indicadores',
              desc: 'Consulte notas de corte ENEM, ENADE, IGC e CPC por curso e instituição.',
            },
            {
              Icon: MapPin,
              title: 'Universidades próximas',
              desc: 'Encontre instituições perto de você com filtro por raio de distância e mapa interativo.',
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-slate-100 bg-white"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                <Icon size={16} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Áreas */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Explorar por área</h2>
              <p className="text-sm text-slate-400 mt-1">Selecione uma área de conhecimento</p>
            </div>
            <Link href="/busca"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Todos os cursos <ArrowRight size={14} />
            </Link>
          </div>
          <AreaSearch />
        </div>
      </section>

      {/* Mapa */}
      <UniversidadesProximas />

      {/* Estados */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Explorar por estado</h2>
        <p className="text-sm text-slate-400 mb-8">Universidades e cursos em todos os estados do Brasil</p>
        <div className="flex flex-wrap gap-2.5">
          {UF_DESTAQUE.map(({ uf, nome }) => (
            <Link key={uf} href={`/busca&state=${uf}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-700 transition-all"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span className="text-xs font-bold text-slate-400">{uf}</span>
              <span>{nome}</span>
            </Link>
          ))}
          <Link href="/busca"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white border border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-100 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
              Sua universidade no InfoUni
            </h2>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Alcance estudantes em todo o Brasil. Gerencie cursos, leads e avaliações em um só lugar.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/registro"
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors text-sm">
              Cadastrar agora <ArrowRight size={14} />
            </Link>
            <Link href="/login"
              className="px-6 py-3 border border-slate-700 text-slate-300 font-medium rounded-lg hover:border-slate-500 hover:text-white transition-colors text-sm">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-900">InfoUni</span>
          <p className="text-xs text-slate-400">
            Dados oficiais MEC/INEP · {new Date().getFullYear()}
          </p>
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            Área da universidade
          </Link>
        </div>
      </footer>
    </div>
  )
}
