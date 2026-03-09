import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Puzzle, Lock, Zap } from 'lucide-react'
import type { SystemModule } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  GESTAO: 'Gestão',
  ELEITORAL: 'Eleitoral',
  LEGISLATIVO: 'Legislativo',
  COMUNICACAO: 'Comunicação',
  FINANCEIRO: 'Financeiro',
  GABINETE: 'Gabinete',
  POLITICO: 'Político',
  INTELIGENCIA: 'Inteligência',
}

const CATEGORY_COLORS: Record<string, string> = {
  CORE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  GESTAO: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  ELEITORAL: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  LEGISLATIVO: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  COMUNICACAO: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  FINANCEIRO: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  GABINETE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  POLITICO: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  INTELIGENCIA: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
}

export function ModulesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['system-modules'],
    queryFn: () => api.get<SystemModule[]>('/modules/system').then((r) => r.data),
  })

  const byCategory = (data ?? []).reduce<Record<string, SystemModule[]>>((acc, m) => {
    const cat = m.category || 'OUTROS'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Módulos do Sistema</h1>
        <p className="text-sm text-muted-foreground">
          Todos os módulos disponíveis na plataforma. Ative-os por tenant na página de detalhes do tenant.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary">{(data ?? []).length} módulos total</Badge>
        <Badge variant="default">{(data ?? []).filter((m) => m.isCore).length} core</Badge>
        <Badge variant="warning">{(data ?? []).filter((m) => m.isAddon).length} addons</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        Object.entries(byCategory).map(([category, mods]) => (
          <div key={category} className="space-y-3">
            <h2 className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[category] ?? 'bg-muted'}`}>
                {CATEGORY_LABELS[category] ?? category}
              </span>
              <span className="text-sm text-muted-foreground">{mods.length} módulo{mods.length > 1 ? 's' : ''}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mods.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="flex flex-row items-start gap-3 p-4 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Puzzle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {m.name}
                        {m.isCore && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {m.isAddon && <Zap className="h-3 w-3 text-amber-500" />}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.key}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {m.availableFor.slice(0, 4).map((p) => (
                        <span key={p} className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">{p}</span>
                      ))}
                      {m.availableFor.length > 4 && (
                        <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[10px]">+{m.availableFor.length - 4}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
