const SolarLegend = ({ solar }) => {
  // solar may be the transformed object or raw google response under solar.raw
  const raw = solar?.raw || solar || {};
  const potential = raw.solarPotential || {};

  // panels: prefer explicit solarPanels array, fallback to solarPanelConfigs/panel counts
  const panelsArr = raw.solarPanels || [];
  const panelConfigs = potential.solarPanelConfigs || [];
  const panelCountFromConfigs = panelConfigs.reduce((s, c) => s + (c.panelsCount || 0), 0);
  const panelCount = panelsArr.length > 0 ? panelsArr.length : panelCountFromConfigs || 0;

  const panelCapacityWatts = raw.panelCapacityWatts || potential.panelCapacityWatts || 0;
  const systemKw = panelCount && panelCapacityWatts ? ((panelCapacityWatts * panelCount) / 1000) : null;

  // total yearly energy: prefer summing solarPanels.yearlyEnergyDcKwh, fallback to configs
  const totalYearlyKwh = panelsArr.length
    ? panelsArr.reduce((s, p) => s + (p.yearlyEnergyDcKwh || 0), 0)
    : (panelConfigs.length
        ? panelConfigs.reduce((s, c) => s + ((c.yearlyEnergyDcKwh || 0) * (c.panelsCount || 1)), 0)
        : (solar?.yearlyEnergyKwh || 0));

  // financial info (try to extract from financialAnalyses)
  const finAnalyses = potential.financialAnalyses || raw.financialAnalyses || [];
  const fin = finAnalyses.find(a => a.financialDetails) || finAnalyses.find(a => a.cashPurchaseSavings) || {};
  const finDetails = fin.financialDetails || {};
  const cashSavings = fin.cashPurchaseSavings || {};

  const initialAcKwhPerYear = parseFloat(finDetails.initialAcKwhPerYear || 0);
  const costOfElectricityWithoutSolar = parseFloat((finDetails.costOfElectricityWithoutSolar && finDetails.costOfElectricityWithoutSolar.units) || 0);

  // Derive electricity rate per kWh if possible
  const electricityRatePerKwh = (initialAcKwhPerYear && costOfElectricityWithoutSolar)
    ? costOfElectricityWithoutSolar / initialAcKwhPerYear
    : null;

  // Use solarPercentage if available to estimate how much of consumption is offset
  const solarPercentage = parseFloat(finDetails.solarPercentage || 0);

  const estimatedAnnualSavings = electricityRatePerKwh
    ? (totalYearlyKwh || (initialAcKwhPerYear * (solarPercentage / 100))) * electricityRatePerKwh
    : null;

  const paybackYears = cashSavings.paybackYears || fin.financialDetails?.paybackYears || null;

  return (
    <div className="mb-4 p-4 bg-gray-800 rounded text-sm">
      <h3 className="font-semibold mb-2">Solar Insights</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Panel count</p>
          <div className="text-lg font-medium">{panelCount || 'N/A'}</div>
        </div>

        <div>
          <p className="text-xs text-gray-400">System size</p>
          <div className="text-lg font-medium">{systemKw ? `${systemKw.toFixed(2)} kW` : 'N/A'}</div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Estimated annual energy</p>
          <div className="text-lg font-medium">{totalYearlyKwh ? `${totalYearlyKwh.toFixed(0)} kWh/yr` : 'N/A'}</div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Daily average (chart)</p>
          <div className="text-lg font-medium">{solar?.dailyAverage ? `${solar.dailyAverage} kWh/m²` : 'N/A'}</div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Estimated annual savings</p>
          <div className="text-lg font-medium">
            {estimatedAnnualSavings ? `${estimatedAnnualSavings.toFixed(2)} ${finDetails.costOfElectricityWithoutSolar?.currencyCode || ''}` : 'N/A'}
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-400">Payback (years)</p>
          <div className="text-lg font-medium">{paybackYears ?? 'N/A'}</div>
        </div>
      </div>

      {finDetails && Object.keys(finDetails).length > 0 && (
        <div className="mt-3 text-xs text-gray-400">
          <strong>Note:</strong> Estimates use financial data from the building analysis when available (initial consumption, electricity cost, incentives).
        </div>
      )}
    </div>
  );
};

export default SolarLegend;