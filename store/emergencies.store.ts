import { create } from 'zustand'
import { Emergency } from '@/types'

interface EmergenciesState {
  activeEmergencies: Emergency[]
  setActiveEmergencies: (emergencies: Emergency[]) => void
  addEmergency: (emergency: Emergency) => void
  updateEmergency: (id: string, updates: Partial<Emergency>) => void
  removeEmergency: (id: string) => void
}

export const useEmergenciesStore = create<EmergenciesState>((set) => ({
  activeEmergencies: [],

  setActiveEmergencies: (emergencies) => set({ activeEmergencies: emergencies }),

  addEmergency: (emergency) =>
    set((state) => ({
      activeEmergencies: [emergency, ...state.activeEmergencies],
    })),

  updateEmergency: (id, updates) =>
    set((state) => ({
      activeEmergencies: state.activeEmergencies.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  removeEmergency: (id) =>
    set((state) => ({
      activeEmergencies: state.activeEmergencies.filter((e) => e.id !== id),
    })),
}))
