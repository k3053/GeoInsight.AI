import React from "react";
import { Circle, Marker, Popup } from "react-leaflet";

export default function WeatherOverlay({ selectedPos, weatherData }) {
  // Ensure weatherData exists and has required fields
  if (!weatherData || !weatherData.weather || !weatherData.main) return null;

  // Color by temperature (blue=cold, orange=warm, red=hot)
  function getTempColor(temp) {
    if (temp <= 10) return "#2196f3"; // blue
    if (temp <= 25) return "#ff9800"; // orange
    return "#e53935"; // red
  }
  const temp = weatherData.main.temp;
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
            <div className="flex items-center gap-2 mb-2">
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                alt={weatherData.weather[0].description}
                className="w-10 h-10"
              />
              <div>
                <div className="font-semibold text-lg">{Math.round(temp)}°C</div>
                <div className="capitalize text-gray-700">{weatherData.weather[0].description}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <div>Humidity: {weatherData.main.humidity}%</div>
              <div>Wind: {Math.round(weatherData.wind.speed)} m/s</div>
              <div>Location: {weatherData.name}</div>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
}