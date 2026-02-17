import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardMetric } from "@/types";
import { ArrowDown, ArrowUp } from "lucide-react";

export function MetricCard({ title, value, trend, trendDirection, description, icon: Icon, color }: DashboardMetric) {
  const accent = color || "hsl(var(--primary))";

  return (
    <Card
      className="surface-card border-l-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        borderLeftColor: accent,
        boxShadow: `0 18px 35px -28px ${accent}`,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className="rounded-xl p-2" style={{ backgroundColor: `${accent}20` }}>
            <Icon className="h-4 w-4" style={{ color: accent }} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {description && <p className="pt-1 text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
            {trendDirection === "negative" ? (
              <ArrowDown className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className={trendDirection === "negative" ? "text-destructive" : "text-emerald-600"}>{trend}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
