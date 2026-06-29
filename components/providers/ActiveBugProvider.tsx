'use client';

import { createContext, useContext } from 'react';

const ActiveBugContext = createContext<string | null>(null);

export function ActiveBugProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bug id is intentionally NOT passed to client — store uses server actions
  return (
    <ActiveBugContext.Provider value={null}>{children}</ActiveBugContext.Provider>
  );
}

export function useActiveBug() {
  return useContext(ActiveBugContext);
}
