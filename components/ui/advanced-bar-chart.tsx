"use client";

interface AdvancedBarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function AdvancedBarChart({ data }: AdvancedBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.name}</span>
            <span className="text-sm text-muted-foreground">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(item.value)}
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700 ease-out relative"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  backgroundColor: item.color
                }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : 0}% of maximum
            </div>
          </div>
        </div>
      ))}

      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">
              {data.length}
            </div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(data.reduce((sum, item) => sum + item.value, 0))}
            </div>
            <div className="text-xs text-muted-foreground">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
