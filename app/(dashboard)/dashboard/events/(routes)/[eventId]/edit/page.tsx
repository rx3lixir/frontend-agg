"use client";

import { EventForm } from "@/app/(dashboard)/dashboard/events/components/event-form";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner"; // Создайте этот компонент или используйте существующий

export default function EditEventPage() {
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получение данных события по ID
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8080/event/api/v1/events/${params.eventId}`,
        );
        setEvent(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке события:", error);
        toast.error("Не удалось загрузить данные события");
      } finally {
        setLoading(false);
      }
    };

    if (params.eventId) {
      fetchEvent();
    }
  }, [params.eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EventForm initialData={event} />
      </div>
    </div>
  );
}
