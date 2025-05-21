"use client";

import { useDashboardModal } from "@/hooks/use-dashboard-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronsUpDown,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./ui/command";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

type Dashboard = {
  id: string;
  name: string;
};

interface DashboardSwitcherProps extends PopoverTriggerProps {
  items: Dashboard[];
}

const DashboardSwitcher = ({
  className,
  items = [],
}: DashboardSwitcherProps) => {
  const dashboardModal = useDashboardModal();

  const formattedItems = items.map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const currentDashboard = formattedItems.find((item) => item.value === "1");

  const [open, setOpen] = useState(false);

  const onDashboardSelect = (dashboard: { value: string; label: string }) => {
    setOpen(false);
    // тут можно что-то делать при выборе
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label="Выбор дашборда"
          className={cn("w-[200px] justify-between", className)}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Дашборд
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Найти дашборд..." />
            <CommandEmpty>Ничего не найдено :(</CommandEmpty>
            <CommandGroup heading="Дашборды">
              {formattedItems.map((dashboard) => (
                <CommandItem
                  key={dashboard.value}
                  onSelect={() => onDashboardSelect(dashboard)}
                  className="text-sm"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  {dashboard.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentDashboard?.value === dashboard.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  dashboardModal.onOpen();
                }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Создать дашборд
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DashboardSwitcher;
