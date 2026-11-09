
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import {
  memberAvatarQueryKey,
  useMemberAvatar,
} from "./useMemberAvatar";
import "../../styles/member/MemberAvatarProfile.css";

interface MemberAvatarProfileProps {
  userId: number;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function MemberAvatarProfile({
  userId,
}: MemberAvatarProfileProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const {
    avatarUrl,
    loading,
    error: avatarLoadError,
  } = useMemberAvatar(userId);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const previewRef = previewUrlRef;

    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  const clearSelection = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleSelect = (file?: File) => {
    if (!file) return;

    setError(null);
    setMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      clearSelection();
      setError("Selecciona una imagen JPG, PNG o WebP.");
      return;
    }

    if (file.size > MAX_SIZE) {
      clearSelection();
      setError("La fotografía no puede superar los 2 MB.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;

    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const refreshAvatar = async () => {
    await queryClient.invalidateQueries({
      queryKey: memberAvatarQueryKey(userId),
    });

    await queryClient.invalidateQueries({
      queryKey: ["member-portal", "client", userId],
    });
  };

  const handleSave = async () => {
    if (!selectedFile || saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await api.uploadOwnAvatar(selectedFile);
      await refreshAvatar();
      clearSelection();
      setMessage("Fotografía actualizada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la fotografía.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving || !avatarUrl) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await api.deleteOwnAvatar();
      await refreshAvatar();
      clearSelection();
      setMessage("Fotografía eliminada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la fotografía.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="member-card member-avatar-profile">
      <header className="member-section-header">
        <div>
          <h2>Fotografía de perfil</h2>
          <p>Personaliza la imagen de tu cuenta.</p>
        </div>
      </header>

      <div className="member-avatar-profile-content">
        <div className="member-avatar-profile-image">
          {previewUrl || avatarUrl ? (
            <img
              src={previewUrl || avatarUrl || ""}
              alt="Fotografía de perfil"
            />
          ) : (
            <span
              className="member-avatar-profile-placeholder"
              aria-hidden="true"
            >
            </span>
          )}
        </div>

        <div className="member-avatar-profile-controls">
          <p className="member-avatar-profile-description">
            Personaliza tu perfil con una fotografía.
            Formatos JPG, PNG o WebP. Máximo 2 MB.
          </p>

          <input
            ref={inputRef}
            className="member-avatar-profile-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Seleccionar fotografía de perfil"
            disabled={saving || loading}
            onChange={(event) =>
              handleSelect(event.target.files?.[0])
            }
          />

          <button
            type="button"
            className="member-avatar-profile-select"
            disabled={saving || loading}
            onClick={() => inputRef.current?.click()}
          >
             {avatarUrl ? "Cambiar fotografía" : "Subir fotografía"}
          </button>

          {selectedFile && (
            <p className="member-avatar-profile-filename">
              Vista previa: {selectedFile.name}
            </p>
          )}

          <div className="member-avatar-profile-actions">
            {selectedFile && (
              <>
                <button
                  type="button"
                  className="member-avatar-profile-action member-avatar-profile-action--save"
                  disabled={saving || loading}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Guardando..." : "Guardar fotografía"}
                </button>

                <button
                  type="button"
                  className="member-avatar-profile-action"
                  disabled={saving}
                  onClick={clearSelection}
                >
                  Cancelar
                </button>
              </>
            )}

            {avatarUrl && (
              <button
                type="button"
                className="member-avatar-profile-action member-avatar-profile-action--delete"
                disabled={saving || loading}
                onClick={() => void handleDelete()}
              >
                Eliminar fotografía
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <p role="status">Cargando fotografía...</p>
      )}

      {avatarLoadError && (
        <p
          role="alert"
          className="member-avatar-profile-notice member-avatar-profile-notice--error"
        >
          No se pudo cargar la fotografía.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="member-avatar-profile-notice member-avatar-profile-notice--error"
        >
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="member-avatar-profile-notice member-avatar-profile-notice--success"
        >
          {message}
        </p>
      )}
    </section>
  );
}
