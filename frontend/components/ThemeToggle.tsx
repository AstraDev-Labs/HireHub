"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
    iconOnly?: boolean;
}

export function ThemeToggle({ iconOnly = false }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme()

    if (iconOnly) {
        return (
            <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                    <Moon className="h-5 w-5 text-blue-400" />
                )}
            </button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-full justify-start gap-3 px-3 py-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition h-auto"
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400 shrink-0" />
            ) : (
                <Moon className="h-5 w-5 text-blue-400 shrink-0" />
            )}
            <span className="text-sm font-medium whitespace-nowrap">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
    )
}
