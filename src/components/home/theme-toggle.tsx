import { useTheme } from "next-themes";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Moon, MoonStar, Sun } from "lucide-react";

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  //setTheme(currentTheme === "dark" ? "light" : "dark")

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <Button
        variant={'outline'}
        onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}>
        {currentTheme === "light" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </Button>
    </div>
  );
}

export default ThemeToggle;
