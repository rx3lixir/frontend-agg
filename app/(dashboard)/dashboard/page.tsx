"use client";
import { BookUser, Bot, Ticket } from "lucide-react";
import { Heading } from "@/components/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Overview } from "@/components/overview";

// Функция для генерации случайных данных
const generateRandomData = () => {
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return labels.map((label) => ({
    name: label,
    total: Math.floor(Math.random() * 7) + 1, // от 1 до 100
  }));
};

const DashboardPage = () => {
  const overviewData = generateRandomData();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading title="Дашборд" description="Обзор и статистика" />
        <Separator />
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Всего событий
              </CardTitle>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{102}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Опубликованно после скраппнга
              </CardTitle>
              <Bot className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{17}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Пользователей зарегистрированно
              </CardTitle>
              <BookUser className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{24}</div>
            </CardContent>
          </Card>
        </div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Обзор</CardTitle>
            <CardContent className="pl-2">
              <Overview data={overviewData} />
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
