const VITE_API_WEATHER_KEY = import.meta.env.VITE_API_WEATHER_KEY;
const VITE_AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN;
const VITE_API_WEATHER_FORECAST = import.meta.env.VITE_API_WEATHER_FORECAST;
const VITE_OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const VITE_SOLAR_API_KEY = import.meta.env.VITE_SOLAR_API_KEY;

export const fetchNearbyPlaces = async (lat, lon, radius = 5000) => {
    try {
        const query = `
        [out:json];
        (
            node["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
            way["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
            relation["amenity"~"restaurant|school|college|university|park"](around:${radius},${lat},${lon});
        );
        out center;
        `;

        const resp = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: { "Content-Type": "text/plain" }, // Overpass accepts plain text queries
            body: query,
        });

        const contentType = resp.headers.get("content-type") || "";

        if (!resp.ok) {
            // try to read text for debugging (HTML error page, rate limit message, etc.)
            const errText = await resp.text().catch(() => "<no body>");
            console.error(`Overpass API returned ${resp.status}:`, errText.slice(0, 1000));
            return null;
        }

        if (!contentType.includes("application/json")) {
            // Non-JSON (HTML/XML) — likely an error or CORS proxy page
            const txt = await resp.text().catch(() => "");
            console.error("Overpass returned non-JSON response (first 1000 chars):", txt.slice(0, 1000));
            return null;
        }

        const data = await resp.json();
        if (data && data.elements) {
           return data.elements;
        }
        return [];
    } catch (error) {
        console.error("Failed to fetch nearby places:", error);
        return null;
    }
};

