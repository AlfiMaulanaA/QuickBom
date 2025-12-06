"use client";

import { type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, RefreshCw, Settings, Maximize2, Minimize2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onSettings?: () => void;
  onExpand?: () => void;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  }>;
}

export function DashboardWidget({
  title,
  description,
  icon,
  children,
  className = "",
  loading = false,
  error,
  onRefresh,
  onSettings,
  onExpand,
  badge,
  actions = []
}: DashboardWidgetProps) {
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {badge && (
                  <Badge variant={badge.variant || 'secondary'} className="text-xs">
                    {badge.text}
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <CardDescription className="text-sm mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {(onSettings || onExpand || actions.length > 0) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onSettings && (
                    <DropdownMenuItem onClick={onSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  {onExpand && (
                    <DropdownMenuItem onClick={onExpand}>
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Expand
                    </DropdownMenuItem>
                  )}
                  {actions.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={action.onClick}>
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {error ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <div className="text-red-500 text-sm mb-2">⚠️ {error}</div>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// Specialized KPI Widget
interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    label: string;
  };
  icon?: ReactNode;
  color?: string;
  description?: string;
}

export function KPIWidget({ title, value, change, icon, color = "text-foreground", description }: KPIWidgetProps) {
  const getChangeIcon = () => {
    if (!change) return null;
    switch (change.type) {
      case 'increase':
        return <span className="text-green-500">↗</span>;
      case 'decrease':
        return <span className="text-red-500">↘</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  const getChangeColor = () => {
    if (!change) return '';
    switch (change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={`text-3xl font-bold mt-2 ${color}`}>
              {value}
            </div>
            {change && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor()}`}>
                {getChangeIcon()}
                <span>{Math.abs(change.value)}% {change.label}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground ml-4">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Metric Grid Widget
interface MetricGridProps {
  metrics: Array<{
    label: string;
    value: string | number;
    icon?: ReactNode;
    color?: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
  columns?: number;
}

export function MetricGrid({ metrics, columns = 2 }: MetricGridProps) {
  return (
    <div className={`grid gap-4 grid-cols-1 md:grid-cols-${columns}`}>
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            {metric.icon && <div className="text-muted-foreground">{metric.icon}</div>}
            <div>
              <p className="text-sm font-medium">{metric.label}</p>
              <p className={`text-lg font-bold ${metric.color || 'text-foreground'}`}>
                {metric.value}
              </p>
            </div>
          </div>
          {metric.trend && (
            <div className="text-right">
              {metric.trend === 'up' && <span className="text-green-500 text-sm">↑</span>}
              {metric.trend === 'down' && <span className="text-red-500 text-sm">↓</span>}
              {metric.trend === 'stable' && <span className="text-gray-500 text-sm">→</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
