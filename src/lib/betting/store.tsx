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
  bankroll: number;
}

const empty: State = {
  matches: [],
  slip: [],
  tickets: [],
  highProbMode: false,
  bankroll: 0,
};

export interface LegSettlement {
  result: "won" | "lost" | "pending";
  score?: string;
}

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
  setBankroll: (v: number) => void;
  applyLegResults: (updates: Record<string, LegSettlement>) => void;
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

  const setBankroll = useCallback(
    (v: number) => setState((s) => ({ ...s, bankroll: v })),
    [],
  );

  const applyLegResults = useCallback((updates: Record<string, LegSettlement>) => {
    setState((s) => ({
      ...s,
      tickets: s.tickets.map((t) => {
        if (!t.legs.some((l) => updates[l.id])) return t;
        const legs = t.legs.map((l) => {
          const u = updates[l.id];
          return u ? { ...l, result: u.result, final_score: u.score ?? l.final_score } : l;
        });
        const anyLost = legs.some((l) => l.result === "lost");
        const allWon = legs.every((l) => l.result === "won");
        const status: Ticket["status"] = anyLost ? "lost" : allWon ? "won" : "pending";
        return {
          ...t,
          legs,
          status,
          payout: status === "won" ? t.stake * t.combined_odds : 0,
          checked_at: new Date().toISOString(),
        };
      }),
    }));
  }, []);

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
      setBankroll,
      applyLegResults,
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
      setBankroll,
      applyLegResults,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
