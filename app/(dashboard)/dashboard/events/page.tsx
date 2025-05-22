import { EventClient } from "./components/client";
import { EventColumn } from "./components/columns";

interface Category {
  id: number;
  name: string;
}

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
const mapEventsWithCategories = (
  events: EventApiResponse[],
  categories: Category[],
): EventColumn[] => {
  const categoryMap = new Map<number, string>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat.name));

  return events.map((event) => ({
    id: event.id.toString(),
    name: event.name,
    description: event.description,
    category: categoryMap.get(event.category_id) || "Неизвестная категория",
    date: event.date,
    time: event.time,
    location: event.location,
    price: event.price,
    image: event.image,
    source: event.source,
    created_at: event.created_at,
    updated_at: event.created_at,
  }));
};

const EventsPage = async () => {
  // Отправляем GET запрос на API
  const [eventsRes, categoriesRes] = await Promise.all([
    fetch("http://localhost:8080/event/api/v1/events", { cache: "no-store" }),
    fetch("http://localhost:8080/event/api/v1/categories"),
  ]);

  if (!eventsRes.ok || !categoriesRes.ok) {
    console.error(
      "Ошибка загрузки:",
      eventsRes.statusText,
      categoriesRes.statusText,
    );
    return <div>Ошибка загрузки данных. Попробуйте позже.</div>;
  }

  const eventsData: EventApiResponse[] = await eventsRes.json();
  const categories: Category[] = await categoriesRes.json();

  const formattedEvents = mapEventsWithCategories(eventsData, categories);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EventClient data={formattedEvents} />
      </div>
    </div>
  );
};

export default EventsPage;