export const fetchFilterData = async (filter, position) => {
  const [lat, lng] = position;
  let data = null;
  console.log("Selected Filter------>>>>>", filter);

  switch (filter) {
    // case "Solar": {
    //     const lat = position[0];
    //     const lon = position[1];
        
    //     try {
    //         // Call Google Solar API to get building insights
    //         const solarResponse = await fetch(
    //             `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&requiredQuality=HIGH&key=${VITE_SOLAR_API_KEY}`,
    //             {
    //                 method: 'GET',
    //                 headers: {
    //                     'Content-Type': 'application/json'
    //                 }
    //             }
    //         );

    //         if (!solarResponse.ok) {
    //             const errText = await solarResponse.text().catch(() => "");
    //             console.error(`Solar API returned ${solarResponse.status}:`, errText);
    //             return null;
    //         }

    //         const solarData = await solarResponse.json();
    //         console.log("Solar data from Google API:", solarData);

    //         // Extract key metrics from solarPotential
    //         const potential = solarData.solarPotential || {};
    //         const wholeRoof = potential.wholeRoofStats || {};
            
    //         // Calculate metrics
    //         const maxPanels = potential.maxArrayPanelsCount || 0;
    //         const maxArea = potential.maxArrayAreaMeters2 || 0;
    //         const sunshineHours = potential.maxSunshineHoursPerYear || 0;
    //         const carbonOffset = potential.carbonOffsetFactorKgPerMwh || 0;
    //         const sunshineQuantiles = wholeRoof.sunshineQuantiles || [];
            
    //         data = {
    //             solar: {
    //                 maxPanels,
    //                 maxAreaM2: parseFloat(maxArea.toFixed(2)),
    //                 sunshineHoursPerYear: sunshineHours,
    //                 carbonOffsetKgPerMwh: parseFloat(carbonOffset.toFixed(2)),
    //                 roofAreaM2: parseFloat((wholeRoof.areaMeters2 || 0).toFixed(2)),
    //                 groundAreaM2: parseFloat((wholeRoof.groundAreaMeters2 || 0).toFixed(2)),
    //                 sunshineQuantiles: sunshineQuantiles,
    //                 imageryDate: solarData.imageryDate || {},
    //                 imageryQuality: solarData.imageryQuality || "UNKNOWN",
    //                 center: solarData.center || { latitude: lat, longitude: lon },
    //                 raw: solarData
    //             }
    //         };
    //     } catch (error) {
    //         console.error("Solar API fetch error:", error);
    //         return null;
    //     }
    //     break;
    // }
    case "Weather Forecast": {
        const lat = position[0];
        const lon = position[1];
        // Call the API Ninjas weather endpoint
        const weatherResponse = await fetch(
            `https://api.api-ninjas.com/v1/weather?lat=${lat}&lon=${lon}`,
            { headers: { 'X-Api-Key': VITE_API_WEATHER_KEY } }
        );
        const weatherData1 = await weatherResponse.json();
        console.log("Weather data from API Ninjas: ", weatherData1);

        // Call the WeatherAPI.com forecast endpoint using the provided key
        const weatherApiUrl = `http://api.weatherapi.com/v1/forecast.json?key=${VITE_API_WEATHER_FORECAST}&q=${lat},${lon}&days=1`;
        const weatherApiResponse = await fetch(weatherApiUrl);
        const weatherData2 = await weatherApiResponse.json();
        // console.log("Weather data from WeatherAPI.com: ", weatherData2);

        // Merge responses (WeatherAPI data may have forecast & history while API Ninjas gives current conditions)
        const mergedWeatherData = { ...weatherData1, ...weatherData2 };
        console.log("Weather data: ", mergedWeatherData);
        data = { weather: mergedWeatherData };
        break;
    }
    case "Elevation": {
        const locations = [
            `${lat},${lng}`,
            `${lat+0.01},${lng+0.01}`,
            `${lat-0.01},${lng-0.01}`
        ].join('|');
        const elevResponse = await fetch(
            `https://api.open-elevation.com/api/v1/lookup?locations=${locations}`
        );
        const elevData = await elevResponse.json();
        console.log("Elevation data===>>> \n", elevData);
        // Prepare points for heatmap overlay
        let heatPoints = [];
        if (elevData.results) {
            heatPoints = elevData.results.map(r => [r.latitude, r.longitude, r.elevation]);
        }
        data = { elevations: elevData.results, heatPoints };
        break;
        }
        case "Air Quality Index": {
        const aqiResponse = await fetch(
            `https://api.waqi.info/feed/geo:${position[0]};${position[1]}/?token=${VITE_AQICN_TOKEN}`
        );
        const aqiData = await aqiResponse.json();
        console.log("AQI data===>>> \n", aqiData);
        if (aqiData.status === "ok") {
            data = { aqi: aqiData };
        }
        break;
    }
    case "Number of Buildings": {
        const lat = position[0];
        const lng = position[1];
        if (lat == null || lng == null) {
        console.error("Missing coordinates for buildings API call");
        break;
        }
        const buildingsResponse = await fetch(`http://127.0.0.1:8000/data/buildings?latitude=${lat}&longitude=${lng}`);
        const buildingsData = await buildingsResponse.json();
        console.log("Buildings data from local API ===>>> \n", buildingsData);
        data = { totalBuildings: buildingsData.totalBuildings, points: buildingsData };
        break;
    }     
    case "Distance to Nearest Amenities": {
        const lat = position[0];
        const lng = position[1];
        if (lat == null || lng == null) {
        console.error("Missing coordinates for buildings API call");
        break;
        }
        const buildingsResponse = await fetch(`http://127.0.0.1:8000/data/amenities?latitude=${lat}&longitude=${lng}`);
        const buildingsData = await buildingsResponse.json();
        console.log("Buildings data from local API ===>>> \n", buildingsData);
        data = { totalBuildings: buildingsData.totalBuildings, points: buildingsData };
        break;
    }   
    default:{
      try {
        const baseUrl = "http://localhost:8000/chat/filter";
        const query = `?filter_name=${encodeURIComponent(filter)}`;
        const url = baseUrl + query;

        // Construct POST body as per FastAPI ChatRequest model
        const body = {
            session_id: localStorage.getItem('user_session') || "anonymous_session",
            message: "Surat", // fallback message (city name)
            latitude: lat,
            longitude: lng
        };

        const maxRetries = 3;
        let attempt = 0;
        let resp = null;

        while (attempt < maxRetries) {
            attempt += 1;
            resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            // success
            if (resp.ok) break;

            // Handle rate-limiting (429/503)
            if (resp.status === 429 || resp.status === 503) {
                const retryAfter = parseInt(resp.headers.get("Retry-After") || "0", 10);
                const waitMs = (retryAfter > 0)
                    ? retryAfter * 1000
                    : (Math.pow(2, attempt) * 1000 + Math.round(Math.random() * 500));

                console.warn(`Backend rate-limited (status ${resp.status}), retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            } else {
                const txt = await resp.text().catch(() => "");
                console.error("Backend /chat/filter returned", resp.status, txt);
                break;
            }
        }

        if (!resp || !resp.ok) {
            console.error("fetchFilterData failed after retries");
            return null;
        }

        // Parse backend response
        const json = await resp.json();

        const insights =
            json.insights ||
            json.parsed_insights ||
            json.extracted_json ||
            null;

        data = {
            insights: insights || json,
            raw: json
        };

        console.log("✅ Filter data loaded:", data);
        // return data;

    } catch (error) {
        console.error("fetchFilterData error:", error);
        // return null;
    }
    }break;
}
  return data;
};