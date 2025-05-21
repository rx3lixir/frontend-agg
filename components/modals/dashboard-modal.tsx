"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";

import { useDashboardModal } from "@/hooks/use-dashboard-modal";
import { Modal } from "@/components/ui/modal";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const formScmema = z.object({
  name: z.string().min(1, {
    message: "Было бы здорово чтобы название все-таки было..",
  }),
});

export const DashBoardModal = () => {
  const dashboardModal = useDashboardModal();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formScmema>>({
    resolver: zodResolver(formScmema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formScmema>) => {
    try {
      setLoading(true);
      toast.success("Дашборд создан");
    } catch (error) {
      toast.error("Что-то пошло не так :(");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Создайте дашборд"
      description="Создайте дашборд для управления скраппингом и событиями на сайте"
      isOpen={dashboardModal.isOpen}
      onClose={dashboardModal.onClose}
    >
      <div>
        <div className="space-y-4 py-4 pb-4"></div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="Ну например... События: неделя 2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
            <div className="pt-6 space-x-2 flex items-center justify-end w-full">
              <Button
                disabled={loading}
                variant="outline"
                onClick={dashboardModal.onClose}
              >
                Отмена
              </Button>
              <Button disabled={loading} type="submit">
                Подтвердить
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
};
