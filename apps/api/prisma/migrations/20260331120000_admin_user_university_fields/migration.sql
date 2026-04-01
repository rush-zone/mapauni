-- Fase 2: Admin Master + campos MEC/INEP na University

-- AdminUser: operador interno da plataforma InfoUni
CREATE TABLE "AdminUser" (
    "id"           TEXT NOT NULL,
    "email"        TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- Novos campos na University para suportar importação MEC/INEP
ALTER TABLE "University"
    ADD COLUMN "sigla"       TEXT,
    ADD COLUMN "academicOrg" TEXT,
    ADD COLUMN "ibgeCode"    TEXT,
    ADD COLUMN "isActive"    BOOLEAN NOT NULL DEFAULT true;
