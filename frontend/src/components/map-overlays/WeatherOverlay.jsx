import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";

export default function WeatherOverlay({ selectedPos, weatherData }) {
  console.log("In weather overlay==>", weatherData);
  // Using the new weather API structure: check for temp field.
  if (!weatherData) return null;

  function getTempColor(temp) {
    console.log("temp is: ", temp);
    if (temp >= 0 && temp <= 10) return "#bde1fdff"; // blue
    if (temp > 10 && temp <= 20) return "#64b5f6"; // light blue
    if (temp > 20 && temp <= 30) return "#fcff3bff"; // yellow
    if (temp > 30 && temp <= 40) return "#ff7b00ff"; // orange
    if (temp > 40) return "#fc2617ff"; // red
  }
  
  const temp = weatherData?.weather?.temp;
  const color = getTempColor(temp);

  return (
    <>
      <Circle
        center={selectedPos}
        radius={1000}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 2,
        }}
      />
      <Marker position={selectedPos}>
        <Popup>
          <div className="min-w-[180px]">
            <div className="font-semibold text-lg">{Math.round(temp)}°C</div>
            <div className="text-sm">
              Feels Like: {Math.round(weatherData.feels_like)}°C <br />
              Humidity: {weatherData.humidity}% <br />
              Wind: {Math.round(weatherData.wind_speed)} m/s <br />
              Cloudiness: {weatherData.cloud_pct}%
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}