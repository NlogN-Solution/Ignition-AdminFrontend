import { Link } from "react-router";
import { motion } from "motion/react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  trend?: number;
  sparkline?: number[];
  format?: (value: number) => string;
  accent?: "primary" | "success" | "warning" | "info" | "danger";
}

const ACCENT_ICON_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  success: "bg-success/10 text-success ring-success/15",
  warning: "bg-warning/10 text-warning ring-warning/15",
  info: "bg-info/10 text-info ring-info/15",
  danger: "bg-danger/10 text-danger ring-danger/15",
};

const ACCENT_GLOW_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
};

const ACCENT_BORDER_HOVER: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "hover:border-primary/30",
  success: "hover:border-success/30",
  warning: "hover:border-warning/30",
  info: "hover:border-info/30",
  danger: "hover:border-danger/30",
};

const STROKE_COLORS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  danger: "var(--danger)",
};

export function StatCard({ label, value, icon: Icon, href, trend, sparkline, format, accent = "primary" }: StatCardProps) {
  const animated = useCountUp(value);
  const displayValue = format ? format(animated) : formatNumber(Math.round(animated));
  const gradientId = `spark-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

  const content = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-4.5 shadow-sm transition-[box-shadow,border-color] duration-200 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]",
        ACCENT_BORDER_HOVER[accent],
      )}
    >
      {/* soft accent glow, top-right */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.22]",
          ACCENT_GLOW_CLASSES[accent],
        )}
      />
      {/* giant faint watermark icon */}
      <Icon
        aria-hidden
        strokeWidth={1.5}
        className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 text-foreground opacity-[0.03] transition-transform duration-300 group-hover:scale-110 group-hover:opacity-[0.05]"
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", ACCENT_ICON_CLASSES[accent])}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.1} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              trend >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3.5">
        <p className="text-[26px] font-semibold leading-none tracking-tight text-foreground">{displayValue}</p>
        <div className="mt-1.5 flex items-center gap-1 text-[13px] text-muted-foreground">
          <span className="truncate">{label}</span>
          {href && (
            <ArrowRight className="h-3 w-3 shrink-0 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
          )}
        </div>
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="relative z-10 -mx-1 mt-2.5 h-9 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 1, bottom: 0, left: 1 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={STROKE_COLORS[accent]} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={STROKE_COLORS[accent]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={STROKE_COLORS[accent]}
                strokeWidth={1.75}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
