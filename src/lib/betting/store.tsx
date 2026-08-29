import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Leg, Match, Ticket } from "./types";
import { combineLegs } from "./analysis";

const KEY = "betanalyser-pro-v1";

interface State {
  matches: Match[];
  slip: Leg[];
  tickets: Ticket[];
  highProbMode: boolean;
}

const empty: State = { matches: [], slip: [], tickets: [], highProbMode: false };

interface Ctx extends State {
  hydrated: boolean;
  addMatch: (m: Match) => void;
  removeMatch: (id: string) => void;
  addLeg: (leg: Leg) => void;
  removeLeg: (id: string) => void;
  clearSlip: () => void;
  finalizeTicket: (stake: number) => void;
  setTicketStatus: (id: string, status: Ticket["status"]) => void;
  setHighProbMode: (v: boolean) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addMatch = useCallback(
    (m: Match) => setState((s) => ({ ...s, matches: [m, ...s.matches] })),
    [],
  );
  const removeMatch = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        matches: s.matches.filter((m) => m.id !== id),
        slip: s.slip.filter((l) => l.match_id !== id),
      })),
    [],
  );
  const addLeg = useCallback(
    (leg: Leg) =>
      setState((s) =>
        s.slip.some((l) => l.match_id === leg.match_id && l.key === leg.key)
          ? s
          : { ...s, slip: [...s.slip, leg] },
      ),
    [],
  );
  const removeLeg = useCallback(
    (id: string) => setState((s) => ({ ...s, slip: s.slip.filter((l) => l.id !== id) })),
    [],
  );
  const clearSlip = useCallback(() => setState((s) => ({ ...s, slip: [] })), []);

  const finalizeTicket = useCallback((stake: number) => {
    setState((s) => {
      if (!s.slip.length) return s;
      const { combined_probability, combined_odds } = combineLegs(s.slip);
      const ticket: Ticket = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        legs: s.slip,
        combined_probability,
        combined_odds,
        status: "pending",
        stake,
        payout: 0,
      };
      return { ...s, slip: [], tickets: [ticket, ...s.tickets] };
    });
  }, []);

  const setTicketStatus = useCallback((id: string, status: Ticket["status"]) => {
    setState((s) => ({
      ...s,
      tickets: s.tickets.map((t) =>
        t.id === id
          ? { ...t, status, payout: status === "won" ? t.stake * t.combined_odds : 0 }
          : t,
      ),
    }));
  }, []);

  const setHighProbMode = useCallback(
    (v: boolean) => setState((s) => ({ ...s, highProbMode: v })),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      addMatch,
      removeMatch,
      addLeg,
      removeLeg,
      clearSlip,
      finalizeTicket,
      setTicketStatus,
      setHighProbMode,
    }),
    [
      state,
      hydrated,
      addMatch,
      removeMatch,
      addLeg,
      removeLeg,
      clearSlip,
      finalizeTicket,
      setTicketStatus,
      setHighProbMode,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
