import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateMembershipPlanInput, MembershipPlan } from '../types/api';
import Modal from './Modal';
import Alert from './Alert';
import Button from './Button';
import './PlanFormModal.css';

interface PlanFormModalProps {
  plan?: MembershipPlan;
  isSaving: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (data: CreateMembershipPlanInput) => void;
}

export default function PlanFormModal({ plan, isSaving, error, onClose, onSave }: PlanFormModalProps) {
  const [name, setName] = useState(plan?.name ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [durationDays, setDurationDays] = useState(String(plan?.durationDays ?? 30));
  const [price, setPrice] = useState(String(plan?.price ?? ''));
  const [currency, setCurrency] = useState<'PEN' | 'USD'>(plan?.currency === 'USD' ? 'USD' : 'PEN');
  const [features, setFeatures] = useState((plan?.features ?? []).join('\n'));
  const [maxVisitsPerWeek, setMaxVisitsPerWeek] = useState(plan?.maxVisitsPerWeek ? String(plan.maxVisitsPerWeek) : '');
  const [includesClasses, setIncludesClasses] = useState(plan?.includesClasses ?? false);
  const [includesSauna, setIncludesSauna] = useState(plan?.includesSauna ?? false);
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder ?? 0));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      durationDays: Number(durationDays),
      price: Number(price),
      currency,
      features: features.split('\n').map((feature) => feature.trim()).filter(Boolean),
      maxVisitsPerWeek: maxVisitsPerWeek ? Number(maxVisitsPerWeek) : undefined,
      includesClasses,
      includesSauna,
      sortOrder: Number(sortOrder),
    });
  };

  return (
    <Modal open onClose={onClose} title={plan ? 'Editar plan de membresía' : 'Crear plan de membresía'} size="lg">
      <form className="plan-form" onSubmit={submit}>
        {error && <Alert type="error" message={error} />}
        <div className="plan-form-grid">
          <label>Nombre del plan *<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Duración en días *<input required type="number" min="1" max="3660" step="1" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} /></label>
          <label>Precio *<input required type="number" min="0.01" max="99999999.99" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
          <label>Moneda *<select required value={currency} onChange={(event) => setCurrency(event.target.value === 'USD' ? 'USD' : 'PEN')}><option value="PEN">Soles peruanos (PEN)</option><option value="USD">Dólares estadounidenses (USD)</option></select></label>
          <label>Máximo de visitas por semana<input type="number" min="1" max="21" step="1" placeholder="Sin límite" value={maxVisitsPerWeek} onChange={(event) => setMaxVisitsPerWeek(event.target.value)} /></label>
          <label>Orden de visualización<input type="number" min="0" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} /></label>
          <label className="plan-form-wide">Descripción<textarea maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="plan-form-wide">Beneficios (uno por línea)<textarea maxLength={2000} rows={4} value={features} onChange={(event) => setFeatures(event.target.value)} /></label>
          <label className="plan-form-checkbox"><input type="checkbox" checked={includesClasses} onChange={(event) => setIncludesClasses(event.target.checked)} /> Incluye clases grupales</label>
          <label className="plan-form-checkbox"><input type="checkbox" checked={includesSauna} onChange={(event) => setIncludesSauna(event.target.checked)} /> Incluye sauna</label>
        </div>
        <div className="plan-form-actions">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={isSaving}>{isSaving ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}</Button>
        </div>
      </form>
    </Modal>
  );
}
