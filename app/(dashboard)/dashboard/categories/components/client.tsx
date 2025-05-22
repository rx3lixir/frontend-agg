"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { Heading } from "@/components/heading";
import { ApiList } from "@/components/ui/api-list";
import { columns, CategoryColumn } from "./columns";

interface CategoryClientProps {
  data: CategoryColumn[];
}

export const CategoryClient: React.FC<CategoryClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Категории (${data.length})`}
          description="Управляйте категориями событий"
        />
        <Button onClick={() => router.push(`/dashboard/categories/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить категорию
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} />
      <Heading title="API" description="API запросы для категорий" />
      <Separator />
      <ApiList entityName="categories" entityIdName="{categoryId}" />
    </>
  );
};
