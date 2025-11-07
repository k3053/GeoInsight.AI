import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const SolarCharts = ({ stats }) => {
  // stats is the DashboardCharts stats object: stats.totals contains solar
  const solar = stats?.totals?.solar || {};
  const hourlyData = solar.hourlyData || [];
  // Compute a simple yearly bar value from raw payload if present
  const raw = solar.raw || {};
  const panelsArr = raw.solarPanels || [];
  const totalYearlyKwh = panelsArr.length
    ? panelsArr.reduce((s, p) => s + (p.yearlyEnergyDcKwh || 0), 0)
    : solar.yearlyEnergyKwh || 0;

  return (
    <div className="w-full">
      <div className="w-full h-[300px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'bottom' }} />
            <YAxis label={{ value: 'Solar Radiation (kWh/m²)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value, name) => [value, name]} />
            <Area type="monotone" dataKey="radiation" stroke="#ffd700" fill="#ffd700" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm text-white">
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400">Estimated annual energy</div>
          <div className="text-lg font-medium">{totalYearlyKwh ? `${totalYearlyKwh.toFixed(0)} kWh` : 'N/A'}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400">Daily average (GHI)</div>
          <div className="text-lg font-medium">{solar.dailyAverage ? `${solar.dailyAverage} kWh/m²` : 'N/A'}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded">
          <div className="text-xs text-gray-400">Panel capacity</div>
          <div className="text-lg font-medium">{raw.panelCapacityWatts ? `${raw.panelCapacityWatts} W` : 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

export default SolarCharts;
// ...existing code...