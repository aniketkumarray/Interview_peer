import React from 'react';
import { Navbar } from '@/components/navbar';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <OnboardingWizard />
      </main>
    </div>
  );
}
