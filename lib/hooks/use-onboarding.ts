"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

interface OnboardingState {
  isLoading: boolean;
  isOnboardingComplete: boolean;
  currentStep: number;
  showTutorial: boolean;
  startOnboarding: () => void;
  completeStep: (step: number) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  closeTutorial: () => void;
}

export function useOnboarding(): OnboardingState {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // Load onboarding state from API
  useEffect(() => {
    if (!isLoaded || !user) {
      setIsLoading(false);
      return;
    }

    const loadOnboardingState = async () => {
      try {
        const response = await fetch("/api/user/onboarding");
        if (response.ok) {
          const data = await response.json();
          setIsOnboardingComplete(data.onboardingCompleted || false);
          setCurrentStep(data.onboardingStep || 0);

          // Show tutorial automatically for new users
          if (!data.onboardingCompleted && data.onboardingStep === 0) {
            setShowTutorial(true);
            // Start onboarding
            await updateOnboardingProgress(1, false);
            setCurrentStep(1);
          }
        }
      } catch (error) {
        console.error("Failed to load onboarding state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOnboardingState();
  }, [isLoaded, user]);

  const startOnboarding = () => {
    setShowTutorial(true);
    if (currentStep === 0) {
      setCurrentStep(1);
      updateOnboardingProgress(1, false);
    }
  };

  const completeStep = async (step: number) => {
    setCurrentStep(step);

    // Complete onboarding if all steps are done
    const isComplete = step >= 3;
    await updateOnboardingProgress(step, isComplete);

    if (isComplete) {
      setIsOnboardingComplete(true);
      setShowTutorial(false);
    }
  };

  const skipOnboarding = async () => {
    await updateOnboardingProgress(4, true);
    setIsOnboardingComplete(true);
    setShowTutorial(false);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return {
    isLoading,
    isOnboardingComplete,
    currentStep,
    showTutorial,
    startOnboarding,
    completeStep,
    skipOnboarding,
    closeTutorial,
  };
}

async function updateOnboardingProgress(
  step: number,
  completed: boolean
): Promise<void> {
  try {
    await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step,
        completed,
      }),
    });
  } catch (error) {
    console.error("Failed to update onboarding progress:", error);
  }
}
