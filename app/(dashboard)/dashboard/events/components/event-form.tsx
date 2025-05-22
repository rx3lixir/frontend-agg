"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Trash, CalendarIcon, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { AlertModal } from "@/components/modals/alert-modal";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { logger } from "@/lib/logger";

const formSchema = z.object({
  name: z.string().min(1, "Название события обязательно"),
  description: z
    .string()
    .min(10, "Описание должно содержать минимум 10 символов"),
  category_id: z.coerce.number().min(1, "Выберите категорию"),
  date: z.string().min(1, "Дата события обязательна"),
  time: z.string().min(1, "Время события обязательно"),
  location: z.string().min(1, "Место проведения обязательно"),
  price: z.coerce.number().min(0, "Цена должна быть больше или равна 0"),
  image: z.string().url("Введите корректный URL изображения"),
  source: z.string().url("Введите корректный URL источника").optional(),
});

type EventFormValues = z.infer<typeof formSchema>;

// Тип для категорий, получаемых с бэкенда
interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface EventFormProps {
  initialData?: {
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
  } | null;
}

export const EventForm: React.FC<EventFormProps> = ({ initialData }) => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const title = initialData ? "Редактировать событие" : "Создать событие";
  const description = initialData
    ? "Изменить информацию о событии"
    : "Добавить новое событие";
  const toastMessage = initialData ? "Событие изменено" : "Событие создано";
  const action = initialData ? "Сохранить" : "Создать";

  // Функция для загрузки категорий с бэкенда
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get<Category[]>(
        "http://localhost:8080/event/api/v1/categories",
      );
      setCategories(response.data);
    } catch (error) {
      toast.error("Не удалось загрузить категории");
      console.error("Ошибка при загрузке категорий:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    fetchCategories();
  }, []);

  const defaultValues = initialData
    ? {
        ...initialData,
        price: initialData.price,
        category_id: initialData.category_id,
      }
    : {
        name: "",
        description: "",
        category_id: 1,
        date: "",
        time: "",
        location: "",
        price: 0,
        image: "",
        source: "",
      };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      setLoading(true);

      // Создаем конфигурацию для axios с заголовком авторизации
      const config = {
        withCredentials: true,
      };

      if (initialData) {
        await axios.patch(
          `http://localhost:8080/event/api/v1/events/${initialData.id}`,
          data,
          config,
        );
      } else {
        await axios.post(
          `http://localhost:8080/event/api/v1/events`,
          data,
          config,
        );
      }

      router.refresh();
      router.push(`/dashboard/events`);
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

      // Создаем конфигурацию для axios с заголовком авторизации
      const config = {
        withCredentials: true,
      };

      if (!initialData?.id) {
        throw new Error("ID события отсутствует");
      }

      await axios.delete(
        `http://localhost:8080/event/api/v1/events/${initialData.id}`,
        config,
      );

      router.refresh();
      router.push(`/dashboard/events`);

      toast.success(`Cобытие удалено`);
    } catch (error) {
      toast.error("Не удалось удалить событие");
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
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 w-full"
        >
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Изображение</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="URL изображения"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Загрузите изображение события</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Название события"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select
                    disabled={loading || categoriesLoading}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categoriesLoading
                              ? "Загрузка категорий..."
                              : "Выберите категорию"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={loading}
                    placeholder="Описание события"
                    {...field}
                    className="resize-none h-32"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-8">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Дата</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP", { locale: ru })
                          ) : (
                            <span>Выберите дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={(date) => date < new Date()}
                        locale={ru}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Время</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        disabled={loading}
                        placeholder="19:00"
                        {...field}
                        type="time"
                      />
                      <Clock className="ml-2 h-4 w-4 opacity-50" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={loading}
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-8 justify-center">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Место проведения</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Адрес или название места"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Источник (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="https://example.com/event"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            {action}
          </Button>
        </form>
      </Form>
      <Separator />
    </>
  );
};
