"use client";
import CardWrapper from "./card-wrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RegisterSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Импортируем sonner

// Улучшенный интерфейс для ответа от API
interface ApiResponse {
  success: boolean;
  message?: string;
  userId?: string;
  error?: string;
  errors?: Record<string, string[]>; // Для валидационных ошибок с сервера
}

const RegisterForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerUser = async (data: z.infer<typeof RegisterSchema>) => {
    const response = await fetch("http://localhost:8080/user/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        password: data.password,
      }),
    });

    const result: ApiResponse = await response.json();

    if (!response.ok) {
      // Обработка валидационных ошибок с сервера
      if (result.errors) {
        const errorMessages = Object.entries(result.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        throw new Error(errorMessages);
      }
      throw new Error(result.error || "Ошибка при регистрации");
    }

    return result;
  };

  const onSubmit = async (data: z.infer<typeof RegisterSchema>) => {
    try {
      setLoading(true);

      // Показываем уведомление о начале процесса
      toast.info("Регистрация...");

      const result = await registerUser(data);

      // Успешная регистрация
      toast.success("Регистрация прошла успешно! Теперь вы можете войти.");
      console.log("Пользователь успешно зарегистрирован:", result);

      // Перенаправляем с задержкой для лучшего UX
      setTimeout(() => {
        router.push("/auth/login?registered=true");
      }, 800);
    } catch (error) {
      console.error("Ошибка при регистрации:", error);

      // Показываем ошибку пользователю
      if (error instanceof Error) {
        toast.error(error.message || "Произошла ошибка при регистрации");
      } else {
        toast.error("Произошла неизвестная ошибка при регистрации");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardWrapper
      label="Зарегистрируйте аккаунт"
      title="Регистрация"
      backButtonHref="/auth/login"
      backButtonLabel="У вас уже есть аккаунт? Войдите."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Электропочта</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="ого@почта.ру"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Иван Кошечкин"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Придумайте пароль</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="******"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Повторите пароль</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="******"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Загрузка..." : "Регистрация"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default RegisterForm;
