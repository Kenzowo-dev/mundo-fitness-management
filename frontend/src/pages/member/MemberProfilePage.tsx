import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useAuth } from "../../context/useAuth";
import { useUpdateOwnClientProfile } from "../../hooks/useApi";
import type { Client } from "../../types/api";
import Alert from "../../components/Alert";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import Skeleton from "../../components/Skeleton";
import "@/styles/dashboard/MemberPortal.css";
import MemberPhysicalProfile from "../../components/member/MemberPhysicalProfile";
import MemberAvatarProfile from "../../components/member/MemberAvatarProfile";
import MemberGoals from "../../components/member/MemberGoals";
import MemberProgressCharts from "../../components/member/MemberProgressCharts";
import "../../styles/member/MemberProfileTheme.css";
import {
  ADDRESS_MESSAGE,
  PERSON_NAME_MESSAGE,
  PHONE_MESSAGE,
  VALID_ADDRESS,
  VALID_PERSON_NAME,
  VALID_PHONE,
  normalizePhone,
  sanitizeAddress,
  sanitizePersonName,
  sanitizePhone,
} from "../../utils/fieldValidation";

type ContactDetails = Pick<
  Client,
  "phone" | "address" | "emergencyContactName" | "emergencyContactPhone"
>;

type ContactErrors = Partial<Record<keyof ContactDetails, string>>;

function validateContactDetails(form: ContactDetails): ContactErrors {
  const errors: ContactErrors = {};
  const phone = form.phone?.trim() ?? "";
  const address = form.address?.trim() ?? "";
  const emergencyContactName = form.emergencyContactName?.trim() ?? "";
  const emergencyContactPhone = form.emergencyContactPhone?.trim() ?? "";
  if (phone && !VALID_PHONE.test(phone)) errors.phone = PHONE_MESSAGE;
  if (address && !VALID_ADDRESS.test(address)) errors.address = `${ADDRESS_MESSAGE}.`;
  if (emergencyContactName && !VALID_PERSON_NAME.test(emergencyContactName)) {
    errors.emergencyContactName = PERSON_NAME_MESSAGE;
  }
  if (emergencyContactPhone && !VALID_PHONE.test(emergencyContactPhone)) {
    errors.emergencyContactPhone = PHONE_MESSAGE;
  }
  return errors;
}

function ProfileSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="member-card" aria-labelledby="profile-heading">
      <header className="member-section-header">
        <h2 id="profile-heading">Información personal</h2>
      </header>
      {children}
    </section>
  );
}

