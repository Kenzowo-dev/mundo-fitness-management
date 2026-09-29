import { query } from '@gym/shared/database/index.js';
import { logger } from '@gym/shared/logger/index.js';
import type { QueryResultRow } from 'pg';
import { promises as fs } from 'fs';
import {
  ReportTemplate,
  CreateTemplateData,
  GeneratedReport,
  DashboardWidget,
  DashboardLayoutItem,
  CreateWidgetData,
  UserDashboard,
  CreateDashboardData,
  AnalyticsEvent,
  ReportExecutionResult,
} from '../models/report.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

interface TemplateRow extends QueryResultRow {
  id: number;
  name: string;
  description: string | null;
  query_sql: string;
  parameters: Record<string, unknown> | null;
  schedule_cron: string | null;
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface GeneratedReportRow extends QueryResultRow {
  id: number;
  template_id: number;
  name: string;
  status: string;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  parameters: Record<string, unknown> | null;
  error_message: string | null;
  generated_at: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

interface WidgetRow extends QueryResultRow {
  id: number;
  name: string;
  type: string;
  query_sql: string;
  config: Record<string, unknown> | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DashboardRow extends QueryResultRow {
  id: number;
  user_id: number;
  name: string;
  is_default: boolean;
  layout: unknown[] | null;
  created_at: Date;
  updated_at: Date;
}

interface EventCountRow extends QueryResultRow {
  event_name: string;
  count: string;
}

function mapRowToTemplate(row: TemplateRow): ReportTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    querySql: row.query_sql,
    parameters: row.parameters || {},
    scheduleCron: row.schedule_cron ?? undefined,
    isActive: row.is_active,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToGeneratedReport(row: GeneratedReportRow): GeneratedReport {
  return {
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    status: row.status,
    filePath: row.file_path ?? undefined,
    fileSize: row.file_size ?? undefined,
    mimeType: row.mime_type ?? undefined,
    parameters: row.parameters ?? undefined,
    errorMessage: row.error_message ?? undefined,
    generatedAt: row.generated_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapRowToWidget(row: WidgetRow): DashboardWidget {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    querySql: row.query_sql,
    config: row.config || {},
    positionX: row.position_x,
    positionY: row.position_y,
    width: row.width,
    height: row.height,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToDashboard(row: DashboardRow): UserDashboard {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: row.is_default,
    layout: (row.layout ?? []) as DashboardLayoutItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTemplate(data: CreateTemplateData): Promise<ReportTemplate> {
  const result = await query<TemplateRow>(
    `INSERT INTO report_templates (name, description, query_sql, parameters, schedule_cron, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.name,
      data.description ?? null,
      data.querySql,
      JSON.stringify(data.parameters ?? {}),
      data.scheduleCron ?? null,
      data.createdBy ?? null,
    ]
  );
  return mapRowToTemplate(result.rows[0]);
}

export async function getTemplateById(id: number): Promise<ReportTemplate | null> {
  const result = await query<TemplateRow>('SELECT * FROM report_templates WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToTemplate(result.rows[0]) : null;
}

export async function listTemplates(activeOnly = true): Promise<ReportTemplate[]> {
  const where = activeOnly ? 'WHERE is_active = true' : '';
  const result = await query<TemplateRow>(`SELECT * FROM report_templates ${where} ORDER BY created_at DESC`);
  return result.rows.map(mapRowToTemplate);
}

export async function updateTemplate(id: number, data: Partial<CreateTemplateData>): Promise<ReportTemplate> {
  const existing = await getTemplateById(id);
  if (!existing) throw new NotFoundError('ReportTemplate', id);

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    querySql: 'query_sql',
    parameters: 'parameters',
    scheduleCron: 'schedule_cron',
    isActive: 'is_active',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = (data as Record<string, unknown>)[key];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(key === 'parameters' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) return existing;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<TemplateRow>(
    `UPDATE report_templates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return mapRowToTemplate(result.rows[0]);
}

export async function deleteTemplate(id: number): Promise<void> {
  await query('DELETE FROM report_templates WHERE id = $1', [id]);
}

export async function executeQuery(
  sql: string,
  params: unknown[] = []
): Promise<ReportExecutionResult> {
  const normalizedSql = sql.trim().toLowerCase();

  // Validación de seguridad: permitir exclusivamente consultas de solo lectura
  const isReadOnly = normalizedSql.startsWith('select') || normalizedSql.startsWith('with');
  const hasDestructiveKeywords = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|execute|copy)\b/i.test(sql);
  const hasMultipleStatements = sql.includes(';') && !sql.trim().endsWith(';');

  if (!isReadOnly || hasDestructiveKeywords || hasMultipleStatements) {
    throw new ValidationError(
      'Solo se permiten consultas SQL de solo lectura (SELECT/WITH) sin múltiples declaraciones',
      'FORBIDDEN_SQL_OPERATION'
    );
  }

  const start = Date.now();
  try {
    const result = await query(sql, params);
    return {
      columns: result.fields.map((f) => f.name),
      rows: result.rows.map((row) => Object.values(row)),
      rowCount: result.rowCount ?? 0,
      executionTimeMs: Date.now() - start,
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    logger.error({ err: error, sql }, 'Query execution failed');
    throw new ValidationError('Query execution failed', 'QUERY_ERROR');
  }
}

export async function generateReport(
  templateId: number,
  name: string,
  parameters: Record<string, unknown> = {}
): Promise<GeneratedReport> {
  const template = await getTemplateById(templateId);
  if (!template) throw new NotFoundError('ReportTemplate', templateId);

  const reportResult = await query<GeneratedReportRow>(
    `INSERT INTO generated_reports (template_id, name, status, parameters)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [templateId, name, 'pending', JSON.stringify(parameters)]
  );

  const report = mapRowToGeneratedReport(reportResult.rows[0]);

  try {
    const executionResult = await executeQuery(template.querySql, Object.values(parameters));
    
    const csvContent = [
      executionResult.columns.join(','),
      ...executionResult.rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const fileName = `report_${report.id}_${Date.now()}.csv`;
    const filePath = `/tmp/${fileName}`;
    
    await fs.writeFile(filePath, csvContent);
    const fileStat = await fs.stat(filePath);
    const fileSize = fileStat.size;

    await query(
      `UPDATE generated_reports SET status = $1, file_path = $2, file_size = $3, mime_type = $4, generated_at = NOW()
       WHERE id = $5`,
      ['completed', filePath, fileSize, 'text/csv', report.id]
    );

    return { ...report, status: 'completed', filePath, fileSize, mimeType: 'text/csv', generatedAt: new Date() };
  } catch (error) {
    await query(
      `UPDATE generated_reports SET status = $1, error_message = $2 WHERE id = $3`,
      ['failed', error instanceof Error ? error.message : 'Unknown error', report.id]
    );
    throw error;
  }
}

export async function getGeneratedReport(id: number): Promise<GeneratedReport | null> {
  const result = await query<GeneratedReportRow>('SELECT * FROM generated_reports WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToGeneratedReport(result.rows[0]) : null;
}

export async function listGeneratedReports(
  templateId?: number,
  status?: string
): Promise<GeneratedReport[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (templateId) {
    values.push(templateId);
    conditions.push(`template_id = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<GeneratedReportRow>(`SELECT * FROM generated_reports ${whereClause} ORDER BY created_at DESC`, values);
  return result.rows.map(mapRowToGeneratedReport);
}

export async function createWidget(data: CreateWidgetData): Promise<DashboardWidget> {
  const result = await query<WidgetRow>(
    `INSERT INTO dashboard_widgets (name, type, query_sql, config, position_x, position_y, width, height)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.name,
      data.type,
      data.querySql,
      JSON.stringify(data.config ?? {}),
      data.positionX ?? 0,
      data.positionY ?? 0,
      data.width ?? 6,
      data.height ?? 4,
    ]
  );
  return mapRowToWidget(result.rows[0]);
}

export async function listWidgets(activeOnly = true): Promise<DashboardWidget[]> {
  const where = activeOnly ? 'WHERE is_active = true' : '';
  const result = await query<WidgetRow>(`SELECT * FROM dashboard_widgets ${where} ORDER BY position_y, position_x`);
  return result.rows.map(mapRowToWidget);
}

export async function updateWidget(id: number, data: Partial<CreateWidgetData>): Promise<DashboardWidget> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    type: 'type',
    querySql: 'query_sql',
    config: 'config',
    positionX: 'position_x',
    positionY: 'position_y',
    width: 'width',
    height: 'height',
    isActive: 'is_active',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = (data as Record<string, unknown>)[key];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(key === 'config' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) {
    const result = await query<WidgetRow>('SELECT * FROM dashboard_widgets WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundError('DashboardWidget', id);
    return mapRowToWidget(result.rows[0]);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<WidgetRow>(
    `UPDATE dashboard_widgets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  if (result.rows.length === 0) throw new NotFoundError('DashboardWidget', id);
  return mapRowToWidget(result.rows[0]);
}

export async function deleteWidget(id: number): Promise<void> {
  await query('DELETE FROM dashboard_widgets WHERE id = $1', [id]);
}

export async function executeWidgetQuery(widgetId: number, params: Record<string, unknown> = {}): Promise<ReportExecutionResult> {
  const widget = await query<WidgetRow>('SELECT * FROM dashboard_widgets WHERE id = $1 AND is_active = true', [widgetId]);
  if (widget.rows.length === 0) throw new NotFoundError('DashboardWidget', widgetId);

  const widgetData = mapRowToWidget(widget.rows[0]);
  const config = widgetData.config as Record<string, unknown>;
  const queryParams = config.params ? Object.values(config.params as Record<string, unknown>) : Object.values(params);
  
  return executeQuery(widgetData.querySql, queryParams);
}

export async function createDashboard(data: CreateDashboardData): Promise<UserDashboard> {
  if (data.isDefault) {
    await query('UPDATE user_dashboards SET is_default = false WHERE user_id = $1', [data.userId]);
  }

  const result = await query<DashboardRow>(
    `INSERT INTO user_dashboards (user_id, name, is_default, layout)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.userId, data.name, data.isDefault ?? false, JSON.stringify(data.layout ?? [])]
  );
  return mapRowToDashboard(result.rows[0]);
}

export async function getUserDashboards(userId: number): Promise<UserDashboard[]> {
  const result = await query<DashboardRow>('SELECT * FROM user_dashboards WHERE user_id = $1 ORDER BY is_default DESC, created_at', [userId]);
  return result.rows.map(mapRowToDashboard);
}

export async function getDashboardById(id: number): Promise<UserDashboard | null> {
  const result = await query<DashboardRow>('SELECT * FROM user_dashboards WHERE id = $1', [id]);
  return result.rows.length > 0 ? mapRowToDashboard(result.rows[0]) : null;
}

export async function updateDashboard(id: number, data: Partial<CreateDashboardData>): Promise<UserDashboard> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fieldMap: Record<string, string> = {
    name: 'name',
    isDefault: 'is_default',
    layout: 'layout',
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    const value = (data as Record<string, unknown>)[key];
    if (value !== undefined) {
      fields.push(`${dbField} = $${paramIndex++}`);
      values.push(key === 'layout' ? JSON.stringify(value) : value);
    }
  }

  if (fields.length === 0) {
    const result = await query<DashboardRow>('SELECT * FROM user_dashboards WHERE id = $1', [id]);
    if (result.rows.length === 0) throw new NotFoundError('UserDashboard', id);
    return mapRowToDashboard(result.rows[0]);
  }

  if (data.isDefault) {
    const dash = await getDashboardById(id);
    if (dash) {
      await query('UPDATE user_dashboards SET is_default = false WHERE user_id = $1', [dash.userId]);
    }
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query<DashboardRow>(
    `UPDATE user_dashboards SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  if (result.rows.length === 0) throw new NotFoundError('UserDashboard', id);
  return mapRowToDashboard(result.rows[0]);
}

export async function deleteDashboard(id: number): Promise<void> {
  await query('DELETE FROM user_dashboards WHERE id = $1', [id]);
}

export async function trackEvent(event: AnalyticsEvent): Promise<void> {
  await query(
    `INSERT INTO analytics_events (event_name, user_id, client_id, properties)
     VALUES ($1, $2, $3, $4)`,
    [event.eventName, event.userId ?? null, event.clientId ?? null, JSON.stringify(event.properties ?? {})]
  );
}

export async function getEventCounts(
  eventName?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ event_name: string; count: number }[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (eventName) {
    values.push(eventName);
    conditions.push(`event_name = $${values.length}`);
  }
  if (startDate) {
    values.push(startDate);
    conditions.push(`timestamp >= $${values.length}`);
  }
  if (endDate) {
    values.push(endDate);
    conditions.push(`timestamp <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<EventCountRow>(
    `SELECT event_name, COUNT(*) as count FROM analytics_events ${whereClause} GROUP BY event_name ORDER BY count DESC`,
    values
  );
  return result.rows.map((row) => ({ event_name: row.event_name, count: parseInt(row.count, 10) }));
}