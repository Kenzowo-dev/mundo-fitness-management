import { useState } from 'react'
import { useWorkoutPlans, useExercises } from '../../hooks/useApi'
import type { WorkoutPlan, Exercise } from '../../types/api'
import StatusBadge from '../../components/StatusBadge'
import Tabs, { TabPanel } from '../../components/Tabs'
import TableContainer from '../../components/TableContainer'
import PageHeader from '../../components/PageHeader'
import Alert from '../../components/Alert'
import '../../styles/dashboard/PlansPage.css'

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'exercises'>('plans')

  const { data: plansData, error: plansError } = useWorkoutPlans()
  const { data: exercisesData, error: exercisesError } = useExercises()

  const plans: WorkoutPlan[] = plansData ?? []
  const exercises: Exercise[] = exercisesData ?? []
  const error = plansError || exercisesError

  const planColumns = [
    { key: 'name', header: 'Nombre' },
    { key: 'goal', header: 'Objetivo', render: (plan: WorkoutPlan) => plan.goal || '-' },
    { key: 'difficulty', header: 'Dificultad', render: (plan: WorkoutPlan) => <StatusBadge status={plan.difficulty} /> },
    { key: 'durationWeeks', header: 'Duración', render: (plan: WorkoutPlan) => plan.durationWeeks ? `${plan.durationWeeks} semanas` : '-' },
    { key: 'daysPerWeek', header: 'Días/semana', render: (plan: WorkoutPlan) => plan.daysPerWeek || '-' },
    { key: 'isPublic', header: 'Público', render: (plan: WorkoutPlan) => plan.isPublic ? 'Sí' : 'No' },
  ]

  const exerciseColumns = [
    { key: 'name', header: 'Nombre' },
    { key: 'muscleGroup', header: 'Grupo muscular' },
    { key: 'difficulty', header: 'Dificultad', render: (ex: Exercise) => <StatusBadge status={ex.difficulty} /> },
    { key: 'equipment', header: 'Equipamiento', render: (ex: Exercise) => ex.equipment || '-' },
  ]

  return (
    <div className="plans-page">
      <PageHeader title="Planes de Entrenamiento" />

      {error && <Alert type="error" title="Error" message={error instanceof Error ? error.message : 'Error desconocido'} />}

      <Tabs
        tabs={[
          { id: 'plans', label: 'Planes' },
          { id: 'exercises', label: 'Ejercicios' },
        ]}
        activeTab={activeTab}
        onChange={(tabId: string) => setActiveTab(tabId as 'plans' | 'exercises')}
        ariaLabel="Secciones de planes"
      />

      <TabPanel id="plans" activeTab={activeTab}>
        <TableContainer
          data={plans}
          loading={plansError !== undefined}
          columns={planColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">📋</span>,
            title: 'No hay planes de entrenamiento disponibles.',
          }}
        />
      </TabPanel>

      <TabPanel id="exercises" activeTab={activeTab}>
        <TableContainer
          data={exercises}
          loading={exercisesError !== undefined}
          columns={exerciseColumns}
          rowKey="id"
          emptyState={{
            icon: <span aria-hidden="true">🏋️</span>,
            title: 'No hay ejercicios registrados.',
          }}
        />
      </TabPanel>
    </div>
  )
}