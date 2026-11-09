import type {
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import multer from 'multer';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

import {
  saveClientAvatar,
  getClientAvatar,
  deleteClientAvatar,
} from '../services/avatar.service.js';
import {
  AuthenticationError,
  ValidationError,
} from '@gym/shared/errors/index.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
    fields: 0,
    parts: 1,
  },
});

const multerMiddleware = upload.single('avatar');

export const uploadAvatarMiddleware: RequestHandler = (
  req,
  res,
  next
) => {
  multerMiddleware(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        next(
          new ValidationError(
            'La fotografía no puede superar los 2 MB'
          )
        );
        return;
      }

      next(
        new ValidationError(
          'La solicitud contiene archivos o campos no permitidos'
        )
      );
      return;
    }

    next(error);
  });
};

function getAuthenticatedUserId(req: AuthenticatedRequest): number {
  const userId = Number(req.user?.sub);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new AuthenticationError('Usuario no autenticado');
  }

  return userId;
}

export async function uploadAvatarController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Debes seleccionar una fotografía',
      });
      return;
    }

    const userId = getAuthenticatedUserId(req);

    const filename = await saveClientAvatar(
      userId,
      req.file.buffer
    );

    res.status(200).json({
      success: true,
      data: {
        avatarUrl: filename,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAvatarController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    const avatar = await getClientAvatar(userId);

    if (!avatar) {
      res.status(404).json({
        success: false,
        message: 'El socio no tiene fotografía de perfil',
      });
      return;
    }

    res.setHeader('Content-Type', avatar.mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(avatar.buffer);
  } catch (error) {
    next(error);
  }
}

export async function deleteAvatarController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = getAuthenticatedUserId(req);
    const deleted = await deleteClientAvatar(userId);

    if (!deleted) {
        res.status(404).json({
            success: false,
            message: 'El socio no tiene fotografía para eliminar',
        });
        return;
    }

    res.status(200).json({
      success: true,
      message: 'Fotografía de perfil eliminada',
    });
  } catch (error) {
    next(error);
  }
}
