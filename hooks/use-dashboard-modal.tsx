import { create } from "zustand";

interface useDashboardModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const useDashboardModal = create<useDashboardModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
