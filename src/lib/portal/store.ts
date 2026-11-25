"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getPortalSeed, type PortalSeed } from "@/core/portal/seed";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Award,
  CashCountSession,
  CentreEvent,
  Congratulation,
  EmergencyAlert,
  FinancialTransaction,
  GovAttendance,
  Homework,
  ImamQuestion,
  ImamQuestionStatus,
  PointEntry,
  PortalMessage,
  RsvpStatus,
  RubricCategory,
  TeacherDelegation,
} from "@/core/portal/types";

/**
 * The portal demo store — one shared, persisted state so the prototype behaves like the
 * real thing ACROSS surfaces: an alert published in the admin space shows on the public
 * site and the TV, a congratulation approved by the admin goes up on the screens, a
 * point given by the teacher appears in the parent's space.
 *
 * Persisted to localStorage (per browser) — a demo convenience, NOT the source of truth:
 * every action here maps 1:1 to a server procedure of the spec (§7), which will write to
 * Postgres and the audit log once the backend lands.
 *
 * Hydration: `skipHydration` + <PortalHydrator/> rehydrates after mount, so the server
 * HTML (seed) and the first client render always match.
 */

export interface MembershipApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "femme" | "homme";
  children: { firstName: string; birthDate: string; gender: "femme" | "homme" }[];
  activityIds: string[];
  status: "pending";
  at: string;
}

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  interests: string[];
  availability: string[];
  at: string;
}

type Data = PortalSeed & {
  attendance: AttendanceRecord[];
  applications: MembershipApplication[];
  volunteerApplications: VolunteerApplication[];
};

export interface PortalState extends Data {
  hydrated: boolean;
  personaId: string | null;

  signIn: (personaId: string) => void;
  signOut: () => void;
  resetDemo: () => void;

  // school
  addPoint: (entry: Omit<PointEntry, "id" | "at">) => void;
  addAward: (award: Omit<Award, "id" | "at">) => void;
  setAttendance: (
    classId: string,
    childId: string,
    date: string,
    status: AttendanceStatus,
    early?: boolean,
  ) => void;
  addHomework: (hw: Omit<Homework, "id" | "postedAt">) => void;
  addMessage: (msg: Omit<PortalMessage, "id" | "at">) => void;
  setConsent: (childId: string, type: string, granted: boolean) => void;
  setRubricCategories: (categories: RubricCategory[]) => void;

  // screens & congratulations
  proposeCongratulation: (c: Omit<Congratulation, "id" | "status">) => void;
  decideCongratulation: (id: string, approve: boolean, by: string) => void;
  pairScreen: (id: string) => void;
  revokeScreen: (id: string) => void;

  // alerts
  publishAlert: (a: Omit<EmergencyAlert, "id" | "publishedAt" | "deliveries">) => void;
  endAlert: (id: string) => void;

  // events
  addEvent: (e: Omit<CentreEvent, "id">) => void;
  decideEvent: (id: string, publish: boolean) => void;

  // finance
  updateCashCount: (patch: Partial<CashCountSession>) => void;
  setDenomination: (cents: number, quantity: number) => void;
  attestCount: (personId: string) => void;
  closeCount: () => void;
  addTransaction: (t: Omit<FinancialTransaction, "id">) => void;
  decideTransaction: (id: string, approve: boolean) => void;
  attestCollection: (personId: string) => void;

  // governance
  setRsvp: (meetingId: string, personId: string, rsvp: RsvpStatus) => void;
  setGovAttendance: (meetingId: string, personId: string, status: GovAttendance) => void;
  addProposalComment: (proposalId: string, personId: string, text: string) => void;
  addMeeting: (m: {
    title: string;
    date: string;
    slot: string;
    mode: "sur_place" | "distanciel" | "hybride";
    location: string;
    agenda: string[];
    invitees: string[];
  }) => void;

  // volunteering & delegations
  applyVolunteer: (v: Omit<VolunteerApplication, "id" | "at">) => void;
  addDelegation: (d: Omit<TeacherDelegation, "id" | "status">) => void;
  revokeDelegation: (id: string) => void;

  // imam
  submitQuestion: (q: Omit<ImamQuestion, "id" | "status" | "at">) => void;
  setQuestionStatus: (id: string, status: ImamQuestionStatus, answer?: string) => void;

  // membership
  applyMembership: (a: Omit<MembershipApplication, "id" | "status" | "at">) => void;
}

