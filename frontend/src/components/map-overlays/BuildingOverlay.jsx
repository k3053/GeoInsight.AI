import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function BuildingOverlay({ selectedPos }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.OSMBuildings) return;

    const osmb = new window.OSMBuildings({
      baseURL: "https://cdn.osmbuildings.org/OSMBuildings",
      minZoom: 15,
      maxZoom: 22,
      attribution: '© OSM Buildings, © OpenStreetMap contributors'
    });

    osmb.addTo(map);

    if (selectedPos) {
      map.setView(selectedPos, 16);
    }

    return () => osmb.remove();
  }, [map, selectedPos]);

  return null;
}
