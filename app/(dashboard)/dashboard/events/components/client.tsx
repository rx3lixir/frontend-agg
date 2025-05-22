"use client";

import { Button } from "@/components/ui/button";
import { columns, EventColumn } from "./columns";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { Heading } from "@/components/heading";
import { ApiList } from "@/components/ui/api-list";

interface EventClientProps {
  data: EventColumn[];
}

export const EventClient: React.FC<EventClientProps> = ({ data }) => {
  const router = useRouter();
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Всего событий (${data.length})`}
          description="Управляйте событиями"
        />
        <Button onClick={() => router.push(`events/new`)}>
          <Plus className="h-4 w-4" />
          Добавить новое
        </Button>
      </div>
      <Separator />
      <DataTable columns={columns} data={data} />
      <Heading title="API" description="API запросы для событий на бэкенд" />
      <Separator />
      <ApiList entityName="events" entityIdName="{eventId}" />
    </>
  );
};