const uid = (p: string) =>
  `${p}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;
const nowIso = () => new Date().toISOString();

const initialData = (): Data => ({
  ...getPortalSeed(),
  attendance: [],
  applications: [],
  volunteerApplications: [],
});

/** localStorage that never throws (private windows, blocked site data). */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      /* demo state simply isn't kept */
    }
  },
  removeItem: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

/** Simulated delivery report until an e-mail/SMS provider is chosen (spec §10). */
function simulateDeliveries(a: Pick<EmergencyAlert, "channels" | "audience">) {
  const base =
    a.audience === "tout_le_centre"
      ? 236
      : a.audience === "parents"
        ? 188
        : a.audience === "enseignants"
          ? 14
          : 20;
  return a.channels
    .filter((c) => c === "courriel" || c === "sms")
    .map((channel) => ({
      channel,
      sent: channel === "sms" ? base - 9 : base - 2,
      failed: channel === "sms" ? 3 : 1,
    }));
}

export const usePortal = create<PortalState>()(
  persist(
    (set, get) => ({
      ...initialData(),
      hydrated: false,
      personaId: null,

      signIn: (personaId) => set({ personaId }),
      signOut: () => set({ personaId: null }),
      resetDemo: () => set({ ...initialData(), personaId: get().personaId }),

      addPoint: (entry) =>
        set((s) => ({ points: [{ ...entry, id: uid("pt"), at: nowIso() }, ...s.points] })),
      addAward: (award) =>
        set((s) => ({
          awards: [{ ...award, id: uid("aw"), at: nowIso().slice(0, 10) }, ...s.awards],
        })),
      setAttendance: (classId, childId, date, status, early) =>
        set((s) => ({
          attendance: [
            { id: uid("at"), classId, childId, date, status, early },
            ...s.attendance.filter(
              (a) => !(a.childId === childId && a.date === date && a.classId === classId),
            ),
          ],
        })),
      addHomework: (hw) =>
        set((s) => ({ homework: [{ ...hw, id: uid("hw"), postedAt: nowIso() }, ...s.homework] })),
      addMessage: (msg) =>
        set((s) => ({ messages: [{ ...msg, id: uid("m"), at: nowIso() }, ...s.messages] })),
      // Consents are append-only (§4.2): a change adds a new line, history stays.
      setConsent: (childId, type, granted) =>
        set((s) => ({
          children: s.children.map((c) =>
            c.id === childId
              ? {
                  ...c,
                  consents: [
                    { type: type as never, granted, at: nowIso().slice(0, 10) },
                    ...c.consents,
                  ],
                }
              : c,
          ),
        })),
      setRubricCategories: (categories) =>
        set((s) => ({ rubric: { ...s.rubric, categories, version: s.rubric.version + 1 } })),

      proposeCongratulation: (c) =>
        set((s) => ({
          congratulations: [{ ...c, id: uid("cg"), status: "submitted" }, ...s.congratulations],
        })),
      decideCongratulation: (id, approve, by) =>
        set((s) => ({
          congratulations: s.congratulations.map((c) =>
            c.id === id ? { ...c, status: approve ? "approved" : "rejected", approvedBy: by } : c,
          ),
        })),
      pairScreen: (id) =>
        set((s) => ({
          screens: s.screens.map((sc) =>
            sc.id === id
              ? { ...sc, status: "paired", pairingCode: undefined, lastSeen: nowIso() }
              : sc,
          ),
        })),
      revokeScreen: (id) =>
        set((s) => ({
          screens: s.screens.map((sc) => (sc.id === id ? { ...sc, status: "revoked" } : sc)),
        })),

      publishAlert: (a) =>
        set((s) => ({
          alerts: [
            { ...a, id: uid("al"), publishedAt: nowIso(), deliveries: simulateDeliveries(a) },
            ...s.alerts,
          ],
        })),
      endAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, expiresAt: nowIso() } : a)),
        })),

      addEvent: (e) => set((s) => ({ events: [{ ...e, id: uid("ev") }, ...s.events] })),
      decideEvent: (id, publish) =>
        set((s) => ({
          events: publish
            ? s.events.map((e) => (e.id === id ? { ...e, status: "published" } : e))
            : s.events.map((e) => (e.id === id ? { ...e, status: "draft" } : e)),
        })),

      updateCashCount: (patch) => set((s) => ({ cashCount: { ...s.cashCount, ...patch } })),
      setDenomination: (cents, quantity) =>
        set((s) => ({
          cashCount: {
            ...s.cashCount,
            denominations: s.cashCount.denominations.map((d) =>
              d.cents === cents ? { ...d, quantity: Math.max(0, Math.floor(quantity) || 0) } : d,
            ),
          },
        })),
      attestCount: (personId) =>
        set((s) => ({
          cashCount: {
            ...s.cashCount,
            participants: s.cashCount.participants.map((p) =>
              p.personId === personId ? { ...p, attestedAt: p.attestedAt ?? nowIso() } : p,
            ),
          },
        })),
      closeCount: () => set((s) => ({ cashCount: { ...s.cashCount, status: "cloturee" } })),
      addTransaction: (t) =>
        set((s) => ({ transactions: [{ ...t, id: uid("tx") }, ...s.transactions] })),
      decideTransaction: (id, approve) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, status: approve ? "approuve" : "annule" } : t,
          ),
        })),
      attestCollection: (personId) =>
        set((s) =>
          s.externalCollection.attestations.some((a) => a.personId === personId)
            ? s
            : {
                externalCollection: {
                  ...s.externalCollection,
                  attestations: [...s.externalCollection.attestations, { personId, at: nowIso() }],
                  status:
                    s.externalCollection.attestations.length + 1 >= 2
                      ? "soumis"
                      : s.externalCollection.status,
                },
              },
        ),

      setRsvp: (meetingId, personId, rsvp) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  invitations: m.invitations.map((i) =>
                    i.personId === personId ? { ...i, rsvp } : i,
                  ),
                }
              : m,
          ),
        })),
      setGovAttendance: (meetingId, personId, status) =>
        set((s) => ({
          meetings: s.meetings.map((m) =>
            m.id === meetingId
              ? {
                  ...m,
                  attendance: [
                    ...m.attendance.filter((a) => a.personId !== personId),
                    { personId, status },
                  ],
                }
              : m,
          ),
        })),
      addProposalComment: (proposalId, personId, text) =>
        set((s) => ({
          proposals: s.proposals.map((p) =>
            p.id === proposalId
              ? { ...p, comments: [...p.comments, { personId, text, at: nowIso() }] }
              : p,
          ),
        })),
      addMeeting: (m) =>
        set((s) => ({
          meetings: [
            ...s.meetings,
            {
              id: uid("mt"),
              title: m.title,
              date: m.date,
              slot: m.slot,
              mode: m.mode,
              location: m.location,
              agenda: m.agenda,
              status: "planned",
              invitations: m.invitees.map((personId) => ({
                personId,
                rsvp: "no_response" as const,
              })),
              attendance: [],
            },
          ],
        })),

      applyVolunteer: (v) =>
        set((s) => ({
          volunteerApplications: [
            { ...v, id: uid("va"), at: nowIso() },
            ...s.volunteerApplications,
          ],
        })),
      addDelegation: (d) =>
        set((s) => ({
          delegations: [{ ...d, id: uid("dg"), status: "active" }, ...s.delegations],
        })),
      revokeDelegation: (id) =>
        set((s) => ({
          delegations: s.delegations.map((d) => (d.id === id ? { ...d, status: "revoked" } : d)),
        })),

      submitQuestion: (q) =>
        set((s) => ({
          imamQuestions: [
            { ...q, id: uid("q"), status: "received", at: nowIso() },
            ...s.imamQuestions,
          ],
        })),
      setQuestionStatus: (id, status, answer) =>
        set((s) => ({
          imamQuestions: s.imamQuestions.map((q) =>
            q.id === id ? { ...q, status, answer: answer ?? q.answer } : q,
          ),
        })),

      applyMembership: (a) =>
        set((s) => ({
          applications: [
            { ...a, id: uid("ad"), status: "pending", at: nowIso() },
            ...s.applications,
          ],
        })),
    }),
    {
      name: "mussalla-portail-demo",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: ({ hydrated: _h, ...rest }) => {
        void _h;
        // Functions aren't serialisable; zustand drops them, but keep the intent explicit.
        return Object.fromEntries(
          Object.entries(rest).filter(([, v]) => typeof v !== "function"),
        ) as Partial<PortalState>;
      },
      onRehydrateStorage: () => () => {
        usePortal.setState({ hydrated: true });
      },
    },
  ),
);
