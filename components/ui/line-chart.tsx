"use client";

interface LineChartProps {
  data: Array<{
    [key: string]: any;
  }>;
  xKey: string;
  yKey: string;
  color: string;
}

export default function LineChart({ data, xKey, yKey, color }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => Number(d[yKey])));

  return (
    <div className="space-y-4">
      <div className="flex items-end space-x-2 h-48">
        {data.map((item, index) => {
          const value = Number(item[yKey]);
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex justify-center mb-2">
                <div
                  className="w-2 rounded-t transition-all duration-500 ease-out"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                />
              </div>
              <div className="text-xs text-center">
                <div className="font-medium">{item[xKey]}</div>
                <div className="text-muted-foreground">{value.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center text-sm text-muted-foreground">
        {data.length} data points • Max: {maxValue.toLocaleString()}
      </div>
    </div>
  );
}
