import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  mapRowToClient,
  mapRowToMeasurement,
  mapRowToGoal,
  mapRowToDocument,
  type ClientRow,
  type MeasurementRow,
  type GoalRow,
  type DocumentRow,
} from '../src/services/client.service.js';

// ─── Esquemas de validación (replica de la lógica del controlador) ───────────

const createClientSchema = z.object({
  dni: z.string().min(5).max(20),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseClientRow: ClientRow = {
  id: 1,
  user_id: 42,
  dni: '12345678A',
  first_name: 'Lucía',
  last_name: 'Fernández',
  email: 'lucia@mundofitness.com',
  phone: '+54911234567',
  birth_date: new Date('1995-06-15'),
  gender: 'female',
  address: 'Av. Corrientes 1234, CABA',
  emergency_contact_name: 'Carlos Fernández',
  emergency_contact_phone: '+54911234568',
  medical_conditions: 'Asma leve',
  notes: 'Prefiere entrenamiento matutino',
  status: 'active',
  joined_at: new Date('2024-01-10'),
  created_at: new Date('2024-01-10'),
  updated_at: new Date('2024-06-01'),
};

const baseMeasurementRow: MeasurementRow = {
  id: 10,
  client_id: 1,
  weight_kg: '72.50',
  height_cm: '168.00',
  body_fat_percentage: '22.3',
  muscle_mass_kg: '28.1',
  chest_cm: '90.0',
  waist_cm: '70.0',
  hips_cm: '95.0',
  bicep_cm: '30.0',
  thigh_cm: '55.0',
  measured_at: new Date('2024-06-01'),
  notes: 'Medición post-verano',
};

const baseGoalRow: GoalRow = {
  id: 5,
  client_id: 1,
  goal_type: 'weight_loss',
  description: 'Bajar 5 kg en 3 meses',
  target_value: '67.00',
  current_value: '72.50',
  unit: 'kg',
  target_date: new Date('2024-09-01'),
  achieved_at: null,
  status: 'in_progress',
  created_at: new Date('2024-06-01'),
  updated_at: new Date('2024-06-01'),
};

const baseDocumentRow: DocumentRow = {
  id: 3,
  client_id: 1,
  document_type: 'medical_certificate',
  file_name: 'certificado_medico.pdf',
  file_path: '/uploads/clients/1/certificado_medico.pdf',
  mime_type: 'application/pdf',
  file_size: 204800,
  uploaded_by: 7,
  created_at: new Date('2024-06-01'),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Client Service - mapRowToClient', () => {
  it('debe mapear correctamente todos los campos de un ClientRow completo', () => {
    const client = mapRowToClient(baseClientRow);

    assert.equal(client.id, 1);
    assert.equal(client.userId, 42);
    assert.equal(client.dni, '12345678A');
    assert.equal(client.firstName, 'Lucía');
    assert.equal(client.lastName, 'Fernández');
    assert.equal(client.email, 'lucia@mundofitness.com');
    assert.equal(client.phone, '+54911234567');
    assert.equal(client.gender, 'female');
    assert.equal(client.status, 'active');
    assert.ok(client.birthDate instanceof Date);
    assert.ok(client.joinedAt instanceof Date);
    assert.ok(client.createdAt instanceof Date);
    assert.ok(client.updatedAt instanceof Date);
  });

  it('debe convertir campos null a undefined correctamente', () => {
    const row: ClientRow = {
      ...baseClientRow,
      user_id: null,
      email: null,
      phone: null,
      birth_date: null,
      gender: null,
      address: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      medical_conditions: null,
      notes: null,
    };
    const client = mapRowToClient(row);

    assert.equal(client.userId, undefined);
    assert.equal(client.email, undefined);
    assert.equal(client.phone, undefined);
    assert.equal(client.birthDate, undefined);
    assert.equal(client.gender, undefined);
    assert.equal(client.address, undefined);
  });
});

describe('Client Service - mapRowToMeasurement', () => {
  it('debe convertir strings numéricos de PostgreSQL a numbers', () => {
    const m = mapRowToMeasurement(baseMeasurementRow);

    assert.equal(m.id, 10);
    assert.equal(m.clientId, 1);
    assert.equal(typeof m.weightKg, 'number');
    assert.ok(Math.abs((m.weightKg as number) - 72.5) < 0.001);
    assert.equal(typeof m.heightCm, 'number');
    assert.ok(Math.abs((m.heightCm as number) - 168.0) < 0.001);
    assert.equal(m.notes, 'Medición post-verano');
    assert.ok(m.measuredAt instanceof Date);
  });

  it('debe convertir null a undefined en campos opcionales de medición', () => {
    const row: MeasurementRow = {
      ...baseMeasurementRow,
      weight_kg: null,
      height_cm: null,
      body_fat_percentage: null,
      muscle_mass_kg: null,
      notes: null,
    };
    const m = mapRowToMeasurement(row);

    assert.equal(m.weightKg, undefined);
    assert.equal(m.heightCm, undefined);
    assert.equal(m.bodyFatPercentage, undefined);
    assert.equal(m.muscleMassKg, undefined);
    assert.equal(m.notes, undefined);
  });
});

describe('Client Service - mapRowToGoal', () => {
  it('debe mapear correctamente un objetivo de cliente', () => {
    const goal = mapRowToGoal(baseGoalRow);

    assert.equal(goal.id, 5);
    assert.equal(goal.clientId, 1);
    assert.equal(goal.goalType, 'weight_loss');
    assert.equal(goal.status, 'in_progress');
    assert.equal(goal.unit, 'kg');
    assert.ok(Math.abs((goal.targetValue as number) - 67.0) < 0.001);
    assert.ok(Math.abs((goal.currentValue as number) - 72.5) < 0.001);
    assert.equal(goal.achievedAt, undefined);
    assert.ok(goal.targetDate instanceof Date);
  });

  it('debe setear achievedAt cuando el goal está logrado', () => {
    const row: GoalRow = {
      ...baseGoalRow,
      achieved_at: new Date('2024-08-15'),
      status: 'achieved',
    };
    const goal = mapRowToGoal(row);

    assert.ok(goal.achievedAt instanceof Date);
    assert.equal(goal.status, 'achieved');
  });
});

describe('Client Service - mapRowToDocument', () => {
  it('debe mapear correctamente un documento de cliente', () => {
    const doc = mapRowToDocument(baseDocumentRow);

    assert.equal(doc.id, 3);
    assert.equal(doc.clientId, 1);
    assert.equal(doc.documentType, 'medical_certificate');
    assert.equal(doc.fileName, 'certificado_medico.pdf');
    assert.equal(doc.mimeType, 'application/pdf');
    assert.equal(doc.fileSize, 204800);
    assert.equal(doc.uploadedBy, 7);
    assert.ok(doc.createdAt instanceof Date);
  });

  it('debe convertir campos opcionales null a undefined', () => {
    const row: DocumentRow = {
      ...baseDocumentRow,
      mime_type: null,
      file_size: null,
      uploaded_by: null,
    };
    const doc = mapRowToDocument(row);

    assert.equal(doc.mimeType, undefined);
    assert.equal(doc.fileSize, undefined);
    assert.equal(doc.uploadedBy, undefined);
  });
});

describe('Client Service - Validación de creación de cliente', () => {
  it('debe validar un payload de registro de cliente válido', () => {
    const valid = {
      dni: '12345678A',
      firstName: 'Lucía',
      lastName: 'Fernández',
      email: 'lucia@mundofitness.com',
      gender: 'female',
    };
    const parsed = createClientSchema.parse(valid);

    assert.equal(parsed.dni, '12345678A');
    assert.equal(parsed.firstName, 'Lucía');
    assert.equal(parsed.gender, 'female');
  });

  it('debe rechazar un cliente con DNI demasiado corto', () => {
    assert.throws(() =>
      createClientSchema.parse({ dni: '123', firstName: 'A', lastName: 'B' })
    );
  });

  it('debe rechazar un cliente con email inválido', () => {
    assert.throws(() =>
      createClientSchema.parse({
        dni: '12345678A',
        firstName: 'Lucía',
        lastName: 'Fernández',
        email: 'correo-invalido',
      })
    );
  });

  it('debe rechazar un género que no sea male/female/other', () => {
    assert.throws(() =>
      createClientSchema.parse({
        dni: '12345678A',
        firstName: 'Lucía',
        lastName: 'Fernández',
        gender: 'unknown',
      })
    );
  });
});
