import { CategoryClient } from "./components/client";
import { CategoryColumn } from "./components/columns";

// Тип для категорий, получаемых с бэкенда
interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// Вспомогательная функция для преобразования формата данных
const mapEventResponseToEventColumn = (
  category: Category[],
): CategoryColumn[] => {
  return category.map((c) => ({
    id: c.id.toString(),
    name: c.name,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }));
};

const CategoriesPage = async () => {
  // Отправляем GET запрос на API
  const response = await fetch(
    "http://localhost:8080/event/api/v1/categories",
    {
      cache: "no-store", // Отключаем кеширование для получения актуальных данных при каждом запросе
    },
  );

  if (!response.ok) {
    console.error("Ошибка загрузки категорий:", response.statusText);
    return <div>Ошибка загрузки данных. Попробуйте позже.</div>;
  }

  const categoriesData: Category[] = await response.json();
  const formattedCategories = mapEventResponseToEventColumn(categoriesData);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CategoryClient data={formattedCategories} />
      </div>
    </div>
  );
};

export default CategoriesPage;
