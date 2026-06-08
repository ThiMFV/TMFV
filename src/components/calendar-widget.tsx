"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function CalendarWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [month, setMonth] = React.useState(() => new Date());
  const selectedDay = params.get("day");
  const selected = selectedDay ? new Date(selectedDay) : null;
  const today = new Date();

  const startMonth = startOfMonth(month);
  const endMonth = endOfMonth(month);
  const start = startOfWeek(startMonth, { weekStartsOn: 0 });
  const end = endOfWeek(endMonth, { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const weekDays = ["Do", "Se", "Te", "Qu", "Qu", "Se", "Sa"];

  const choose = (day: Date) => {
    const usp = new URLSearchParams(params.toString());
    usp.set("day", format(day, "yyyy-MM-dd"));
    router.push(`${pathname}?${usp.toString()}`);
  };

  return (
    <div className="rounded-md border bg-card">
      <header className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
        Calendário
      </header>
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="rounded p-1 hover:bg-muted"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold capitalize">
            {format(month, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded p-1 hover:bg-muted"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
          {weekDays.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const isSelected = selected && isSameDay(day, selected);
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(day)}
                className={cn(
                  "aspect-square rounded text-[11px] transition-colors",
                  inMonth ? "text-foreground" : "text-muted-foreground/40",
                  isToday && !isSelected && "bg-muted font-semibold",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <button
            type="button"
            onClick={() => {
              const usp = new URLSearchParams(params.toString());
              usp.delete("day");
              router.push(`${pathname}?${usp.toString()}`);
            }}
            className="w-full rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
          >
            Limpar filtro de data
          </button>
        )}
      </div>
    </div>
  );
}
