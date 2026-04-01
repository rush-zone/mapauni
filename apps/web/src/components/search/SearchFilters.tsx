'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const STATES = [
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],
  ['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],
  ['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
  ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
  ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],
  ['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],
  ['SE','Sergipe'],['TO','Tocantins'],
]

const ORG_ACADEMICA = [
  'Universidade',
  'Centro Universitário',
  'Faculdade',
  'Instituto Federal de Educação, Ciência e Tecnologia',
  'Centro Federal de Educação Tecnológica',
]

interface Props {
  params: Record<string, string | undefined>
  modo: 'cursos' | 'universidades'
}

export function SearchFilters({ params, modo }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const current = new URLSearchParams(searchParams.toString())
    if (value) current.set(key, value)
    else current.delete(key)
    current.delete('page')
    router.push(`/busca?${current.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-5">
      <h3 className="font-semibold text-gray-800">Filtros</h3>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
        <select
          value={params.state || ''}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {STATES.map(([uf, nome]) => (
            <option key={uf} value={uf}>{nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Instituição</label>
        <select
          value={params.type || ''}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="FEDERAL">Federal</option>
          <option value="ESTADUAL">Estadual</option>
          <option value="MUNICIPAL">Municipal</option>
          <option value="PRIVADA">Privada</option>
        </select>
      </div>

      {modo === 'universidades' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Organização Acadêmica</label>
            <select
              value={params.orgAcademica || ''}
              onChange={(e) => updateFilter('orgAcademica', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {ORG_ACADEMICA.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="comCursos"
              checked={params.comCursos === 'true'}
              onChange={(e) => updateFilter('comCursos', e.target.checked ? 'true' : '')}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="comCursos" className="text-sm text-gray-700 cursor-pointer">
              Apenas com cursos cadastrados
            </label>
          </div>
        </>
      )}

      {modo === 'cursos' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Modalidade</label>
            <select
              value={params.modality || ''}
              onChange={(e) => updateFilter('modality', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="EAD">EAD</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Turno</label>
            <select
              value={params.shift || ''}
              onChange={(e) => updateFilter('shift', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="MANHA">Manhã</option>
              <option value="TARDE">Tarde</option>
              <option value="NOITE">Noite</option>
              <option value="INTEGRAL">Integral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Grau</label>
            <select
              value={params.degree || ''}
              onChange={(e) => updateFilter('degree', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="BACHARELADO">Bacharelado</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="TECNOLOGO">Tecnólogo</option>
              <option value="MBA">MBA</option>
            </select>
          </div>
        </>
      )}
    </div>
  )
}
