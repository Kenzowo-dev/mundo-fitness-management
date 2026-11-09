import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import { query } from '@gym/shared/database/index.js';
import {
  NotFoundError,
  ValidationError,
} from '@gym/shared/errors/index.js';

const STORAGE_DIR = path.resolve(
  process.env.AVATAR_STORAGE_DIR ??
    path.join(process.cwd(), 'storage', 'avatars')
);

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function detectImageType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'jpg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) {
    return 'png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

function getAvatarPath(filename: string): string {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(
      filename
    )
  ) {
    throw new ValidationError('Referencia de fotografía inválida');
  }

  return path.join(STORAGE_DIR, filename);
}

async function removeAvatarFile(
  filename: string | null
): Promise<void> {
  if (!filename) return;

  try {
    await unlink(getAvatarPath(filename));
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }

    throw error;
  }
}

export async function saveClientAvatar(
  userId: number,
  buffer: Buffer
): Promise<string> {
  const extension = detectImageType(buffer);

  if (!extension) {
    throw new ValidationError(
      'Solo se permiten imágenes JPEG, PNG y WebP'
    );
  }

  const previous = await query<{ avatar_url: string | null }>(
    'SELECT avatar_url FROM clients WHERE user_id = $1',
    [userId]
  );

  if (previous.rows.length === 0) {
    throw new NotFoundError('Perfil del socio no encontrado');
  }

  await mkdir(STORAGE_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const filepath = getAvatarPath(filename);

  await writeFile(filepath, buffer, { flag: 'wx' });

  try {
    const result = await query(
      `UPDATE clients
       SET avatar_url = $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [filename, userId]
    );

    if (!result.rowCount) {
      throw new NotFoundError('Perfil del socio no encontrado');
    }
  } catch (error) {
    await removeAvatarFile(filename).catch(() => undefined);
    throw error;
  }

  // La imagen nueva ya está registrada en PostgreSQL.
  // Si falla la limpieza anterior, no anulamos la subida.
  await removeAvatarFile(previous.rows[0].avatar_url).catch(
    () => undefined
  );

  return filename;
}

export async function getClientAvatar(
  userId: number
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const result = await query<{ avatar_url: string | null }>(
    'SELECT avatar_url FROM clients WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Perfil del socio no encontrado');
  }

  const filename = result.rows[0].avatar_url;

  if (!filename) return null;

  const extension = path.extname(filename).slice(1);
  const mimeType = MIME_TYPES[extension];

  if (!mimeType) {
    throw new ValidationError(
      'Formato de fotografía almacenada inválido'
    );
  }

  try {
    const buffer = await readFile(getAvatarPath(filename));
    return { buffer, mimeType };
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null;
    }

    throw error;
  }
}

export async function deleteClientAvatar(
  userId: number
): Promise<boolean> {
  const previous = await query<{ avatar_url: string | null }>(
    'SELECT avatar_url FROM clients WHERE user_id = $1',
    [userId]
  );

  if (previous.rows.length === 0) {
    throw new NotFoundError('Perfil del socio no encontrado');
  }

  const filename = previous.rows[0].avatar_url;

  if (!filename) return false;

  const result = await query(
    `UPDATE clients
     SET avatar_url = NULL,
         updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  if (!result.rowCount) {
    throw new NotFoundError('Perfil del socio no encontrado');
  }

  await removeAvatarFile(filename).catch(() => undefined);

  return true;
}
