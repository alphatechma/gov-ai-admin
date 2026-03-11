import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, Trash2, FileArchive, AlertCircle, CheckCircle2, Info } from 'lucide-react'

const ELECTION_API = import.meta.env.VITE_ELECTION_API_URL || '/election-api'

const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
]

interface Election {
  id: string
  year: number
  type: string
  round: number
  state: string
  city: string
  cargo: string
  totalRecords: number
  totalCandidates: number
  createdAt: string
}

interface Municipality {
  name: string
}

interface ImportResult {
  elections: { id: string; cargo: string; city: string; imported: number }[]
  totalImported: number
  totalSkipped: number
  cargosFound: string[]
}

// Anos municipais: divisiveis por 4 (2024, 2020, 2016...)
// Anos estaduais/federais: ano par nao divisivel por 4 (2022, 2018, 2014...)
function isMunicipalYear(year: number): boolean {
  return year % 4 === 0
}

export function ElectionsImportPage() {
  const queryClient = useQueryClient()

  const [year, setYear] = useState('2024')
  const [state, setState] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const isMunicipal = useMemo(() => isMunicipalYear(parseInt(year, 10)), [year])

  // Buscar eleicoes importadas
  const { data: elections, isLoading: loadingElections } = useQuery<Election[]>({
    queryKey: ['admin-elections'],
    queryFn: () => axios.get(`${ELECTION_API}/elections`).then(r => r.data),
  })

  // Buscar municipios quando estado for selecionado (so para anos municipais)
  const { data: municipalities, isLoading: loadingMunicipalities } = useQuery<Municipality[]>({
    queryKey: ['municipalities', state],
    queryFn: () => axios.get(`${ELECTION_API}/elections/tse/municipalities/${state}`).then(r => r.data),
    enabled: !!state && isMunicipal,
  })

  // Mutation de importacao
  const importMutation = useMutation<ImportResult, Error>({
    mutationFn: async () => {
      if (!file || !state || !year) {
        throw new Error('Preencha todos os campos')
      }
      if (isMunicipal && !municipality) {
        throw new Error('Selecione o municipio para eleicoes municipais')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('year', year)
      formData.append('state', state)
      if (isMunicipal && municipality) {
        formData.append('municipalityName', municipality)
      }

      const { data } = await axios.post(`${ELECTION_API}/elections/import/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-elections'] })
      setFile(null)
    },
  })

  // Mutation de delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${ELECTION_API}/elections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-elections'] }),
  })

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])
  const handleDragLeave = useCallback(() => setDragOver(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.zip')) setFile(dropped)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const cargoLabel = (cargo: string) => {
    const map: Record<string, string> = {
      'VEREADOR': 'Vereador',
      'PREFEITO': 'Prefeito',
      'VICE-PREFEITO': 'Vice-Prefeito',
      'DEPUTADO ESTADUAL': 'Dep. Estadual',
      'DEPUTADO FEDERAL': 'Dep. Federal',
      'SENADOR': 'Senador',
      'GOVERNADOR': 'Governador',
      'VICE-GOVERNADOR': 'Vice-Governador',
      'PRESIDENTE': 'Presidente',
    }
    return map[cargo] || cargo
  }

  const typeLabel = (type: string) =>
    type === 'municipal' ? 'Municipal' : 'Estadual/Federal'

  const years = Array.from({ length: 10 }, (_, i) => String(2024 - i * 2))

  const canImport = file && state && year && (isMunicipal ? !!municipality : true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dados Eleitorais</h1>
        <p className="text-sm text-muted-foreground">
          Importe os dados do TSE para disponibilizar analises eleitorais aos tenants
        </p>
      </div>

      {/* Formulario de importacao */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Importar ZIP do TSE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Ano</label>
              <Select value={year} onChange={e => { setYear(e.target.value); setMunicipality('') }}>
                {years.map(y => (
                  <option key={y} value={y}>
                    {y} — {isMunicipalYear(parseInt(y, 10)) ? 'Municipal' : 'Estadual/Federal'}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <Select value={state} onChange={e => { setState(e.target.value); setMunicipality('') }}>
                <option value="">Selecione...</option>
                {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </Select>
            </div>
            {isMunicipal && (
              <div>
                <label className="mb-1 block text-sm font-medium">Municipio</label>
                <Select
                  value={municipality}
                  onChange={e => setMunicipality(e.target.value)}
                  disabled={!state || loadingMunicipalities}
                >
                  <option value="">
                    {loadingMunicipalities ? 'Carregando...' : 'Selecione...'}
                  </option>
                  {municipalities?.map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {isMunicipal ? (
              <p>
                Eleicao municipal ({year}): os dados serao filtrados pelo municipio selecionado.
                Cargos esperados: <strong>Prefeito</strong> e <strong>Vereador</strong>.
                O turno e detectado automaticamente do CSV.
              </p>
            ) : (
              <p>
                Eleicao estadual/federal ({year}): todos os votos do estado serao importados (visao geral).
                Cargos esperados: <strong>Deputado Estadual</strong>, <strong>Deputado Federal</strong>, <strong>Senador</strong> e <strong>Governador</strong>.
                O turno e detectado automaticamente do CSV.
              </p>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileArchive className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="ml-4 rounded p-1 hover:bg-muted cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste o ZIP do TSE aqui ou{' '}
                  <label className="cursor-pointer text-primary underline">
                    selecione
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Arquivo: votacao_secao_ANO_UF.zip
                </p>
              </>
            )}
          </div>

          {/* Botao importar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => importMutation.mutate()}
              disabled={!canImport || importMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {importMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar
                </>
              )}
            </button>

            {importMutation.isPending && (
              <p className="text-sm text-muted-foreground">
                {isMunicipal
                  ? 'Isso pode levar alguns minutos dependendo do tamanho do arquivo...'
                  : 'Importando todos os municipios do estado. Isso pode levar varios minutos...'}
              </p>
            )}
          </div>

          {/* Resultado */}
          {importMutation.isSuccess && importMutation.data && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-800 dark:text-green-200">Importacao concluida</p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {importMutation.data.totalImported.toLocaleString('pt-BR')} registros importados
                {importMutation.data.totalSkipped > 0 && `, ${importMutation.data.totalSkipped.toLocaleString('pt-BR')} atualizados`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {importMutation.data.elections.map(e => (
                  <Badge key={e.id} variant="secondary">
                    {cargoLabel(e.cargo)}: {e.imported.toLocaleString('pt-BR')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {importMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {importMutation.error?.message || 'Erro ao importar dados'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de eleicoes importadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eleicoes Importadas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingElections ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !elections?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma eleicao importada ainda</p>
          ) : (
            <div className="space-y-2">
              {elections.map(el => {
                const isStateWide = el.type === 'estadual_federal'
                const cityDisplay = isStateWide ? `${el.state} (Estado)` : `${el.city}/${el.state}`

                return (
                  <div
                    key={el.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {el.year} {typeLabel(el.type)} — {cityDisplay}
                          </p>
                          {el.round > 1 && <Badge variant="secondary">{el.round}o turno</Badge>}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge variant="outline">{cargoLabel(el.cargo)}</Badge>
                          <span>{el.totalRecords.toLocaleString('pt-BR')} registros</span>
                          <span>{el.totalCandidates} candidatos</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${cargoLabel(el.cargo)} ${cityDisplay} ${el.year}"?`)) {
                          deleteMutation.mutate(el.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
