import { query } from '@gym/shared/database/index.js';
import { logger } from '@gym/shared/logger/index.js';
import { publish } from '@gym/shared/messaging/index.js';
import { CHANNELS } from '@gym/shared/messaging/index.js';
import {
  Client,
  CreateClientData,
  UpdateClientData,
  ClientMeasurement,
  CreateMeasurementData,
  ClientGoal,
  CreateGoalData,
  UpdateGoalData,
  ClientDocument,
} from '../models/client.js';
import {
  NotFoundError,
  ConflictError,
} from '@gym/shared/errors/index.js';

export interface ClientRow {
  id: number;
  user_id: number | null;
  dni: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: Date | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: string | null;
  notes: string | null;
  status: string;
  joined_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MeasurementRow {
  id: number;
  client_id: number;
  weight_kg: string | number | null;
  height_cm: string | number | null;
  body_fat_percentage: string | number | null;
  muscle_mass_kg: string | number | null;
  chest_cm: string | number | null;
  waist_cm: string | number | null;
  hips_cm: string | number | null;
  bicep_cm: string | number | null;
  thigh_cm: string | number | null;
  measured_at: Date;
  notes: string | null;
}

export interface GoalRow {
  id: number;
  client_id: number;
  goal_type: string;
  description: string | null;
  target_value: string | number | null;
  current_value: string | number | null;
  unit: string | null;
  target_date: Date | null;
  achieved_at: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentRow {
  id: number;
  client_id: number;
  document_type: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: number | null;
  created_at: Date;
}

export interface CountRow {
  count: string;
}

function parseNumeric(val: string | number | null | undefined): number | undefined {
  if (val == null) return undefined;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return Number.isNaN(num) ? undefined : num;
}

export function mapRowToClient(row: ClientRow): Client {
  return {
    id: Number(row.id),
    userId: row.user_id == null ? undefined : Number(row.user_id),
    dni: row.dni,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    gender: row.gender ?? undefined,
    address: row.address ?? undefined,
    emergencyContactName: row.emergency_contact_name ?? undefined,
    emergencyContactPhone: row.emergency_contact_phone ?? undefined,
    medicalConditions: row.medical_conditions ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    joinedAt: new Date(row.joined_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToMeasurement(row: MeasurementRow): ClientMeasurement {
  return {
    id: row.id,
    clientId: row.client_id,
    weightKg: parseNumeric(row.weight_kg),
    heightCm: parseNumeric(row.height_cm),
    bodyFatPercentage: parseNumeric(row.body_fat_percentage),
    muscleMassKg: parseNumeric(row.muscle_mass_kg),
    chestCm: parseNumeric(row.chest_cm),
    waistCm: parseNumeric(row.waist_cm),
    hipsCm: parseNumeric(row.hips_cm),
    bicepCm: parseNumeric(row.bicep_cm),
    thighCm: parseNumeric(row.thigh_cm),
    measuredAt: new Date(row.measured_at),
    notes: row.notes ?? undefined,
  };
}

export function mapRowToGoal(row: GoalRow): ClientGoal {
  return {
    id: row.id,
    clientId: row.client_id,
    goalType: row.goal_type,
    description: row.description ?? undefined,
    targetValue: parseNumeric(row.target_value),
    currentValue: parseNumeric(row.current_value),
    unit: row.unit ?? undefined,
    targetDate: row.target_date ? new Date(row.target_date) : undefined,
    achievedAt: row.achieved_at ? new Date(row.achieved_at) : undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapRowToDocument(row: DocumentRow): ClientDocument {
  return {
    id: row.id,
    clientId: row.client_id,
    documentType: row.document_type,
    fileName: row.file_name,
    filePath: row.file_path,
    mimeType: row.mime_type ?? undefined,
    fileSize: row.file_size ?? undefined,
    uploadedBy: row.uploaded_by ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function createClient(data: CreateClientData): Promise<Client> {
  const existingDni = await query('SELECT id FROM clients WHERE dni = $1', [data.dni]);
  if (existingDni.rows.length > 0) {
    throw new ConflictError('Client with this DNI already exists', 'DNI_EXISTS');
  }

  if (data.email) {
    const existingEmail = await query('SELECT id FROM clients WHERE email = $1', [data.email]);
    if (existingEmail.rows.length > 0) {
      throw new ConflictError('Client with this email already exists', 'EMAIL_EXISTS');
    }
  }

  if (data.userId) {
    const existingUser = await query('SELECT id FROM clients WHERE user_id = $1', [data.userId]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('Client for this user already exists', 'USER_EXISTS');
    }
  }

  const result = await query<ClientRow>(
    `
    INSERT INTO clients (
      user_id, dni, first_name, last_name, email, phone, birth_date, gender,
      address, emergency_contact_name, emergency_contact_phone, medical_conditions, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
    `,
    [
      data.userId ?? null,
      data.dni,
      data.firstName,
      data.lastName,
      data.email ?? null,
      data.phone ?? null,
      data.birthDate ?? null,
      data.gender ?? null,
      data.address ?? null,
      data.emergencyContactName ?? null,
      data.emergencyContactPhone ?? null,
      data.medicalConditions ?? null,
      data.notes ?? null,
    ]
  );

  const client = mapRowToClient(result.rows[0]);
  await publish(CHANNELS.CLIENT_CREATED, { clientId: client.id, dni: client.dni });
  logger.info({ clientId: client.id }, 'Client created');
  return client;
}

export async function getClientById(id: number): Promise<Client | null> {
  const result = await query<ClientRow>('SELECT * FROM clients WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToClient(result.rows[0]) : null;
}

export async function getClientByDni(dni: string): Promise<Client | null> {
  const result = await query<ClientRow>('SELECT * FROM clients WHERE dni = $1', [dni]);
  return result.rows.length > 0 ? mapRowToClient(result.rows[0]) : null;
}

export async function getClientByUserId(userId: number): Promise<Client | null> {
  const result = await query<ClientRow>('SELECT * FROM clients WHERE user_id = $1', [userId]);
  return result.rows.length > 0 ? mapRowToClient(result.rows[0]) : null;
}

export async function updateClient(id: number, data: UpdateClientData): Promise<Client> {
  const existing = await getClientById(id);
  if (!existing) {
    throw new NotFoundError('Client', id);
  }

  if (data.dni && data.dni !== existing.dni) {
    const dniCheck = await query('SELECT id FROM clients WHERE dni = $1 AND id != $2', [data.dni, id]);
    if (dniCheck.rows.length > 0) {
      throw new ConflictError('Client with this DNI already exists', 'DNI_EXISTS');
    }
  }

  if (data.email && data.email !== existing.email) {
    const emailCheck = await query('SELECT id FROM clients WHERE email = $1 AND id != $2', [data.email, id]);
    if (emailCheck.rows.length > 0) {
      throw new ConflictError('Client with this email already exists', 'EMAIL_EXISTS');
    }
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    dni: 'dni',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    birthDate: 'birth_date',
    gender: 'gender',
    address: 'address',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone',
    medicalConditions: 'medical_conditions',
    notes: 'notes',
    status: 'status',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = data[key as keyof UpdateClientData];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<ClientRow>(
    `UPDATE clients SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  const client = mapRowToClient(result.rows[0]);
  await publish(CHANNELS.CLIENT_UPDATED, { clientId: client.id, dni: client.dni });
  logger.info({ clientId: client.id }, 'Client updated');
  return client;
}

export async function deleteClient(id: number): Promise<void> {
  const result = await query('DELETE FROM clients WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new NotFoundError('Client', id);
  }
  await publish(CHANNELS.CLIENT_DELETED, { clientId: id });
  logger.info({ clientId: id }, 'Client deleted');
}

export async function listClients(
  page: number,
  limit: number,
  filters?: { status?: string; search?: string }
): Promise<{ clients: Client[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters?.status) {
    conditions.push(`status = $${values.length + 1}`);
    values.push(filters.status);
  }

  if (filters?.search) {
    conditions.push(`(
      first_name ILIKE $${values.length + 1} OR
      last_name ILIKE $${values.length + 1} OR
      dni ILIKE $${values.length + 1} OR
      email ILIKE $${values.length + 1}
    )`);
    values.push(`%${filters.search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [clientsResult, countResult] = await Promise.all([
    query<ClientRow>(
      `SELECT * FROM clients ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query<CountRow>(`SELECT COUNT(*) FROM clients ${whereClause}`, values),
  ]);

  return {
    clients: clientsResult.rows.map(mapRowToClient),
    total: parseInt(countResult.rows[0].count, 10),
  };
}

export async function getClientStats(): Promise<{ totalClients: number; activeClients: number }> {
  const result = await query<{ total_clients: string; active_clients: string }>(
    `SELECT COUNT(*) AS total_clients,
            COUNT(*) FILTER (WHERE status = 'active') AS active_clients
     FROM clients`
  );
  return {
    totalClients: Number(result.rows[0]?.total_clients ?? 0),
    activeClients: Number(result.rows[0]?.active_clients ?? 0),
  };
}

export async function getClientReports(): Promise<{
  clientsByMonth: Array<{ month: string; count: number }>;
  clientsByStatus: Array<{ status: string; count: number }>;
}> {
  const [monthly, status] = await Promise.all([
    query<{ month: string; count: string }>(
      `WITH months AS (
         SELECT generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
                                date_trunc('month', CURRENT_DATE), INTERVAL '1 month') AS month
       )
       SELECT to_char(months.month, 'YYYY-MM') AS month, COUNT(clients.id)::text AS count
       FROM months
       LEFT JOIN clients ON date_trunc('month', clients.joined_at::timestamp) = months.month
       GROUP BY months.month ORDER BY months.month`
    ),
    query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text AS count FROM clients GROUP BY status ORDER BY status`
    ),
  ]);
  return {
    clientsByMonth: monthly.rows.map((row) => ({ month: row.month, count: Number(row.count) })),
    clientsByStatus: status.rows.map((row) => ({ status: row.status, count: Number(row.count) })),
  };
}

export async function addMeasurement(data: CreateMeasurementData): Promise<ClientMeasurement> {
  const client = await getClientById(data.clientId);
  if (!client) {
    throw new NotFoundError('Client', data.clientId);
  }

  const result = await query<MeasurementRow>(
    `
    INSERT INTO client_measurements (
      client_id, weight_kg, height_cm, body_fat_percentage, muscle_mass_kg,
      chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
    `,
    [
      data.clientId,
      data.weightKg ?? null,
      data.heightCm ?? null,
      data.bodyFatPercentage ?? null,
      data.muscleMassKg ?? null,
      data.chestCm ?? null,
      data.waistCm ?? null,
      data.hipsCm ?? null,
      data.bicepCm ?? null,
      data.thighCm ?? null,
      data.notes ?? null,
    ]
  );

  return mapRowToMeasurement(result.rows[0]);
}

export async function getClientMeasurements(clientId: number, limit = 10): Promise<ClientMeasurement[]> {
  const result = await query<MeasurementRow>(
    `SELECT * FROM client_measurements WHERE client_id = $1 ORDER BY measured_at DESC LIMIT $2`,
    [clientId, limit]
  );
  return result.rows.map(mapRowToMeasurement);
}

export async function getLatestMeasurement(clientId: number): Promise<ClientMeasurement | null> {
  const result = await query<MeasurementRow>(
    `SELECT * FROM client_measurements WHERE client_id = $1 ORDER BY measured_at DESC LIMIT 1`,
    [clientId]
  );
  return result.rows.length > 0 ? mapRowToMeasurement(result.rows[0]) : null;
}

export async function createGoal(data: CreateGoalData): Promise<ClientGoal> {
  const client = await getClientById(data.clientId);
  if (!client) {
    throw new NotFoundError('Client', data.clientId);
  }

  const result = await query<GoalRow>(
    `
    INSERT INTO client_goals (client_id, goal_type, description, target_value, current_value, unit, target_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      data.clientId,
      data.goalType,
      data.description ?? null,
      data.targetValue ?? null,
      data.currentValue ?? null,
      data.unit ?? null,
      data.targetDate ?? null,
    ]
  );

  return mapRowToGoal(result.rows[0]);
}

export async function getClientGoals(clientId: number): Promise<ClientGoal[]> {
  const result = await query<GoalRow>(
    `SELECT * FROM client_goals WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId]
  );
  return result.rows.map(mapRowToGoal);
}

export async function updateGoal(id: number, data: UpdateGoalData): Promise<ClientGoal> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    description: 'description',
    targetValue: 'target_value',
    currentValue: 'current_value',
    unit: 'unit',
    targetDate: 'target_date',
    status: 'status',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = data[key as keyof UpdateGoalData];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(value);
    }
  }

  if (data.status === 'achieved' || (data.currentValue !== undefined && data.targetValue !== undefined && data.currentValue >= data.targetValue)) {
    fields.push(`achieved_at = NOW()`);
  }

  if (fields.length === 0) {
    const result = await query<GoalRow>('SELECT * FROM client_goals WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundError('Goal', id);
    return mapRowToGoal(result.rows[0]);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<GoalRow>(
    `UPDATE client_goals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Goal', id);
  }

  return mapRowToGoal(result.rows[0]);
}

export async function deleteGoal(id: number): Promise<void> {
  const result = await query('DELETE FROM client_goals WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new NotFoundError('Goal', id);
  }
}

export async function addDocument(
  clientId: number,
  documentType: string,
  fileName: string,
  filePath: string,
  mimeType?: string,
  fileSize?: number,
  uploadedBy?: number
): Promise<ClientDocument> {
  const client = await getClientById(clientId);
  if (!client) {
    throw new NotFoundError('Client', clientId);
  }

  const result = await query<DocumentRow>(
    `
    INSERT INTO client_documents (client_id, document_type, file_name, file_path, mime_type, file_size, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [clientId, documentType, fileName, filePath, mimeType ?? null, fileSize ?? null, uploadedBy ?? null]
  );

  return mapRowToDocument(result.rows[0]);
}

export async function getClientDocuments(clientId: number): Promise<ClientDocument[]> {
  const result = await query<DocumentRow>(
    `SELECT * FROM client_documents WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId]
  );
  return result.rows.map(mapRowToDocument);
}

export async function deleteDocument(id: number): Promise<void> {
  const result = await query('DELETE FROM client_documents WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new NotFoundError('Document', id);
  }
}
