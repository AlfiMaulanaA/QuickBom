"use client";

interface AppContentProps {
  children: React.ReactNode;
}

export function AppContent({ children }: AppContentProps) {
  return (
    <>
      {children}
    </>
  );
}
