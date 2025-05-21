"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import CellAction from "./cell-action";

export type EventColumn = {
  id: string;
  name: string;
  description: string;
  category: string;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export const columns: ColumnDef<EventColumn>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-medium">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: "Название",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "category",
    header: "Категория",
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Дата
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("date")}</div>,
  },
  {
    accessorKey: "time",
    header: "Время",
  },
  {
    accessorKey: "location",
    header: "Место",
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Цена
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
      }).format(price);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Создано",
    cell: ({ row }) => {
      const dateStr = row.getValue("created_at") as string;
      // Преобразуем строку ISO даты в более читаемый формат
      const date = new Date(dateStr);
      return <div>{date.toLocaleString("ru-RU")}</div>;
    },
  },
  {
    id: "actions",
    header: "Действия",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
