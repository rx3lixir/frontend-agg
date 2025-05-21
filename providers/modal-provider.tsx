"use client";

import { useEffect, useState } from "react";

import { DashBoardModal } from "@/components/modals/dashboard-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <DashBoardModal />
    </>
  );
};
