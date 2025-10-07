-- ============================================================================
-- Simulai OAB - SQL Setup Script
-- Execute este script no Supabase SQL Editor se o Prisma não conectar
-- https://supabase.com/dashboard/project/jtgoxjpnrlxbvhfbltuc/sql
-- ============================================================================

-- ENUMS
CREATE TYPE "Subject" AS ENUM (
  'ETHICS',
  'CONSTITUTIONAL',
  'CIVIL',
  'CIVIL_PROCEDURE',
  'CRIMINAL',
  'CRIMINAL_PROCEDURE',
  'LABOUR',
  'LABOUR_PROCEDURE',
  'ADMINISTRATIVE',
  'TAXES',
  'BUSINESS',
  'CONSUMER',
  'ENVIRONMENTAL',
  'CHILDREN',
  'INTERNATIONAL',
  'HUMAN_RIGHTS'
);

CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD');
CREATE TYPE "SimulationType" AS ENUM ('FULL_EXAM', 'ADAPTIVE', 'QUICK_PRACTICE', 'ERROR_REVIEW', 'BY_SUBJECT');
CREATE TYPE "SimulationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
CREATE TYPE "PlanType" AS ENUM ('FREE', 'BASIC', 'PRO');

-- ============================================================================
-- TABLES
-- ============================================================================

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "supabaseId" TEXT NOT NULL UNIQUE,
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_supabaseId_idx" ON "User"("supabaseId");

-- UserProfile
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION,
    "dailyGoal" INTEGER NOT NULL DEFAULT 20,
    "preferredSubjects" "Subject"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Question
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "examYear" INTEGER NOT NULL,
    "examPhase" INTEGER NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "subject" "Subject" NOT NULL,
    "statement" TEXT NOT NULL,
    "explanation" TEXT,
    "nullified" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" "Difficulty",
    "averageTime" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "keywords" TEXT[],
    "legalReferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    UNIQUE ("examId", "questionNumber")
);

CREATE INDEX "Question_subject_difficulty_idx" ON "Question"("subject", "difficulty");
CREATE INDEX "Question_examYear_examPhase_idx" ON "Question"("examYear", "examPhase");

-- Alternative
CREATE TABLE "Alternative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    UNIQUE ("questionId", "label"),
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

CREATE INDEX "Alternative_questionId_idx" ON "Alternative"("questionId");

-- UserAnswer
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "simulationId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "confidence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE,
    FOREIGN KEY ("alternativeId") REFERENCES "Alternative"("id") ON DELETE CASCADE,
    FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE
);

CREATE INDEX "UserAnswer_userId_idx" ON "UserAnswer"("userId");
CREATE INDEX "UserAnswer_questionId_idx" ON "UserAnswer"("questionId");
CREATE INDEX "UserAnswer_simulationId_idx" ON "UserAnswer"("simulationId");
CREATE INDEX "UserAnswer_userId_isCorrect_idx" ON "UserAnswer"("userId", "isCorrect");

-- Simulation
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" "SimulationType" NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "timeSpent" INTEGER,
    "subjects" "Subject"[],
    "targetDifficulty" "Difficulty",
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Simulation_userId_status_idx" ON "Simulation"("userId", "status");
CREATE INDEX "Simulation_createdAt_idx" ON "Simulation"("createdAt");

-- SimulationQuestion
CREATE TABLE "SimulationQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "simulationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    UNIQUE ("simulationId", "questionId"),
    FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE,
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE
);

CREATE INDEX "SimulationQuestion_simulationId_idx" ON "SimulationQuestion"("simulationId");

-- Achievement
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- UserAchievement
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("userId", "achievementId"),
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE
);

CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- StudyPlan
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetExamDate" TIMESTAMP(3),
    "weeklyGoal" INTEGER NOT NULL,
    "focusSubjects" "Subject"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "StudyPlan_userId_isActive_idx" ON "StudyPlan"("userId", "isActive");
