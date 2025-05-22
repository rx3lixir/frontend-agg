"use client";

import { CategoryForm } from "@/app/(dashboard)/dashboard/categories/components/category-form";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner"; // Создайте этот компонент или используйте существующий

export default function EditCategoryPage() {
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получение данных события по ID
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8080/event/api/v1/categories/${params.categoryId}`,
        );
        setEvent(response.data);
      } catch (error) {
        console.error("Ошибка при загрузке категории:", error);
        toast.error("Не удалось загрузить данные категории");
      } finally {
        setLoading(false);
      }
    };

    if (params.categoryId) {
      fetchCategory();
    }
  }, [params.categoryId]);

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
        <CategoryForm initialData={event} />
      </div>
    </div>
  );
}
