import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface AskNourState {
  open: boolean;
  prefill: string | null;
  openAsk: (prefill?: string) => void;
  closeAsk: () => void;
}

const AskNourContext = createContext<AskNourState>({
  open: false,
  prefill: null,
  openAsk: () => {},
  closeAsk: () => {},
});

export function AskNourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<string | null>(null);

  const openAsk = useCallback((q?: string) => {
    setPrefill(q ?? null);
    setOpen(true);
  }, []);

  const closeAsk = useCallback(() => {
    setOpen(false);
    setPrefill(null);
  }, []);

  return (
    <AskNourContext.Provider value={{ open, prefill, openAsk, closeAsk }}>
      {children}
    </AskNourContext.Provider>
  );
}

export function useAskNour() {
  return useContext(AskNourContext);
}
