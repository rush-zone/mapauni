'use client'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFiltersProps {
  params: Record<string, string | undefined>
}

export function SearchFilters({ params }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const current = new URLSearchParams(searchParams.toString())
    if (value) {
      current.set(key, value)
    } else {
      current.delete(key)
    }
    router.push(`/busca?${current.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border p-5 space-y-5">
      <h3 className="font-semibold text-gray-800">Filtros</h3>

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

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
        <select
          value={params.state || ''}
          onChange={(e) => updateFilter('state', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="AC">Acre</option>
          <option value="AL">Alagoas</option>
          <option value="AP">Amapá</option>
          <option value="AM">Amazonas</option>
          <option value="BA">Bahia</option>
          <option value="CE">Ceará</option>
          <option value="DF">Distrito Federal</option>
          <option value="ES">Espírito Santo</option>
          <option value="GO">Goiás</option>
          <option value="MA">Maranhão</option>
          <option value="MT">Mato Grosso</option>
          <option value="MS">Mato Grosso do Sul</option>
          <option value="MG">Minas Gerais</option>
          <option value="PA">Pará</option>
          <option value="PB">Paraíba</option>
          <option value="PR">Paraná</option>
          <option value="PE">Pernambuco</option>
          <option value="PI">Piauí</option>
          <option value="RJ">Rio de Janeiro</option>
          <option value="RN">Rio Grande do Norte</option>
          <option value="RS">Rio Grande do Sul</option>
          <option value="RO">Rondônia</option>
          <option value="RR">Roraima</option>
          <option value="SC">Santa Catarina</option>
          <option value="SP">São Paulo</option>
          <option value="SE">Sergipe</option>
          <option value="TO">Tocantins</option>
        </select>
      </div>
    </div>
  )
}
