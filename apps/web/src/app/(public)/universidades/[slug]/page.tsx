import Link from 'next/link'
import { api } from '@/lib/api'
import { LeadForm } from '@/components/lead/LeadForm'
import { UniversityGallery } from './UniversityGallery'
import { ReviewForm } from './ReviewForm'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const uni: any = await api.get(`/universities/${params.slug}`)
    return {
      title: `${uni.name} — InfoUni`,
      description: uni.description || `Conheça a ${uni.name} em ${uni.city}, ${uni.state}.`,
    }
  } catch {
    return { title: 'Universidade — InfoUni' }
  }
}

const TYPE_LABEL: Record<string, string> = {
  FEDERAL: 'Federal', ESTADUAL: 'Estadual', MUNICIPAL: 'Municipal', PRIVADA: 'Privada',
}

function Section({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: string }) {
  return (
    <div className="bg-white border rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children ?? <p className="text-gray-400 text-sm">{empty ?? 'Nenhum dado disponível ainda.'}</p>}
    </div>
  )
}

function Badge({ label, color = 'gray' }: { label: string; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color] || colors.gray}`}>{label}</span>
}

export default async function UniversityPage({ params }: { params: { slug: string } }) {
  let uni: any
  try {
    uni = await api.get(`/universities/${params.slug}`)
  } catch {
    notFound()
  }

  const approvedReviews = uni.reviews ?? []
  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: uni.name,
    url: uni.website,
    foundingDate: uni.foundedYear,
    address: { '@type': 'PostalAddress', addressLocality: uni.city, addressRegion: uni.state, addressCountry: 'BR' },
    ...(avgRating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating, reviewCount: approvedReviews.length } }),
  }

  const cursosPorGrau: Record<string, any[]> = {}
  for (const c of uni.cursosAutorizados ?? []) {
    const grau = c.grau || 'Outros'
    if (!cursosPorGrau[grau]) cursosPorGrau[grau] = []
    cursosPorGrau[grau].push(c)
  }

  const typeColor = uni.type === 'FEDERAL' ? 'blue' : uni.type === 'ESTADUAL' ? 'gray' : uni.type === 'MUNICIPAL' ? 'green' : 'orange'

  return (
    <main className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="flex items-center px-6 py-4 border-b bg-white shadow-sm">
        <Link href="/" className="text-xl font-bold text-blue-600 mr-4">InfoUni</Link>
        <span className="text-gray-400 text-sm">
          / <Link href="/busca?modo=universidades" className="hover:text-blue-600">Universidades</Link>
          {' / '}{uni.name}
        </span>
      </nav>

      {/* Header */}
      <div className="bg-white border-b">
        {uni.coverUrl && (
          <div className="h-48 overflow-hidden">
            <img src={uni.coverUrl} alt="Capa" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {uni.logoUrl
                ? <img src={uni.logoUrl} alt={uni.name} className="w-full h-full object-contain p-2" />
                : <span className="text-2xl font-bold text-blue-600">{uni.name[0]}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{uni.name}</h1>
                <Badge label={TYPE_LABEL[uni.type] || uni.type} color={typeColor} />
                <Badge label={uni.isActive ? 'Ativa' : 'Inativa'} color={uni.isActive ? 'green' : 'red'} />
              </div>
              {uni.sigla && <p className="text-sm text-gray-400 mt-0.5">{uni.sigla}</p>}
              <p className="text-sm text-gray-500 mt-1">
                {uni.academicOrg && `${uni.academicOrg} • `}
                {uni.city}, {uni.state}
                {uni.foundedYear ? ` • Fundada em ${uni.foundedYear}` : ''}
                {uni.mecCode ? ` • e-MEC ${uni.mecCode}` : ''}
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {uni.igc && <Badge label={`IGC ${uni.igc}`} color="blue" />}
                {uni.ci && <Badge label={`CI ${uni.ci}`} color="blue" />}
                {avgRating && <Badge label={`★ ${avgRating} (${approvedReviews.length} avaliações)`} color="yellow" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">

            {/* Detalhes da IES */}
            <Section title="Detalhes da IES">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  { label: 'Código e-MEC', value: uni.mecCode },
                  { label: 'Situação', value: uni.isActive ? 'Ativa' : 'Inativa' },
                  { label: 'Tipo', value: TYPE_LABEL[uni.type] || uni.type },
                  { label: 'Organização Acadêmica', value: uni.academicOrg },
                  { label: 'Sigla', value: uni.sigla },
                  { label: 'Categoria', value: uni.category },
                  { label: 'Município', value: uni.city },
                  { label: 'Estado', value: uni.state },
                  { label: 'Código IBGE', value: uni.ibgeCode },
                  { label: 'Ano de Fundação', value: uni.foundedYear },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
                    <dd className="text-gray-800 font-medium mt-0.5">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            {uni.galleryImages?.length > 0 && (
              <Section title="Galeria">
                <UniversityGallery images={uni.galleryImages} />
              </Section>
            )}

            {uni.description && (
              <Section title="Sobre a instituição">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{uni.description}</p>
              </Section>
            )}

            {/* Cursos cadastrados na plataforma */}
            <Section
              title={`Cursos na plataforma${uni.courses?.length ? ` (${uni.courses.length})` : ''}`}
              empty="Nenhum curso cadastrado nesta plataforma ainda."
            >
              {uni.courses?.length > 0 && (
                <div className="space-y-3">
                  {uni.courses.map((course: any) => (
                    <Link key={course.id} href={`/cursos/${course.slug}`}
                      className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 transition group">
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-700">{course.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {course.modality} • {course.degree} • {course.duration} sem.
                          {course.enade ? ` • ENADE ${course.enade}` : ''}
                        </p>
                      </div>
                      {course.priceMonthly
                        ? <p className="text-sm font-semibold text-gray-800 shrink-0 ml-4">R$ {course.priceMonthly.toLocaleString('pt-BR')}/mês</p>
                        : <p className="text-sm text-gray-400 shrink-0 ml-4">Consulte</p>}
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            {/* Cursos autorizados e-MEC */}
            <Section
              title={`Cursos autorizados pelo e-MEC${uni.cursosAutorizados?.length ? ` (${uni.cursosAutorizados.length})` : ''}`}
              empty="Dados e-MEC ainda não sincronizados. Use o Admin Master para sincronizar."
            >
              {uni.cursosAutorizados?.length > 0 && (
                <div className="space-y-6">
                  {Object.entries(cursosPorGrau).map(([grau, cursos]) => (
                    <div key={grau}>
                      <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">{grau}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Curso</th>
                              <th className="px-3 py-2 text-left">Modalidade</th>
                              <th className="px-3 py-2 text-left">Município</th>
                              <th className="px-3 py-2 text-left">Situação</th>
                              <th className="px-3 py-2 text-right">Vagas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(cursos as any[]).map((c) => (
                              <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-900">{c.nome}</td>
                                <td className="px-3 py-2 text-gray-500">{c.modalidade || '—'}</td>
                                <td className="px-3 py-2 text-gray-500">{c.municipio ? `${c.municipio}/${c.uf}` : '—'}</td>
                                <td className="px-3 py-2">
                                  <Badge label={c.situacao || '—'} color={c.situacao === 'Em Atividade' ? 'green' : 'gray'} />
                                </td>
                                <td className="px-3 py-2 text-gray-500 text-right">{c.vagas ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Atos Regulatórios */}
            <Section
              title="Atos Regulatórios"
              empty="Dados e-MEC ainda não sincronizados. Use o Admin Master para sincronizar."
            >
              {uni.atosRegulatorios?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Número</th>
                        <th className="px-3 py-2 text-left">Publicação</th>
                        <th className="px-3 py-2 text-left">Situação</th>
                        <th className="px-3 py-2 text-left">Arquivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {uni.atosRegulatorios.map((a: any) => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{a.tipo}</td>
                          <td className="px-3 py-2 text-gray-500">{a.numero || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {a.dataPublicacao ? new Date(a.dataPublicacao).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-3 py-2"><Badge label={a.situacao || '—'} color="blue" /></td>
                          <td className="px-3 py-2">
                            {a.arquivo
                              ? <a href={a.arquivo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Ver PDF</a>
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* Processos e-MEC */}
            <Section
              title="Processos e-MEC"
              empty="Dados e-MEC ainda não sincronizados. Use o Admin Master para sincronizar."
            >
              {uni.processosEmec?.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Número</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Autuação</th>
                        <th className="px-3 py-2 text-left">Situação</th>
                        <th className="px-3 py-2 text-left">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {uni.processosEmec.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs text-gray-700">{p.numero}</td>
                          <td className="px-3 py-2 text-gray-500">{p.tipo || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {p.dataAutuacao ? new Date(p.dataAutuacao).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-3 py-2"><Badge label={p.situacao || '—'} color="gray" /></td>
                          <td className="px-3 py-2 text-gray-500">{p.resultado || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>

            {/* Ocorrências */}
            <Section
              title="Ocorrências"
              empty="Dados e-MEC ainda não sincronizados. Use o Admin Master para sincronizar."
            >
              {uni.ocorrenciasEmec?.length > 0 && (
                <div className="space-y-3">
                  {uni.ocorrenciasEmec.map((o: any) => (
                    <div key={o.id} className="p-4 border rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge label={o.tipo || 'Ocorrência'} color="yellow" />
                        {o.situacao && <Badge label={o.situacao} color="gray" />}
                        {o.dataOcorrencia && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {new Date(o.dataOcorrencia).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {o.descricao && <p className="text-sm text-gray-600 mt-1">{o.descricao}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Acervo Acadêmico */}
            <Section
              title="Acervo Acadêmico"
              empty="Dados e-MEC ainda não sincronizados. Use o Admin Master para sincronizar."
            >
              {uni.acervoAcademico && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest">Responsável pelo Acervo</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      {[
                        { label: 'Instituição Responsável', value: uni.acervoAcademico.instituicaoResponsavel },
                        { label: 'Responsável Legal', value: uni.acervoAcademico.responsavelLegal },
                        { label: 'Endereço', value: uni.acervoAcademico.endereco },
                        { label: 'Município/UF', value: uni.acervoAcademico.municipio ? `${uni.acervoAcademico.municipio}/${uni.acervoAcademico.uf}` : null },
                        { label: 'E-mail', value: uni.acervoAcademico.email },
                        { label: 'Telefone', value: uni.acervoAcademico.telefone },
                      ].filter(d => d.value).map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
                          <dd className="text-gray-800 font-medium mt-0.5">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-widest">Acervo Digital</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase tracking-wide">Tipo de Acervo</dt>
                        <dd className="text-gray-800 font-medium mt-0.5">{uni.acervoAcademico.tipoAcervo || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase tracking-wide">Diploma Digital</dt>
                        <dd className="mt-0.5">
                          <Badge label={uni.acervoAcademico.diplomaDigital ? 'Sim' : 'Não'} color={uni.acervoAcademico.diplomaDigital ? 'green' : 'gray'} />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase tracking-wide">Registro de Diploma</dt>
                        <dd className="text-gray-800 font-medium mt-0.5">{uni.acervoAcademico.registroDiploma || '—'}</dd>
                      </div>
                      {uni.acervoAcademico.urlDiplomaDigital && (
                        <div>
                          <dt className="text-gray-400 text-xs uppercase tracking-wide">Portal de Diplomas</dt>
                          <dd className="mt-0.5">
                            <a href={uni.acervoAcademico.urlDiplomaDigital} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                              {uni.acervoAcademico.urlDiplomaDigital}
                            </a>
                          </dd>
                        </div>
                      )}
                      {uni.acervoAcademico.urlHistoricoDigital && (
                        <div>
                          <dt className="text-gray-400 text-xs uppercase tracking-wide">Histórico Digital</dt>
                          <dd className="mt-0.5">
                            <a href={uni.acervoAcademico.urlHistoricoDigital} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                              {uni.acervoAcademico.urlHistoricoDigital}
                            </a>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}
            </Section>

            {/* Avaliações */}
            <Section title="Avaliações de alunos">
              {avgRating && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-400 text-2xl">★</span>
                  <span className="text-2xl font-bold">{avgRating}</span>
                  <span className="text-gray-400 text-sm">/ 5 ({approvedReviews.length} avaliações)</span>
                </div>
              )}
              {approvedReviews.length > 0 ? (
                <div className="space-y-5 mb-6">
                  {approvedReviews.map((review: any) => (
                    <div key={review.id} className="border-b pb-5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-yellow-400 text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="text-sm font-medium text-gray-800">{review.authorName}</span>
                        {review.courseStudied && <span className="text-xs text-gray-400">• {review.courseStudied}</span>}
                      </div>
                      {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
                      {review.replyText && (
                        <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-200 bg-blue-50 rounded-r-lg py-2 pr-3">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Resposta da instituição</p>
                          <p className="text-sm text-gray-700">{review.replyText}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-6">Nenhuma avaliação ainda. Seja o primeiro!</p>
              )}
              <div className="border-t pt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Deixe sua avaliação</h3>
                <ReviewForm universitySlug={uni.slug} />
              </div>
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Dados rápidos */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Dados da IES</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Código e-MEC', value: uni.mecCode },
                  { label: 'Tipo', value: TYPE_LABEL[uni.type] || uni.type },
                  { label: 'Organização', value: uni.academicOrg },
                  { label: 'Situação', value: uni.isActive ? 'Ativa' : 'Inativa' },
                  { label: 'Cursos e-MEC', value: uni.cursosAutorizados?.length || null },
                  { label: 'Atos Regulatórios', value: uni.atosRegulatorios?.length || null },
                  { label: 'Processos', value: uni.processosEmec?.length || null },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
              {uni.mecCode && (
                <a
                  href={`https://emec.mec.gov.br/emec/consulta-cadastro/detalhamento/d96957f455f6405d14c6542552b0f6eb/${Buffer.from(String(uni.mecCode)).toString('base64')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 border border-blue-300 text-blue-600 text-sm font-medium rounded-xl hover:bg-blue-50 transition"
                >
                  Ver no e-MEC oficial ↗
                </a>
              )}
            </div>

            {/* Contato */}
            <div className="bg-white border rounded-2xl p-6 space-y-3">
              <h2 className="text-base font-semibold text-gray-900">Contato</h2>
              {!uni.phone && !uni.whatsapp && !uni.website && !uni.email && (
                <p className="text-sm text-gray-400">Nenhum contato cadastrado.</p>
              )}
              {uni.email && (
                <a href={`mailto:${uni.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                  ✉️ {uni.email}
                </a>
              )}
              {uni.phone && (
                <a href={`tel:${uni.phone}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                  📞 {uni.phone}
                </a>
              )}
              {uni.whatsapp && (
                <a
                  href={`https://wa.me/55${uni.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition"
                >
                  💬 Chamar no WhatsApp
                </a>
              )}
              {uni.website && (
                <a href={uni.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  🌐 Site oficial
                </a>
              )}
              {uni.address && (
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="shrink-0">📍</span>{uni.address}
                </p>
              )}
              {(uni.instagram || uni.facebook || uni.linkedin || uni.youtube) && (
                <div className="flex gap-3 pt-2 flex-wrap">
                  {uni.instagram && <a href={`https://instagram.com/${uni.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-500 hover:underline">Instagram</a>}
                  {uni.facebook && <a href={uni.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:underline">Facebook</a>}
                  {uni.linkedin && <a href={uni.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">LinkedIn</a>}
                  {uni.youtube && <a href={uni.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-red-500 hover:underline">YouTube</a>}
                </div>
              )}
            </div>

            {/* Lead form */}
            <div className="bg-white border rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Solicitar informações</h2>
              <LeadForm universityId={uni.id} universityName={uni.name} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
