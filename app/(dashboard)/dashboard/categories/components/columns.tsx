"use client";

import { ColumnDef } from "@tanstack/react-table";
import CellAction from "./cell-action";

// Тип для категорий, которые будут добавлены
export type CategoryColumn = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export const columns: ColumnDef<CategoryColumn>[] = [
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
