"use client";

import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertModal } from "@/components/modals/alert-modal";
import { CategoryColumn } from "./columns";

interface CategoryActionProps {
  data: CategoryColumn;
}

const CellAction: React.FC<CategoryActionProps> = ({ data }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success("Название категории скопировано");
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(
        `http://localhost:8080/event/api/v1/categories/${data.id}`,
        {
          withCredentials: true,
        },
      );

      router.refresh();
      toast.success("Событие удалено");
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Открыть меню</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Действия</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/categories/${data.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCopy(data.name)}>
            <Copy className="h-4 w-4" />
            Копировать название
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="h-4 w-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default CellAction;
