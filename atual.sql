-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.Achievement (
  id text NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  points integer NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT Achievement_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Alternative (
  id text NOT NULL,
  questionId text NOT NULL,
  label text NOT NULL,
  text text NOT NULL,
  isCorrect boolean NOT NULL,
  CONSTRAINT Alternative_pkey PRIMARY KEY (id),
  CONSTRAINT Alternative_questionId_fkey FOREIGN KEY (questionId) REFERENCES public.Question(id)
);
CREATE TABLE public.Customer (
  id text NOT NULL,
  userId text NOT NULL UNIQUE,
  name text NOT NULL,
  cpfCnpj text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text NOT NULL,
  mobilePhone text,
  address text,
  addressNumber text,
  complement text,
  province text,
  city text,
  state text,
  postalCode text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  stripeCustomerId text,
  CONSTRAINT Customer_pkey PRIMARY KEY (id),
  CONSTRAINT Customer_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.Payment (
  id text NOT NULL,
  subscriptionId text,
  asaasPaymentId text NOT NULL UNIQUE,
  status USER-DEFINED NOT NULL DEFAULT 'PENDING'::"PaymentStatus",
  paymentMethod USER-DEFINED NOT NULL,
  value double precision NOT NULL,
  netValue double precision,
  dueDate timestamp without time zone NOT NULL,
  paymentDate timestamp without time zone,
  confirmedDate timestamp without time zone,
  pixQrCode text,
  pixQrCodeUrl text,
  bankSlipUrl text,
  invoiceUrl text,
  transactionReceiptUrl text,
  webhookEvents jsonb,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  stripePaymentId text,
  stripePaymentIntentId text,
  stripeInvoiceId text,
  CONSTRAINT Payment_pkey PRIMARY KEY (id),
  CONSTRAINT Payment_subscriptionId_fkey FOREIGN KEY (subscriptionId) REFERENCES public.Subscription(id)
);
CREATE TABLE public.Question (
  id text NOT NULL,
  examId text NOT NULL,
  examYear integer NOT NULL,
  examPhase integer NOT NULL,
  questionNumber integer NOT NULL,
  subject USER-DEFINED NOT NULL,
  statement text NOT NULL,
  explanation text,
  nullified boolean NOT NULL DEFAULT false,
  difficulty USER-DEFINED,
  averageTime double precision,
  successRate double precision,
  keywords ARRAY,
  legalReferences jsonb,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT Question_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Simulation (
  id text NOT NULL,
  userId text NOT NULL,
  type USER-DEFINED NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'IN_PROGRESS'::"SimulationStatus",
  totalQuestions integer NOT NULL,
  score double precision,
  timeSpent integer,
  subjects ARRAY,
  targetDifficulty USER-DEFINED,
  startedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completedAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT Simulation_pkey PRIMARY KEY (id),
  CONSTRAINT Simulation_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.SimulationQuestion (
  id text NOT NULL,
  simulationId text NOT NULL,
  questionId text NOT NULL,
  order integer NOT NULL,
  CONSTRAINT SimulationQuestion_pkey PRIMARY KEY (id),
  CONSTRAINT SimulationQuestion_simulationId_fkey FOREIGN KEY (simulationId) REFERENCES public.Simulation(id),
  CONSTRAINT SimulationQuestion_questionId_fkey FOREIGN KEY (questionId) REFERENCES public.Question(id)
);
CREATE TABLE public.StudyPlan (
  id text NOT NULL,
  userId text NOT NULL,
  name text NOT NULL,
  description text,
  targetExamDate timestamp without time zone,
  weeklyGoal integer NOT NULL,
  focusSubjects ARRAY,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT StudyPlan_pkey PRIMARY KEY (id),
  CONSTRAINT StudyPlan_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.Subscription (
  id text NOT NULL,
  customerId text NOT NULL,
  asaasSubscriptionId text UNIQUE,
  plan text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'ACTIVE'::"SubscriptionStatus",
  value double precision NOT NULL,
  totalValue double precision NOT NULL,
  billingType text NOT NULL,
  cycle text NOT NULL,
  nextDueDate timestamp without time zone,
  startDate timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  canceledAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  stripeSubscriptionId text,
  stripePriceId text,
  stripeProductId text,
  CONSTRAINT Subscription_pkey PRIMARY KEY (id),
  CONSTRAINT Subscription_customerId_fkey FOREIGN KEY (customerId) REFERENCES public.Customer(id)
);
CREATE TABLE public.User (
  id text NOT NULL,
  email text NOT NULL,
  name text,
  supabaseId text,
  planType USER-DEFINED NOT NULL DEFAULT 'FREE'::"PlanType",
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  clerkId text,
  dailyQuestionsCount integer NOT NULL DEFAULT 0,
  dailyQuestionsResetAt timestamp without time zone,
  monthlySimulationsCount integer NOT NULL DEFAULT 0,
  monthlySimulationsResetAt timestamp without time zone,
  dailyAiExplanationsCount integer NOT NULL DEFAULT 0,
  dailyAiExplanationsResetAt timestamp without time zone,
  dailyAiChatsCount integer NOT NULL DEFAULT 0,
  dailyAiChatsResetAt timestamp without time zone,
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.UserAchievement (
  id text NOT NULL,
  userId text NOT NULL,
  achievementId text NOT NULL,
  unlockedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT UserAchievement_pkey PRIMARY KEY (id),
  CONSTRAINT UserAchievement_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT UserAchievement_achievementId_fkey FOREIGN KEY (achievementId) REFERENCES public.Achievement(id)
);
CREATE TABLE public.UserAnswer (
  id text NOT NULL,
  userId text NOT NULL,
  questionId text NOT NULL,
  alternativeId text NOT NULL,
  simulationId text,
  isCorrect boolean NOT NULL,
  timeSpent integer NOT NULL,
  confidence integer,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT UserAnswer_pkey PRIMARY KEY (id),
  CONSTRAINT UserAnswer_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT UserAnswer_questionId_fkey FOREIGN KEY (questionId) REFERENCES public.Question(id),
  CONSTRAINT UserAnswer_alternativeId_fkey FOREIGN KEY (alternativeId) REFERENCES public.Alternative(id),
  CONSTRAINT UserAnswer_simulationId_fkey FOREIGN KEY (simulationId) REFERENCES public.Simulation(id)
);
CREATE TABLE public.UserProfile (
  id text NOT NULL,
  userId text NOT NULL,
  totalPoints integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  lastStudyDate timestamp without time zone,
  totalQuestions integer NOT NULL DEFAULT 0,
  correctAnswers integer NOT NULL DEFAULT 0,
  averageTime double precision,
  dailyGoal integer NOT NULL DEFAULT 20,
  preferredSubjects ARRAY,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  onboardingCompleted boolean NOT NULL DEFAULT false,
  onboardingStep integer NOT NULL DEFAULT 0,
  onboardingStartedAt timestamp without time zone,
  onboardingCompletedAt timestamp without time zone,
  CONSTRAINT UserProfile_pkey PRIMARY KEY (id),
  CONSTRAINT UserProfile_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id)
);
CREATE TABLE public.UserQuestionChat (
  id text NOT NULL,
  userId text NOT NULL,
  questionId text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  messageCount integer NOT NULL DEFAULT 0,
  lastMessage text,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT UserQuestionChat_pkey PRIMARY KEY (id),
  CONSTRAINT UserQuestionChat_userId_fkey FOREIGN KEY (userId) REFERENCES public.User(id),
  CONSTRAINT UserQuestionChat_questionId_fkey FOREIGN KEY (questionId) REFERENCES public.Question(id)
);
CREATE TABLE public.WebhookLog (
  id text NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  error text,
  processedAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT WebhookLog_pkey PRIMARY KEY (id)
);