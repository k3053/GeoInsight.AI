// src/components/AnalyticsSidebar.js
import { ChartBarIcon, ChartPieIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

// To use Heroicons, you'll need to install it:
// npm install @heroicons/react

export default function AnalyticsSidebar() {
  return (
    <aside className="w-1/3 max-w-sm bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Chart Placeholder 1: Line Chart */}
      <div className="border border-gray-200 rounded-lg p-3">
        <h3 className="font-semibold text-sm mb-2">Trend Analysis</h3>
        <div className="bg-gray-50 h-24 flex items-center justify-center">
            <PresentationChartLineIcon className="h-10 w-10 text-gray-400" />
        </div>
      </div>
      
      {/* Chart Placeholder 2: Pie Chart */}
      <div className="border border-gray-200 rounded-lg p-3">
        <h3 className="font-semibold text-sm mb-2">Data Distribution</h3>
        <div className="bg-gray-50 h-32 flex items-center justify-center">
             <ChartPieIcon className="h-16 w-16 text-gray-400" />
        </div>
      </div>

      {/* Chart Placeholder 3: Bar Chart */}
      <div className="border border-gray-200 rounded-lg p-3">
        <h3 className="font-semibold text-sm mb-2">Metric Comparison</h3>
        <div className="bg-gray-50 h-28 flex items-center justify-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400" />
        </div>
      </div>
      
       {/* Chart Placeholder 4: Key Stats */}
       <div className="border border-gray-200 rounded-lg p-3">
        <h3 className="font-semibold text-sm mb-2">Summary</h3>
        <div className="bg-gray-50 h-20 p-2 text-xs text-gray-600">
          <p>• Stat 1: Value</p>
          <p>• Stat 2: Value</p>
          <p>• Stat 3: Value</p>
        </div>
      </div>
    </aside>
  );
}