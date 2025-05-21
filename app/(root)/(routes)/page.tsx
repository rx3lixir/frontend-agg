"use client";

import { useDashboardModal } from "@/hooks/use-dashboard-modal";
import { useEffect } from "react";

const SetupPage = () => {
  const onOpen = useDashboardModal((state) => state.onOpen);
  const isOpen = useDashboardModal((state) => state.isOpen);

  useEffect(() => {
    if (!isOpen) {
      onOpen();
    }
  }, [isOpen, onOpen]);

  return <div className="p-4">Мы дома</div>;
};

export default SetupPage;
