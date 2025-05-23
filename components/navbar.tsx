import { MainNav } from "@/components/main-nav";
import DashboardSwitcher from "@/components/dashboard-switcher";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User } from "lucide-react";
import { ModeToggle } from "./theme-toggle";

const Navbar = () => {
  const dashboards = [
    { id: "1", name: "Первый" },
    { id: "2", name: "Второй" },
    { id: "3", name: "И еще один" },
  ];

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <DashboardSwitcher items={dashboards} />
        <MainNav className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <Avatar>
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
