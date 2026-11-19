-- NotificationDeliveries — propuesta para revisión del equipo (RF-38 + CU043-CU046)
-- Estado: NO aplicado en producción. Sólo borrador para acordar con la BD compartida.
-- Contiene campos extras respecto al DDL oficial de ViBoxSchool_V1.0.2RE.sql porque
-- el correo lo necesita para CU043/CU044: externalId, provider, eventType, subject, createdAt.
--
-- Diferencias vs. DDL oficial del equipo (docs/ViBoxSchool_V1.0.2RE.sql):
--   + externalId  text      (id del proveedor: cruza webhooks de entrega)
--   + provider    text      (resend | brevo | mock)
--   + eventType   text      (payment_reminder | observation | enrollment_confirmation | ...)
--   + subject     text
--   + settingId   uuid      (referencia a NotificationSettings, ON DELETE SET NULL)
--   + createdAt   timestamptz
--   - notificationId deja de ser NOT NULL: un correo CU046/CU045 no nace de una
--     notificación interna (Notification), así que exigirla obliga a crear filas
--     internas ficticias o rompe el concepto CU041.
--   - UNIQUE físico no incluido aquí; el equipo decide
--   - Los FKs últimos van con el paquete SQL que el equipo apruebe

CREATE TABLE "NotificationDeliveriesPropuesta" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schoolId" uuid NOT NULL REFERENCES "Schools" ("id") ON DELETE CASCADE,
  "settingId" uuid REFERENCES "NotificationSettings" ("id") ON DELETE SET NULL,
  "eventType" text NOT NULL,
  "channel" text NOT NULL DEFAULT 'email',
  "provider" text NOT NULL DEFAULT 'mock',
  "destination" text NOT NULL,
  "subject" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'sent', 'delivered', 'failed')),
  "attempts" integer NOT NULL DEFAULT 0,
  "lastAttemptAt" timestamptz,
  "sentAt" timestamptz,
  "deliveredAt" timestamptz,
  "lastError" text,
  "externalId" text,
  "manualResendCount" integer NOT NULL DEFAULT 0,
  "lastResentById" uuid REFERENCES "Users" ("id") ON DELETE SET NULL,
  "lastResentAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "isActive" boolean NOT NULL DEFAULT true,
  "isDeleted" boolean NOT NULL DEFAULT false
);

CREATE INDEX "idx_NotificationDeliveriesPropuesta_schoolId" ON "NotificationDeliveriesPropuesta" ("schoolId");
CREATE INDEX "idx_NotificationDeliveriesPropuesta_status" ON "NotificationDeliveriesPropuesta" ("status");
CREATE INDEX "idx_NotificationDeliveriesPropuesta_externalId" ON "NotificationDeliveriesPropuesta" ("externalId") WHERE "externalId" IS NOT NULL;
