"use client";

interface BarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export default function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className="w-20 text-sm font-medium truncate">{item.name}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
              <div className="text-sm font-medium w-16 text-right">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(item.value)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
