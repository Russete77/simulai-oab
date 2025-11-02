"use client";

import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { OnboardingTutorial } from "./onboarding-tutorial";

export function OnboardingWrapper() {
  const {
    isLoading,
    showTutorial,
    currentStep,
    completeStep,
    skipOnboarding,
    closeTutorial,
  } = useOnboarding();

  if (isLoading || !showTutorial) {
    return null;
  }

  return (
    <OnboardingTutorial
      currentStep={currentStep}
      onStepComplete={completeStep}
      onClose={closeTutorial}
      onSkip={skipOnboarding}
    />
  );
}
