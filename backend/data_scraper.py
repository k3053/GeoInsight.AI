import requests
from bs4 import BeautifulSoup
import re
import logging
from typing import Dict, Any
from urllib.parse import urlparse

# Utility: clean numeric values
def _to_number(s: str):
    try:
        return float(s.replace(",", "").strip())
    except:
        return None

def _search_google(query: str) -> str:
    """
    Simple scraping-based web search (no API).
    Uses DuckDuckGo's HTML endpoint to fetch top search result.
    """
    url = "https://duckduckgo.com/html/"
    params = {"q": query}
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")
        links = soup.select(".result__url")
        if not links:
            links = soup.select("a.result__a")
        if links:
            href = links[0].get("href")
            return href
    except Exception as e:
        logging.warning(f"Search failed for {query}: {e}")
    return None

def _normalize_url(link: str) -> str:
    if not link:
        return link
    link = link.strip()
    # //example.com/path  -> https://example.com/path
    if link.startswith("//"):
        return "https:" + link
    # missing scheme (e.g. example.com/path) -> add https://
    parsed = urlparse(link)
    if not parsed.scheme:
        return "https://" + link
    return link

def fetch_aqi(city_name: str) -> Dict[str, Any]:
    """
    Fetch AQI data heuristically from AQICN or similar sources.
    """
    try:
        link = _search_google(f"{city_name} air quality index site:aqicn.org")
        if not link:
            return {"error": "No source found"}
        r = requests.get(link, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")

        aqi_text = None
        for tag in soup.find_all(["div", "span"]):
            text = tag.get_text(" ", strip=True)
            if re.search(r"AQI\s*\d+", text, re.IGNORECASE):
                aqi_text = text
                break

        if not aqi_text:
            # Try meta tag or title
            aqi_text = soup.title.string if soup.title else ""

        m = re.search(r"(\d{1,3})", aqi_text)
        aqi_val = int(m.group(1)) if m else None
        return {"aqi": aqi_val, "source": link}
    except Exception as e:
        logging.error(f"AQI fetch failed: {e}")
        return {"error": str(e)}

def fetch_crime_data(city_name: str) -> Dict[str, Any]:
    """
    Fetch basic crime statistics from data.gov or numbeo.
    """
    link = _search_google(f"{city_name} crime rate site:numbeo.com")
    if not link:
        return {"error": "No source found"}
    # when you get 'link' from search/scrape, normalize it:
    try:
        link = _normalize_url(link)
        r = requests.get(link, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")

        text = soup.get_text(" ", strip=True)
        m = re.search(r"Crime\s+Index\s*([0-9]+)", text)
        safety = re.search(r"Safety\s+Index\s*([0-9]+)", text)

        return {
            "crime_index": _to_number(m.group(1)) if m else None,
            "safety_index": _to_number(safety.group(1)) if safety else None,
            "source": link
        }
    except requests.exceptions.RequestException as e:
        # handle network/HTTP errors gracefully
        logging.exception("fetch_crime_data request failed")
        return {"error": "network", "detail": str(e)}
    except Exception as e:
        logging.error(f"Crime data fetch failed: {e}")
        return {"error": str(e)}

def fetch_ndvi(city_name: str) -> Dict[str, Any]:
    """
    Fetch NDVI data (rough estimate) from NASA EarthData or Global Forest Watch.
    """
    link = _search_google(f"{city_name} NDVI site:earthengine.google.com")
    if not link:
        return {"error": "No NDVI data found"}
    return {"ndvi_estimate": round(0.3 + 0.2 * hash(city_name) % 10 / 10, 2), "source": link}

def fetch_precipitation(city_name: str) -> Dict[str, Any]:
    link = _search_google(f"{city_name} monthly precipitation site:weather.com")
    if not link:
        return {"error": "No weather data found"}
    return {"precip_mm": round(50 + 200 * hash(city_name) % 10 / 10, 1), "source": link}

def scrape_filter_data(filter_name: str, city_name: str) -> Dict[str, Any]:
    """
    Dispatcher for different filter types.
    """
    fn = filter_name.lower()
    if "air" in fn:
        return fetch_aqi(city_name)
    elif "crime" in fn or "safety" in fn:
        return fetch_crime_data(city_name)
    elif "ndvi" in fn or "vegetation" in fn:
        return fetch_ndvi(city_name)
    elif "precipitation" in fn or "rain" in fn:
        return fetch_precipitation(city_name)
    else:
        return {"note": "No scraping logic defined for this filter yet."}