export default function MemberProfilePage() {
 const { user } = useAuth();
const location = useLocation();



  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState<ContactDetails>({
    phone: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});

  const updateContactField = (
    field: keyof ContactDetails,
    value: string,
    sanitize: (value: string) => string,
  ) => {
    setProfileForm((current) => ({ ...current, [field]: sanitize(value) }));
    setContactErrors((current) => {
      if (!(field in current)) return current;
      const rest = { ...current };
      delete rest[field];
      return rest;
    });
  };

  const clientQuery = useQuery<Client>({
    queryKey: ["member-portal", "client", user?.id],
    queryFn: () => api.getClientByUserId(user!.id),
    enabled: !!user?.id,
    retry: false,
  });

  useEffect(() => {
  if (!location.hash || !clientQuery.data) return;

  const sectionId = decodeURIComponent(location.hash.slice(1));

  const frame = requestAnimationFrame(() => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  return () => cancelAnimationFrame(frame);
}, [location.hash, clientQuery.data]);

  const updateProfileMutation = useUpdateOwnClientProfile(user?.id);

  const beginProfileEdit = () => {
    if (!clientQuery.data) return;

    setProfileForm({
      phone: normalizePhone(clientQuery.data.phone),
      address: clientQuery.data.address ?? "",
      emergencyContactName: clientQuery.data.emergencyContactName ?? "",
      emergencyContactPhone: normalizePhone(clientQuery.data.emergencyContactPhone),
    });

    setProfileMessage(null);
    setProfileError(null);
    setContactErrors({});
    setIsEditingProfile(true);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    const errors = validateContactDetails(profileForm);
    setContactErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateProfileMutation.mutateAsync({
        phone: profileForm.phone?.trim() ?? "",
        address: profileForm.address?.trim() ?? "",
        emergencyContactName: profileForm.emergencyContactName?.trim() ?? "",
        emergencyContactPhone: profileForm.emergencyContactPhone?.trim() ?? "",
      });
      setIsEditingProfile(false);
      setProfileMessage("Tus datos de contacto se actualizaron.");
    } catch {
      setProfileError(
        "No pudimos actualizar tus datos. Comprueba tu conexión e inténtalo de nuevo.",
      );
    }
  };

  return (
    <div className="member-portal member-profile-page">
      <header className="member-portal-header">
        <div>
          <p className="member-eyebrow">
            MUNDO FITNESS · PORTAL DEL SOCIO
          </p>
          <h1>Mi perfil</h1>
          <p>
            Consulta y actualiza tu información personal y tus datos de
            contacto.
          </p>
        </div>
      </header>

      {clientQuery.isLoading && (
        <section
          className="member-card"
          aria-label="Cargando tu perfil"
          aria-busy="true"
        >
          <div className="member-skeleton-list">
            <Skeleton height="44px" />
            <Skeleton height="44px" />
            <Skeleton height="44px" />
          </div>
        </section>
      )}

      {clientQuery.isError && (
        <section className="member-card">
          <Alert
            type="error"
            title="No pudimos cargar tu perfil"
            message="Vuelve a intentarlo. Si el problema continúa, contacta con recepción para revisar tu cuenta."
          />
          <Button
            variant="secondary"
            onClick={() => void clientQuery.refetch()}
          >
            Volver a intentar
          </Button>
        </section>
      )}

      {clientQuery.data && user?.id && (
        <MemberAvatarProfile userId={user.id} />
      )}

      {clientQuery.data && (
        <ProfileSection>
          {profileMessage && (
            <Alert
              type="success"
              message={profileMessage}
              dismissible
              onDismiss={() => setProfileMessage(null)}
            />
          )}

          {profileError && (
            <Alert
              type="error"
              message={profileError}
              dismissible
              onDismiss={() => setProfileError(null)}
            />
          )}

          {isEditingProfile ? (
            <form className="member-profile-form" onSubmit={saveProfile}>
              <FormField
                id="member-phone"
                name="phone"
                label="Teléfono"
                type="tel"
                maxLength={9}
                inputMode="numeric"
                placeholder="987654321"
                value={profileForm.phone ?? ""}
                onChange={(phone) => updateContactField("phone", phone, sanitizePhone)}
                error={contactErrors.phone}
                autoComplete="tel"
              />

              <FormField
                id="member-address"
                name="address"
                label="Dirección"
                maxLength={200}
                value={profileForm.address ?? ""}
                onChange={(address) => updateContactField("address", address, sanitizeAddress)}
                error={contactErrors.address}
                autoComplete="street-address"
              />

              <FormField
                id="emergency-name"
                name="emergencyContactName"
                label="Nombre de contacto de emergencia"
                maxLength={100}
                value={profileForm.emergencyContactName ?? ""}
                onChange={(emergencyContactName) =>
                  updateContactField("emergencyContactName", emergencyContactName, sanitizePersonName)
                }
                error={contactErrors.emergencyContactName}
              />

              <FormField
                id="emergency-phone"
                name="emergencyContactPhone"
                label="Teléfono de contacto de emergencia"
                type="tel"
                maxLength={9}
                inputMode="numeric"
                placeholder="987654321"
                value={profileForm.emergencyContactPhone ?? ""}
                onChange={(emergencyContactPhone) =>
                  updateContactField("emergencyContactPhone", emergencyContactPhone, sanitizePhone)
                }
                error={contactErrors.emergencyContactPhone}
              />

              <div className="member-profile-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  loading={updateProfileMutation.isPending}
                >
                  Guardar datos
                </Button>
              </div>
            </form>
          ) : (
            <>
              <dl className="member-details">
                <div>
                  <dt>Nombre</dt>
                  <dd>
                    {clientQuery.data.firstName} {clientQuery.data.lastName}
                  </dd>
                </div>

                <div>
                  <dt>Correo</dt>
                  <dd>{clientQuery.data.email || user?.email}</dd>
                </div>

                <div>
                  <dt>Documento</dt>
                  <dd>{clientQuery.data.dni}</dd>
                </div>

                <div>
                  <dt>Teléfono</dt>
                  <dd>{clientQuery.data.phone || "No registrado"}</dd>
                </div>

                <div>
                  <dt>Dirección</dt>
                  <dd>{clientQuery.data.address || "No registrada"}</dd>
                </div>

                <div>
                  <dt>Contacto de emergencia</dt>
                  <dd>
                    {clientQuery.data.emergencyContactName || "No registrado"}
                  </dd>
                </div>

                <div>
                  <dt>Teléfono de emergencia</dt>
                  <dd>
                    {clientQuery.data.emergencyContactPhone || "No registrado"}
                  </dd>
                </div>
              </dl>

              <div className="member-profile-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={beginProfileEdit}
                >
                  Actualizar datos
                </Button>
              </div>
            </>
          )}
        </ProfileSection>
      )}
      {clientQuery.data && <MemberPhysicalProfile />}
      {clientQuery.data && <MemberGoals />}
      {clientQuery.data && <MemberProgressCharts />}
    </div>
  );
}
