CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "description" VARCHAR(12000) NOT NULL,
    "sourceUrl" VARCHAR(2048),
    "sha256" VARCHAR(64) NOT NULL,
    "createdBy" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EvidenceItem_investigationId_createdAt_idx" ON "EvidenceItem"("investigationId", "createdAt");
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
