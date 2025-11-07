import { Circle, Popup } from 'react-leaflet';

const SolarOverlay = ({ selectedPos, solarData }) => {
  if (!solarData || !selectedPos) return null;

  const raw = solarData.raw || {};
  const panels = raw.solarPanels || [];
  const roofSegments = raw.solarPotential?.roofSegmentStats || [];

  // If solarPanels are available render per-panel circles sized by yearly energy
  if (panels.length > 0) {
    return (
      <>
        {panels.map((p, idx) => {
          const lat = p.center?.latitude;
          const lon = p.center?.longitude;
          const yearly = p.yearlyEnergyDcKwh || 0;
          const radius = Math.max(6, Math.min(200, yearly / 2)); // scale for display
          const color = '#ffd700';
          return (
            <Circle
              key={`panel-${idx}`}
              center={[lat, lon]}
              radius={radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.45, weight: 1 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Panel #{idx + 1}</strong><br />
                  Yearly energy: {yearly ? `${yearly.toFixed(1)} kWh` : 'N/A'}<br />
                  Orientation: {p.orientation || 'N/A'}<br />
                  Segment: {p.segmentIndex ?? 'N/A'}
                </div>
              </Popup>
            </Circle>
          );
        })}
        {/* Optionally draw roof segment centers */}
        {roofSegments.map((seg, i) => {
          if (!seg.center) return null;
          return (
            <Circle
              key={`seg-${i}`}
              center={[seg.center.latitude, seg.center.longitude]}
              radius={40}
              pathOptions={{ color: '#ffa500', fillColor: '#ffa500', fillOpacity: 0.25, weight: 1 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Roof segment</strong><br />
                  Pitch: {seg.pitchDegrees?.toFixed?.(1) ?? 'N/A'}°<br />
                  Azimuth: {seg.azimuthDegrees?.toFixed?.(1) ?? 'N/A'}°<br />
                  Area: {seg.stats?.areaMeters2 ? `${seg.stats.areaMeters2.toFixed(1)} m²` : 'N/A'}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </>
    );
  }

  // Fallback: single circle at selectedPos using solar.dailyAverage
  const fallbackRadius = Math.min(1000, (solarData.dailyAverage || 1) * 200);
  return (
    <Circle
      center={selectedPos}
      radius={fallbackRadius}
      pathOptions={{
        color: '#ffd700',
        fillColor: '#ffd700',
        fillOpacity: 0.2,
        weight: 1
      }}
    >
      <Popup>
        <div className="text-sm">
          <strong>Solar</strong><br />
          Daily average GHI: {solarData.dailyAverage ?? 'N/A'} kWh/m²<br />
        </div>
      </Popup>
    </Circle>
  );
};

export default SolarOverlay;