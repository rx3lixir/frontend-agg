"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import { logger } from "@/lib/logger";

const formSchema = z.object({
  name: z.string().min(1, "Название категории обязательно"),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  initialData?: {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData }) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Редактировать категорию" : "Создать категорию";
  const description = initialData
    ? "Изменить информацию о категории"
    : "Добавить новую категорию";
  const toastMessage = initialData ? "Категория изменена" : "Категория создана";
  const action = initialData ? "Сохранить изменения" : "Создать категорию";

  const defaultValues = initialData
    ? {
        name: initialData.name,
      }
    : {
        name: "",
      };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true);

      const config = {
        withCredentials: true,
      };

      if (initialData) {
        await axios.patch(
          `http://localhost:8080/event/api/v1/categories/${initialData.id}`,
          data,
          config,
        );
      } else {
        await axios.post(
          `http://localhost:8080/event/api/v1/categories`,
          data,
          config,
        );
      }

      router.refresh();
      router.push(`/dashboard/categories`);
      toast.success(toastMessage);
    } catch (error: any) {
      toast.error(
        "Произошла ошибка: " +
          (error.response?.data?.message || "Что-то пошло не так"),
      );
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);

      const config = {
        withCredentials: true,
      };

      if (!initialData?.id) {
        throw new Error("ID категории отсутствует");
      }

      await axios.delete(
        `http://localhost:8080/event/api/v1/categories/${initialData.id}`,
        config,
      );

      router.refresh();
      router.push(`/dashboard/categories`);

      toast.success(`Категория удалена`);
    } catch (error) {
      toast.error("Не удалось удалить категорию");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />

      <div className="flex items-center justify-between mb-6">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Удалить
          </Button>
        )}
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {initialData ? "Информация о категории" : "Новая категория"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название категории</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Введите название категории"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="flex items-center gap-4">
                <Button disabled={loading} type="submit" className="min-w-32">
                  {loading ? "Сохранение..." : action}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/categories")}
                  disabled={loading}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};
