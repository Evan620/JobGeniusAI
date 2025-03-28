import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Bell, User } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  activePath: string;
}

export function Header({ activePath }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Job Search", path: "/jobs" },
    { label: "Applications", path: "/applications" },
    { label: "AI Control", path: "/ai-control" },
    { label: "Analytics", path: "/analytics" },
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="font-heading font-bold text-2xl text-[#2D3E50]">
                  Job<span className="text-[#FFD700]">Genius</span> AI
                </a>
              </Link>
            </div>
            <nav className="hidden md:ml-6 md:flex space-x-8">
              {navItems.map((item) => (
                <Link href={item.path} key={item.path}>
                  <a 
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      activePath === item.path
                        ? "border-[#FFD700] text-[#2D3E50]"
                        : "border-transparent text-gray-500 hover:text-[#2D3E50] hover:border-gray-300"
                    )}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-6 w-6 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile">
                      <a className="w-full">Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <Button variant="ghost" size="icon" className="ml-3 p-1 rounded-full">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6 text-gray-400" />
              </Button>
            </div>
          </div>
          
          <div className="-mr-2 flex items-center md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400">
                  <span className="sr-only">Open main menu</span>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="pt-2 pb-3 space-y-1">
                  {navItems.map((item) => (
                    <Link href={item.path} key={item.path}>
                      <a 
                        className={cn(
                          "block pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                          activePath === item.path
                            ? "bg-indigo-50 border-[#FFD700] text-[#2D3E50]"
                            : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-[#2D3E50]"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
