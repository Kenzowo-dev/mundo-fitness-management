import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  createTemplate,
  getTemplateById,
  listTemplates,
  updateTemplate,
  deleteTemplate,
  executeQuery,
  generateReport,
  getGeneratedReport,
  listGeneratedReports,
  createWidget,
  listWidgets,
  updateWidget,
  deleteWidget,
  executeWidgetQuery,
  createDashboard,
  getUserDashboards,
  getDashboardById,
  updateDashboard,
  deleteDashboard,
  trackEvent,
  getEventCounts,
} from '../services/report.service.js';
import {
  ValidationError,
  NotFoundError,
} from '@gym/shared/errors/index.js';

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  querySql: z.string().min(1),
  parameters: z.record(z.unknown()).optional(),
  scheduleCron: z.string().max(100).optional(),
  createdBy: z.number().int().positive().optional(),
});

const executeQuerySchema = z.object({
  sql: z.string().min(1),
  params: z.array(z.unknown()).optional(),
});

const generateReportSchema = z.object({
  templateId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  parameters: z.record(z.unknown()).optional(),
});

const createWidgetSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  querySql: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  positionX: z.number().int().nonnegative().default(0),
  positionY: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().default(6),
  height: z.number().int().positive().default(4),
});

const createDashboardSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  isDefault: z.boolean().default(false),
  layout: z.array(z.object({
    widgetId: z.number().int().positive(),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
  })).optional(),
});

const trackEventSchema = z.object({
  eventName: z.string().min(1).max(100),
  userId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  properties: z.record(z.unknown()).optional(),
});

function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const message = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages?.join(', ')}`)
        .join('; ');
      throw new ValidationError(message);
    }
    req.body = result.data;
    next();
  };
}

export async function createTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const template = await createTemplate(req.body);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
}

export async function getTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const template = await getTemplateById(id);
    if (!template) throw new NotFoundError('ReportTemplate', id);
    res.json(template);
  } catch (error) {
    next(error);
  }
}

export async function listTemplatesController(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const templates = await listTemplates(activeOnly);
    res.json(templates);
  } catch (error) {
    next(error);
  }
}

export async function updateTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const template = await updateTemplate(id, req.body);
    res.json(template);
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function executeQueryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { sql, params } = req.body;
    const result = await executeQuery(sql, params ?? []);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function generateReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await generateReport(req.body.templateId, req.body.name, req.body.parameters);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
}

export async function getGeneratedReportController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const report = await getGeneratedReport(id);
    if (!report) throw new NotFoundError('GeneratedReport', id);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

export async function listGeneratedReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    const templateId = req.query.templateId ? parseInt(req.query.templateId as string, 10) : undefined;
    const status = req.query.status as string | undefined;
    const reports = await listGeneratedReports(templateId, status);
    res.json(reports);
  } catch (error) {
    next(error);
  }
}

export async function createWidgetController(req: Request, res: Response, next: NextFunction) {
  try {
    const widget = await createWidget(req.body);
    res.status(201).json(widget);
  } catch (error) {
    next(error);
  }
}

export async function listWidgetsController(req: Request, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const widgets = await listWidgets(activeOnly);
    res.json(widgets);
  } catch (error) {
    next(error);
  }
}

export async function updateWidgetController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const widget = await updateWidget(id, req.body);
    res.json(widget);
  } catch (error) {
    next(error);
  }
}

export async function deleteWidgetController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteWidget(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function executeWidgetController(req: Request, res: Response, next: NextFunction) {
  try {
    const widgetId = parseInt(Array.isArray(req.params.widgetId) ? req.params.widgetId[0] : req.params.widgetId, 10);
    const params = req.query.params ? JSON.parse(req.query.params as string) : {};
    const result = await executeWidgetQuery(widgetId, params);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const dashboard = await createDashboard(req.body);
    res.status(201).json(dashboard);
  } catch (error) {
    next(error);
  }
}

export async function getUserDashboardsController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);
    const dashboards = await getUserDashboards(userId);
    res.json(dashboards);
  } catch (error) {
    next(error);
  }
}

export async function getDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const dashboard = await getDashboardById(id);
    if (!dashboard) throw new NotFoundError('UserDashboard', id);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

export async function updateDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    const dashboard = await updateDashboard(id, req.body);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
}

export async function deleteDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
    await deleteDashboard(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function trackEventController(req: Request, res: Response, next: NextFunction) {
  try {
    await trackEvent(req.body);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getEventCountsController(req: Request, res: Response, next: NextFunction) {
  try {
    const eventName = req.query.eventName as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const counts = await getEventCounts(eventName, startDate, endDate);
    res.json(counts);
  } catch (error) {
    next(error);
  }
}

export const createTemplateValidation = validate(createTemplateSchema);
export const executeQueryValidation = validate(executeQuerySchema);
export const generateReportValidation = validate(generateReportSchema);
export const createWidgetValidation = validate(createWidgetSchema);
export const createDashboardValidation = validate(createDashboardSchema);
export const trackEventValidation = validate(trackEventSchema);