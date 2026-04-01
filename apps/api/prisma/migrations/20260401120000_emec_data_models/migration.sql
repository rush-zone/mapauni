-- Fase 2: Models de dados e-MEC por universidade

CREATE TABLE "AcervoAcademico" (
    "id"                     TEXT NOT NULL,
    "universityId"           TEXT NOT NULL,
    "instituicaoResponsavel" TEXT,
    "endereco"               TEXT,
    "municipio"              TEXT,
    "uf"                     TEXT,
    "email"                  TEXT,
    "telefone"               TEXT,
    "responsavelLegal"       TEXT,
    "tipoAcervo"             TEXT,
    "diplomaDigital"         BOOLEAN,
    "urlDiplomaDigital"      TEXT,
    "urlHistoricoDigital"    TEXT,
    "registroDiploma"        TEXT,
    "emecSyncedAt"           TIMESTAMP(3),
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcervoAcademico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcervoAcademico_universityId_key" ON "AcervoAcademico"("universityId");

ALTER TABLE "AcervoAcademico"
    ADD CONSTRAINT "AcervoAcademico_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "AtoRegulatorio" (
    "id"             TEXT NOT NULL,
    "universityId"   TEXT NOT NULL,
    "tipo"           TEXT NOT NULL,
    "numero"         TEXT,
    "dataPublicacao" TIMESTAMP(3),
    "situacao"       TEXT,
    "arquivo"        TEXT,
    "emecSyncedAt"   TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AtoRegulatorio_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AtoRegulatorio"
    ADD CONSTRAINT "AtoRegulatorio_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "ProcessoEmec" (
    "id"           TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "numero"       TEXT NOT NULL,
    "tipo"         TEXT,
    "situacao"     TEXT,
    "dataAutuacao" TIMESTAMP(3),
    "dataDecisao"  TIMESTAMP(3),
    "resultado"    TEXT,
    "emecSyncedAt" TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessoEmec_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProcessoEmec"
    ADD CONSTRAINT "ProcessoEmec_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "OcorrenciaEmec" (
    "id"             TEXT NOT NULL,
    "universityId"   TEXT NOT NULL,
    "tipo"           TEXT,
    "descricao"      TEXT,
    "dataOcorrencia" TIMESTAMP(3),
    "situacao"       TEXT,
    "emecSyncedAt"   TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OcorrenciaEmec_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OcorrenciaEmec"
    ADD CONSTRAINT "OcorrenciaEmec_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "CursoAutorizadoEmec" (
    "id"           TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "codigoEmec"   TEXT,
    "nome"         TEXT NOT NULL,
    "grau"         TEXT,
    "modalidade"   TEXT,
    "municipio"    TEXT,
    "uf"           TEXT,
    "situacao"     TEXT,
    "conceito"     DOUBLE PRECISION,
    "vagas"        INTEGER,
    "emecSyncedAt" TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CursoAutorizadoEmec_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CursoAutorizadoEmec"
    ADD CONSTRAINT "CursoAutorizadoEmec_universityId_fkey"
    FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
