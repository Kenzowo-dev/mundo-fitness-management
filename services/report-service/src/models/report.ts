export interface ReportTemplate {
  id: number;
  name: string;
  description?: string;
  querySql: string;
  parameters: Record<string, unknown>;
  scheduleCron?: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  querySql: string;
  parameters?: Record<string, unknown>;
  scheduleCron?: string;
  createdBy?: number;
}

export interface GeneratedReport {
  id: number;
  templateId: number;
  name: string;
  status: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  parameters?: Record<string, unknown>;
  errorMessage?: string;
  generatedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export interface DashboardWidget {
  id: number;
  name: string;
  type: string;
  querySql: string;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWidgetData {
  name: string;
  type: string;
  querySql: string;
  config?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface UserDashboard {
  id: number;
  userId: number;
  name: string;
  isDefault: boolean;
  layout: DashboardLayoutItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayoutItem {
  widgetId: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CreateDashboardData {
  userId: number;
  name: string;
  isDefault?: boolean;
  layout?: DashboardLayoutItem[];
}

export interface AnalyticsEvent {
  eventName: string;
  userId?: number;
  clientId?: number;
  properties: Record<string, unknown>;
}

export interface ReportExecutionResult {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  executionTimeMs: number;
}