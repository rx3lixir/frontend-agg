import { useAdminGuard } from "@/hooks/useAuthGuard";
import { EventClient } from "./components/client";
import { EventColumn } from "./components/columns";

interface EventApiResponse {
  id: number;
  name: string;
  description: string;
  category_id: number;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  source: string;
  created_at: string;
}

// Вспомогательная функция для преобразования формата данных
const mapEventResponseToEventColumn = (
  events: EventApiResponse[],
): EventColumn[] => {
  return events.map((event) => ({
    id: event.id.toString(),
    name: event.name,
    description: event.description,
    category: `Категория ${event.category_id}`, // В будущем здесь может быть реальное название категории
    date: event.date,
    time: event.time,
    location: event.location,
    price: event.price,
    image: event.image,
    source: event.source,
    created_at: event.created_at,
    updated_at: event.created_at, // В примере нет updated_at, поэтому используем created_at
  }));
};

const EventsPage = async () => {
  // Отправляем GET запрос на API
  const response = await fetch("http://localhost:8080/event/api/v1/events", {
    cache: "no-store", // Отключаем кеширование для получения актуальных данных при каждом запросе
  });

  if (!response.ok) {
    console.error("Ошибка загрузки событий:", response.statusText);
    return <div>Ошибка загрузки данных. Попробуйте позже.</div>;
  }

  const eventsData: EventApiResponse[] = await response.json();
  const formattedEvents = mapEventResponseToEventColumn(eventsData);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EventClient data={formattedEvents} />
      </div>
    </div>
  );
};

export default EventsPage;
