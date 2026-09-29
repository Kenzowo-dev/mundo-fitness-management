import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

/**
 * Cliente Redis singleton para pub/sub y caching.
 * Se inicializa perezosamente (lazy) en la primera llamada a connectRedis().
 */
let redisClient: RedisClientType | null = null;

/**
 * Establece conexión con Redis y configura event handlers.
 * Reutiliza la conexión existente si ya está abierta (patrón singleton).
 * Configura listeners para error, connect y disconnect con logging apropiado.
 *
 * @returns Cliente Redis conectado y listo para usar
 * @throws Error si la conexión falla
 */
export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    socket: {
      host: config.redis.host,
      port: config.redis.port,
    },
    password: config.redis.password,
    database: config.redis.db,
  });

  redisClient.on('error', (err) => {
    logger.error({ err }, 'Redis client error');
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('disconnect', () => {
    logger.warn('Redis client disconnected');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Obtiene el cliente Redis ya inicializado.
 * Lanza error si no se ha llamado a connectRedis() previamente.
 *
 * @returns Cliente Redis TypeScript-tipado
 * @throws Error si el cliente no está inicializado o la conexión se cerró
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

/**
 * Cierra la conexión Redis de forma graceful.
 * Usa QUIT para permitir que se completen comandos en cola antes de cerrar.
 * Resetea la referencia singleton a null para permitir reconexión futura.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client disconnected');
  }
}

/**
 * Tipo para handlers de mensajes suscritos.
 * Recibe el mensaje parseado y el nombre del canal.
 */
export interface MessageHandler<T = unknown> {
  (message: T, channel: string): Promise<void>;
}

/**
 * Suscribe a un canal de Redis con un handler asíncrono.
 * Crea una conexión duplicada dedicada para suscripciones (requerido por Redis).
 * Parsea automáticamente mensajes JSON y maneja errores de parsing/handler.
 *
 * @param channel - Nombre del canal al que suscribirse
 * @param handler - Función async que procesa cada mensaje recibido
 *
 * El handler se ejecuta en background; errores se loguean pero no rompen la suscripción.
 * La suscripción persiste hasta que el proceso termina o se cierra el cliente.
 */
export async function subscribe<T = unknown>(
  channel: string,
  handler: MessageHandler<T>
): Promise<void> {
  const client = getRedisClient();
  const subscriber = client.duplicate();
  await subscriber.connect();

  await subscriber.subscribe(channel, (message) => {
    try {
      const parsed = JSON.parse(message) as T;
      handler(parsed, channel).catch((err) => {
        logger.error({ err, channel }, 'Error handling message');
      });
    } catch (err) {
      logger.error({ err, channel, message }, 'Failed to parse message');
    }
  });

  logger.info({ channel }, 'Subscribed to channel');
}

/**
 * Publica un mensaje a un canal de Redis.
 * Serializa automáticamente el payload a JSON.
 *
 * @param channel - Nombre del canal destino
 * @param message - Objeto a serializar y publicar
 *
 * Publicación asíncrona: no espera confirmación de entrega a suscriptores.
 * Para entrega garantizada, considerar patrones como streams o colas dedicadas.
 */
export async function publish<T = unknown>(channel: string, message: T): Promise<void> {
  const client = getRedisClient();
  await client.publish(channel, JSON.stringify(message));
  logger.debug({ channel }, 'Published message');
}

/**
 * Tipos para payloads de eventos de dominio publicados en Redis.
 * Definir tipos aquí permite type-safety entre publishers y subscribers.
 */
export interface UserCreatedPayload {
  userId: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
}

export interface UserUpdatedPayload {
  userId: number;
  email: string;
  role: string;
}

export interface UserDeletedPayload {
  userId: number;
}

export interface ClientCreatedPayload {
  clientId: number;
  userId: number;
  email: string;
}

export interface ClientUpdatedPayload {
  clientId: number;
}

export interface ClientDeletedPayload {
  clientId: number;
}

export interface MembershipCreatedPayload {
  membershipId: number;
  clientId: number;
  planId: number;
}

export interface MembershipUpdatedPayload {
  membershipId: number;
  clientId: number;
}

export interface MembershipExpiredPayload {
  membershipId: number;
  clientId: number;
}

export interface MembershipCancelledPayload {
  membershipId: number;
  clientId: number;
}

export interface PaymentCompletedPayload {
  paymentId: number;
  membershipId: number | null;
  clientId: number;
  amount: number;
}

export interface PaymentFailedPayload {
  paymentId: number;
  clientId: number;
}

export interface PaymentRefundedPayload {
  paymentId: number;
  clientId: number;
  amount: number;
}

export interface PlanCreatedPayload {
  planId: number;
}

export interface PlanUpdatedPayload {
  planId: number;
}

export interface PlanDeletedPayload {
  planId: number;
}

/**
 * Mapa de canales a sus tipos de payload para type-safety.
 */
export interface ChannelPayloadMap {
  'user.created': UserCreatedPayload;
  'user.updated': UserUpdatedPayload;
  'user.deleted': UserDeletedPayload;
  'client.created': ClientCreatedPayload;
  'client.updated': ClientUpdatedPayload;
  'client.deleted': ClientDeletedPayload;
  'membership.created': MembershipCreatedPayload;
  'membership.updated': MembershipUpdatedPayload;
  'membership.expired': MembershipExpiredPayload;
  'membership.cancelled': MembershipCancelledPayload;
  'payment.completed': PaymentCompletedPayload;
  'payment.failed': PaymentFailedPayload;
  'payment.refunded': PaymentRefundedPayload;
  'plan.created': PlanCreatedPayload;
  'plan.updated': PlanUpdatedPayload;
  'plan.deleted': PlanDeletedPayload;
}

/**
 * Type helper para obtener el tipo de payload de un canal.
 */
export type PayloadForChannel<T extends keyof ChannelPayloadMap> = ChannelPayloadMap[T];

/**
 * Constantes para nombres de canales de eventos del dominio.
 * Usar estos canales evita typos y permite refactoring seguro.
 * Convención: `{entidad}.{accion}` en pasado para eventos de dominio.
 */
export const CHANNELS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',
  MEMBERSHIP_CREATED: 'membership.created',
  MEMBERSHIP_UPDATED: 'membership.updated',
  MEMBERSHIP_EXPIRED: 'membership.expired',
  MEMBERSHIP_CANCELLED: 'membership.cancelled',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  PLAN_CREATED: 'plan.created',
  PLAN_UPDATED: 'plan.updated',
  PLAN_DELETED: 'plan.deleted',
} as const;