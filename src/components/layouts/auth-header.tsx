import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../home/theme-toggle";

const AuthHeader = () => {
  const router = useRouter();
  return (
    <header className="bg-background w-full">
      <nav className="max-w-7xl mx-auto flex items-center justify-between py-4">
        <Button onClick={() => router.back()} variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <ThemeToggle />
      </nav>
    </header>
  );
};

export default AuthHeader;
