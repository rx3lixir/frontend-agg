"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import CardWrapper from "./card-wrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LoginSchema } from "@/schema";
import { useAuth } from "@/context/AuthContext";

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
    try {
      setLoading(true);
      const { success, error } = await login(data.email, data.password);

      if (success) {
        toast.success("Вы вошли в систему");
        setTimeout(() => router.push("/"), 1000);
      } else if (error) {
        toast.error(error || "Ошибка входа");
      }
    } catch (error) {
      console.error("Ошибка входа:", error);
      toast.error("Произошла непредвиденная ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardWrapper
      label="Войдите в аккаунт"
      title="Вход 🚪"
      backButtonHref="/auth/register"
      backButtonLabel="Нет аккаунта? Зарегистрируйте."
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
                      placeholder="ого@мояпочта.ру"
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
                  <FormLabel>Пароль</FormLabel>
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
            {loading ? "Загрузка..." : "Вход"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default LoginForm;
