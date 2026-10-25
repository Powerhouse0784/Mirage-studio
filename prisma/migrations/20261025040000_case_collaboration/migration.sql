CREATE TABLE "InvestigationComment" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" VARCHAR(4000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InvestigationComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InvestigationActivity" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestigationActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InvestigationComment_investigationId_createdAt_idx" ON "InvestigationComment"("investigationId", "createdAt");
CREATE INDEX "InvestigationComment_authorId_createdAt_idx" ON "InvestigationComment"("authorId", "createdAt");
CREATE INDEX "InvestigationActivity_investigationId_createdAt_idx" ON "InvestigationActivity"("investigationId", "createdAt");

ALTER TABLE "InvestigationComment" ADD CONSTRAINT "InvestigationComment_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationComment" ADD CONSTRAINT "InvestigationComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvestigationActivity" ADD CONSTRAINT "InvestigationActivity_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
