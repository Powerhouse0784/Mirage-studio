CREATE TABLE "LearningMission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "missionKey" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningMission_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SimulationRun" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "investigationId" TEXT,
  "scenario" TEXT NOT NULL,
  "detected" BOOLEAN NOT NULL,
  "enabledDecoys" INTEGER NOT NULL,
  "eventCount" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AchievementUnlock" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AchievementUnlock_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DailyChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "qualifyingRunId" TEXT,
  "reviewedEvidence" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LearningMission_userId_missionKey_key" ON "LearningMission"("userId", "missionKey");
CREATE INDEX "LearningMission_userId_completedAt_idx" ON "LearningMission"("userId", "completedAt");
CREATE INDEX "SimulationRun_userId_completedAt_idx" ON "SimulationRun"("userId", "completedAt");
CREATE INDEX "SimulationRun_investigationId_completedAt_idx" ON "SimulationRun"("investigationId", "completedAt");
CREATE UNIQUE INDEX "AchievementUnlock_userId_key_key" ON "AchievementUnlock"("userId", "key");
CREATE INDEX "AchievementUnlock_userId_earnedAt_idx" ON "AchievementUnlock"("userId", "earnedAt");
CREATE UNIQUE INDEX "DailyChallenge_userId_dateKey_key" ON "DailyChallenge"("userId", "dateKey");
CREATE INDEX "DailyChallenge_userId_dateKey_idx" ON "DailyChallenge"("userId", "dateKey");
ALTER TABLE "LearningMission" ADD CONSTRAINT "LearningMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AchievementUnlock" ADD CONSTRAINT "AchievementUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
