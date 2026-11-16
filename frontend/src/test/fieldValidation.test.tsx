import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  VALID_ADDRESS,
  VALID_PERSON_NAME,
  VALID_PHONE,
  VALID_PLAN_NAME,
  VALID_UNIT,
  normalizePhone,
  numberInputGuards,
  sanitizeAddress,
  sanitizePersonName,
  sanitizePhone,
  sanitizeClientListSearch,
  sanitizePlanName,
  sanitizeSearchTerm,
  sanitizeUnit,
} from '@/utils/fieldValidation'
import PlanFormModal from '@/components/PlanFormModal'
import MemberGoals from '@/components/member/MemberGoals'
import * as apiHooks from '@/hooks/useApi'

describe('field sanitizers', () => {
  it('keeps only letters and single spaces in person names', () => {
    expect(sanitizePersonName("  José2 O'Brien-Ñúñez!!  López")).toBe('José OBrienÑúñez López')
    expect(VALID_PERSON_NAME.test('María José')).toBe(true)
    expect(VALID_PERSON_NAME.test('García-Pérez')).toBe(false)
  })

  it('keeps only nine digits in phones and normalizes old +51 numbers', () => {
    expect(sanitizePhone('+51 987-654-321')).toBe('519876543')
    expect(normalizePhone('+51 987 654 321')).toBe('987654321')
    expect(normalizePhone('987654321')).toBe('987654321')
    expect(normalizePhone(undefined)).toBe('')
    expect(VALID_PHONE.test('987654321')).toBe(true)
    expect(VALID_PHONE.test('887654321')).toBe(false)
  })

  it('allows the usual address characters and removes the rest', () => {
    expect(sanitizeAddress('Av. Perú 450, Dpto. 3-B / Mz. A Lt. 5 N° 7 $%&!@')).toBe('Av. Perú 450, Dpto. 3-B / Mz. A Lt. 5 N° 7 ')
    expect(VALID_ADDRESS.test('Jr. Lima #123')).toBe(true)
    expect(VALID_ADDRESS.test('-Calle')).toBe(false)
  })

  it('allows letters, numbers, spaces and + - . in plan names', () => {
    expect(sanitizePlanName('Plan Premium+ 2.0 @VIP!')).toBe('Plan Premium+ 2.0 VIP')
    expect(VALID_PLAN_NAME.test('Plan Anual Élite')).toBe(true)
    expect(VALID_PLAN_NAME.test('+Plan')).toBe(false)
  })

  it('keeps only letters, numbers and spaces in socio searches (plus email characters in the list)', () => {
    expect(sanitizeSearchTerm('juan / pérez 7123!')).toBe('juan pérez 7123')
    expect(sanitizeClientListSearch('socio@mundo-fitness.com $%')).toBe('socio@mundo-fitness.com ')
  })

  it('allows letters, % and / in goal units', () => {
    expect(sanitizeUnit('km/h 2!')).toBe('km/h')
    expect(VALID_UNIT.test('%')).toBe(true)
    expect(VALID_UNIT.test('kg2')).toBe(false)
  })
})

describe('numberInputGuards', () => {
  function NumberInput({ allowDecimal }: { allowDecimal: boolean }) {
    return <input aria-label="Número" type="number" {...numberInputGuards(allowDecimal)} />
  }

  it('blocks e, +, - and, for integers, the decimal separator', () => {
    render(<NumberInput allowDecimal={false} />)
    const input = screen.getByLabelText('Número')
    for (const key of ['e', 'E', '+', '-', '.', ',']) {
      expect(fireEvent.keyDown(input, { key })).toBe(false)
    }
    expect(fireEvent.keyDown(input, { key: '5' })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(true)
  })

  it('allows the decimal point when decimals are allowed and rejects pasted signs', () => {
    render(<NumberInput allowDecimal />)
    const input = screen.getByLabelText('Número')
    expect(fireEvent.keyDown(input, { key: '.' })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'e' })).toBe(false)
    expect(fireEvent.paste(input, { clipboardData: { getData: () => '1e5' } })).toBe(false)
    expect(fireEvent.paste(input, { clipboardData: { getData: () => '-3' } })).toBe(false)
    expect(fireEvent.paste(input, { clipboardData: { getData: () => '72.5' } })).toBe(true)
  })
})

describe('PlanFormModal', () => {
  it('removes symbols from the plan name and blocks signs in number fields', () => {
    const onSave = vi.fn()
    render(<PlanFormModal isSaving={false} onClose={vi.fn()} onSave={onSave} />)
    const name = screen.getByLabelText(/Nombre del plan/)
    fireEvent.change(name, { target: { value: 'Plan Gold+ $%& 2026!' } })
    expect(name).toHaveValue('Plan Gold+ 2026')
    expect(fireEvent.keyDown(screen.getByLabelText(/Duración en días/), { key: 'e' })).toBe(false)
    expect(fireEvent.keyDown(screen.getByLabelText(/Precio/), { key: '-' })).toBe(false)
    expect(fireEvent.keyDown(screen.getByLabelText(/Precio/), { key: '.' })).toBe(true)
    expect(fireEvent.keyDown(screen.getByLabelText(/Orden de visualización/), { key: '.' })).toBe(false)
  })
})

describe('MemberGoals', () => {
  const mutation = { mutateAsync: vi.fn(), isPending: false }

  beforeEach(() => {
    vi.restoreAllMocks()
    mutation.mutateAsync.mockReset()
    vi.spyOn(apiHooks, 'useOwnGoals').mockReturnValue({ data: [], isLoading: false, isError: false } as unknown as ReturnType<typeof apiHooks.useOwnGoals>)
    vi.spyOn(apiHooks, 'useCreateOwnGoal').mockReturnValue(mutation as unknown as ReturnType<typeof apiHooks.useCreateOwnGoal>)
    vi.spyOn(apiHooks, 'useUpdateOwnGoal').mockReturnValue(mutation as unknown as ReturnType<typeof apiHooks.useUpdateOwnGoal>)
    vi.spyOn(apiHooks, 'useDeleteOwnGoal').mockReturnValue(mutation as unknown as ReturnType<typeof apiHooks.useDeleteOwnGoal>)
  })

  it('only accepts letters, % and / in the unit and blocks signs in the values', () => {
    render(<MemberGoals />)
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo objetivo' }))
    const unit = screen.getByLabelText('Unidad')
    fireEvent.change(unit, { target: { value: 'km/h 10!' } })
    expect(unit).toHaveValue('km/h')
    expect(fireEvent.keyDown(screen.getByLabelText('Valor actual'), { key: 'e' })).toBe(false)
    expect(fireEvent.keyDown(screen.getByLabelText('Valor objetivo'), { key: '-' })).toBe(false)
  })
})
