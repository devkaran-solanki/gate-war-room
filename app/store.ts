'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Subject {
  id: string;
  name: string;
  totalDays: number;
  completedDays: number;
  zone: 'active' | 'standby';
  order: number;
}

interface StoreState {
  subjects: Subject[];
  mergeSelection: string[];
  mergeMode: boolean;

  // Zone management
  moveToZone: (id: string, zone: 'active' | 'standby') => void;
  reorder: (activeId: string, overId: string) => void;

  // Subject CRUD
  updateSubject: (id: string, updates: Partial<Pick<Subject, 'name' | 'totalDays'>>) => void;
  incrementDay: (id: string) => void;
  decrementDay: (id: string) => void;
  addSubject: (name: string, days: number, zone: 'active' | 'standby') => void;
  deleteSubject: (id: string) => void;

  // Merge
  toggleMergeMode: () => void;
  toggleMergeSelection: (id: string) => void;
  clearMergeSelection: () => void;
  mergeSubjects: (newName: string) => void;
}

const initialSubjects: Subject[] = [
  { id: 'sub-1', name: 'DBMS', totalDays: 15, completedDays: 0, zone: 'active', order: 0 },
  { id: 'sub-2', name: 'CDSA', totalDays: 30, completedDays: 0, zone: 'active', order: 1 },
  { id: 'sub-3', name: 'CN', totalDays: 20, completedDays: 0, zone: 'standby', order: 0 },
  { id: 'sub-4', name: 'DL + COA', totalDays: 30, completedDays: 0, zone: 'standby', order: 1 },
  { id: 'sub-5', name: 'OS', totalDays: 15, completedDays: 0, zone: 'standby', order: 2 },
  { id: 'sub-6', name: 'TOC + CD', totalDays: 20, completedDays: 0, zone: 'standby', order: 3 },
];

let idCounter = 100;
function genId() {
  return `sub-${Date.now()}-${idCounter++}`;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      subjects: initialSubjects,
      mergeSelection: [],
      mergeMode: false,

      moveToZone: (id, zone) =>
        set((state) => {
          const subjects = state.subjects.map((s) => {
            if (s.id === id) {
              const maxOrder = Math.max(
                -1,
                ...state.subjects.filter((x) => x.zone === zone).map((x) => x.order)
              );
              return { ...s, zone, order: maxOrder + 1 };
            }
            return s;
          });
          return { subjects };
        }),

      reorder: (activeId, overId) =>
        set((state) => {
          const activeItem = state.subjects.find((s) => s.id === activeId);
          const overItem = state.subjects.find((s) => s.id === overId);
          if (!activeItem || !overItem) return state;

          const targetZone = overItem.zone;
          const zoneItems = state.subjects
            .filter((s) => s.zone === targetZone || s.id === activeId)
            .filter((s) => s.zone === targetZone || s.id === activeId);

          // Get items in the target zone, sorted by order
          const sortedZoneItems = state.subjects
            .filter((s) => s.zone === targetZone)
            .sort((a, b) => a.order - b.order);

          // If active item is moving between zones
          const isMovingZones = activeItem.zone !== targetZone;

          let newItems: Subject[];

          if (isMovingZones) {
            // Remove from old zone and insert into new zone
            const withoutActive = sortedZoneItems;
            const overIndex = withoutActive.findIndex((s) => s.id === overId);
            const newZoneItems = [...withoutActive];
            newZoneItems.splice(overIndex, 0, { ...activeItem, zone: targetZone });

            newItems = state.subjects.map((s) => {
              if (s.id === activeId) {
                return { ...s, zone: targetZone, order: overIndex };
              }
              const inNewZone = newZoneItems.findIndex((x) => x.id === s.id);
              if (inNewZone !== -1) {
                return { ...s, order: inNewZone };
              }
              return s;
            });
          } else {
            // Reorder within the same zone
            const activeIndex = sortedZoneItems.findIndex((s) => s.id === activeId);
            const overIndex = sortedZoneItems.findIndex((s) => s.id === overId);

            const reordered = [...sortedZoneItems];
            const [moved] = reordered.splice(activeIndex, 1);
            reordered.splice(overIndex, 0, moved);

            newItems = state.subjects.map((s) => {
              const newIndex = reordered.findIndex((x) => x.id === s.id);
              if (newIndex !== -1) {
                return { ...s, order: newIndex };
              }
              return s;
            });
          }

          return { subjects: newItems };
        }),

      updateSubject: (id, updates) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...updates,
                  // Ensure completedDays doesn't exceed new totalDays
                  completedDays:
                    updates.totalDays !== undefined
                      ? Math.min(s.completedDays, updates.totalDays)
                      : s.completedDays,
                }
              : s
          ),
        })),

      incrementDay: (id) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id && s.completedDays < s.totalDays
              ? { ...s, completedDays: s.completedDays + 1 }
              : s
          ),
        })),

      decrementDay: (id) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id && s.completedDays > 0
              ? { ...s, completedDays: s.completedDays - 1 }
              : s
          ),
        })),

      addSubject: (name, days, zone) =>
        set((state) => {
          const maxOrder = Math.max(
            -1,
            ...state.subjects.filter((s) => s.zone === zone).map((s) => s.order)
          );
          return {
            subjects: [
              ...state.subjects,
              {
                id: genId(),
                name,
                totalDays: days,
                completedDays: 0,
                zone,
                order: maxOrder + 1,
              },
            ],
          };
        }),

      deleteSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          mergeSelection: state.mergeSelection.filter((sid) => sid !== id),
        })),

      toggleMergeMode: () =>
        set((state) => ({
          mergeMode: !state.mergeMode,
          mergeSelection: [],
        })),

      toggleMergeSelection: (id) =>
        set((state) => {
          const sel = state.mergeSelection;
          if (sel.includes(id)) {
            return { mergeSelection: sel.filter((sid) => sid !== id) };
          }
          if (sel.length >= 2) return state;
          return { mergeSelection: [...sel, id] };
        }),

      clearMergeSelection: () => set({ mergeSelection: [] }),

      mergeSubjects: (newName) =>
        set((state) => {
          const [id1, id2] = state.mergeSelection;
          const sub1 = state.subjects.find((s) => s.id === id1);
          const sub2 = state.subjects.find((s) => s.id === id2);
          if (!sub1 || !sub2) return state;

          const mergedSubject: Subject = {
            id: genId(),
            name: newName,
            totalDays: sub1.totalDays + sub2.totalDays,
            completedDays: sub1.completedDays + sub2.completedDays,
            zone: sub1.zone,
            order: sub1.order,
          };

          return {
            subjects: [
              ...state.subjects.filter((s) => s.id !== id1 && s.id !== id2),
              mergedSubject,
            ],
            mergeSelection: [],
            mergeMode: false,
          };
        }),
    }),
    {
      name: 'gate-war-room-storage',
    }
  )
);
