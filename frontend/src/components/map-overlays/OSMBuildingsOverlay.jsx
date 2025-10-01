import React, { useEffect, useRef } from "react";

// Make sure OSMBuildings is loaded globally (via CDN or npm)
export default function OSMBuildingsOverlay({ position, zoom = 16 }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!position) return;

    // Clean up previous instance
    if (mapRef.current && mapRef.current.osmb) {
      mapRef.current.osmb.destroy();
      mapRef.current.osmb = null;
    }

    // Create container div if not present
    let container = document.getElementById("osmb-map");
    if (!container) {
      container = document.createElement("div");
      container.id = "osmb-map";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.position = "absolute";
      container.style.top = 0;
      container.style.left = 0;
      document.body.appendChild(container);
    }

    // Initialize OSMBuildings
    const osmb = new window.OSMBuildings({
      container: container,
      position: { latitude: position[0], longitude: position[1] },
      zoom: zoom,
      minZoom: 15,
      maxZoom: 20,
      tilt: 40,
      rotation: 300,
      effects: ["shadows"],
      attribution:
        '© Data <a href="https://openstreetmap.org/copyright/">OpenStreetMap</a> © Map <a href="https://mapbox.com/">Mapbox</a> © 3D <a href="https://osmbuildings.org/copyright/">OSM Buildings</a>',
    });

    osmb.addMapTiles(
      "https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png"
    );
    osmb.addGeoJSONTiles(
      "https://{s}.data.osmbuildings.org/0.2/59fcc2e8/tile/{z}/{x}/{y}.json"
    );

    // Animate rotation
    let rotation = 0;
    function rotate() {
      osmb.setRotation(rotation);
      rotation = (rotation + 1) % 360;
      requestAnimationFrame(rotate);
    }
    rotate();

    // Store instance for cleanup
    mapRef.current = { osmb };

    return () => {
      if (mapRef.current && mapRef.current.osmb) {
        mapRef.current.osmb.destroy();
        mapRef.current.osmb = null;
      }
      // Optionally remove container
      // container.remove();
    };
  }, [position, zoom]);

  return null; // No React DOM output, map is rendered in container
}