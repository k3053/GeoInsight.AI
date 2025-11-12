import re
import json
from typing import Dict, Any, List, Tuple, Optional

NUMBER_RE = re.compile(r"([-+]?\d{1,3}(?:[,\d{3}]*)(?:\.\d+)?)(?:\s*(kW|kWh|kwh|W|%|\$|USD|years|yrs|m²|sqm|mm|cm)?)", re.IGNORECASE)
DATE_VALUE_RE = re.compile(r"(\d{4}-\d{2}-\d{2})[:\s-]+([-+]?\d+(?:\.\d+)?)\s*(kWh|kW|%|W|mm)?", re.IGNORECASE)

def _to_number(s: str):
    if s is None:
        return None
    s = str(s).replace(",", "").strip()
    try:
        if "." in s:
            return float(s)
        return int(s)
    except:
        try:
            return float(s)
        except:
            return None

def extract_numbers_with_units(text: str) -> List[Dict[str, Any]]:
    out = []
    for m in NUMBER_RE.finditer(text):
        raw = m.group(0)
        num = _to_number(m.group(1))
        unit = (m.group(2) or "").strip()
        out.append({"raw": raw, "value": num, "unit": unit})
    return out

def extract_time_series(text: str) -> List[Dict[str, Any]]:
    series = []
    # ISO date:value pairs
    for m in DATE_VALUE_RE.finditer(text):
        date = m.group(1)
        val = _to_number(m.group(2))
        unit = (m.group(3) or "").strip()
        series.append({"date": date, "value": val, "unit": unit})
    # try to parse markdown tables where first column is date and second is value
    table_rows = _extract_table_timeseries(text)
    if table_rows:
        series.extend(table_rows)
    return series

def _extract_table_timeseries(text: str) -> List[Dict[str, Any]]:
    out = []
    # Match lines like: | 2023-01-01 | 12.3 | ...
    tbl_re = re.compile(r"^\s*\|?\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([-+]?\d[\d\.,]*)", re.MULTILINE)
    for m in tbl_re.finditer(text):
        date = m.group(1)
        value = _to_number(m.group(2))
        out.append({"date": date, "value": value, "unit": None})
    return out

def _strip_markdown(text: str) -> Tuple[str, List[Any], List[str]]:
    """
    Remove markdown formatting while extracting:
      - JSON code blocks (parsed if valid JSON)
      - other code blocks (kept removed)
      - inline links -> keep link text and collect urls
    Returns: (clean_text, extracted_json_objects, extracted_urls)
    """
    if not text:
        return "", [], []

    extracted_json = []
    extracted_urls = []

    # Extract triple-backtick blocks first (prefer json blocks)
    code_block_re = re.compile(r"```(?:json)?\s*\n([\s\S]*?)\n```", re.IGNORECASE)
    def _code_repl(m):
        body = m.group(1).strip()
        # try parse as json
        try:
            parsed = json.loads(body)
            extracted_json.append(parsed)
        except Exception:
            # try to find JSON inside (loose)
            try:
                jstart = body.find("{")
                jend = body.rfind("}")
                if jstart != -1 and jend != -1 and jend > jstart:
                    sub = body[jstart:jend+1]
                    parsed = json.loads(sub)
                    extracted_json.append(parsed)
                # else ignore
            except Exception:
                pass
        return ""  # remove code block content from the cleaned text

    text = code_block_re.sub(_code_repl, text)

    # Remove inline code `...`
    text = re.sub(r"`([^`]*)`", r"\1", text)

    # Replace markdown links [text](url) -> text and collect url
    link_re = re.compile(r"\[([^\]]+)\]\((https?://[^\)]+)\)")
    def _link_repl(m):
        extracted_urls.append(m.group(2))
        return m.group(1)
    text = link_re.sub(_link_repl, text)

    # Also capture bare URLs
    for m in re.finditer(r"(https?://[^\s\)\]]+)", text):
        extracted_urls.append(m.group(1))

    # Remove bold/italic markers **text**, __text__, *text*, _text_
    text = re.sub(r"(\*\*|__)(.*?)\1", r"\2", text)
    text = re.sub(r"(\*|_)(.*?)\1", r"\2", text)

    # Remove headings and images
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)

    # Normalize excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    return text, extracted_json, list(set(extracted_urls))

def extract_json_from_text(text: str) -> List[Any]:
    """
    Return any JSON objects extracted from code blocks or inline JSON.
    """
    clean, json_blocks, _ = _strip_markdown(text)
    # also attempt to find inline JSON objects
    inline_re = re.compile(r"(\{[\s\S]{20,}\})")  # crude: objects with length >20
    for m in inline_re.finditer(text):
        try:
            parsed = json.loads(m.group(1))
            json_blocks.append(parsed)
        except Exception:
            pass
    return json_blocks

def parse_aqi(text: str) -> Dict[str, Any]:
    """
    Extract AQI and pollutant concentrations (PM2.5, PM10, O3, NO2) heuristically.
    """
    lc = text.lower()
    out = {}
    # Look for 'AQI: 42' patterns
    m = re.search(r"\baqi[:\s]*([0-9]{1,3})\b", lc)
    if m:
        out["aqi"] = _to_number(m.group(1))
    # pollutant patterns
    for pollutant in ["pm2.5", "pm25", "pm10", "o3", "no2", "so2", "co"]:
        p_re = re.compile(rf"\b{pollutant}[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(µg/m³|ug/m3|ug/m³|ppb|ppm|µg/m3)?", re.IGNORECASE)
        mm = p_re.search(text)
        if mm:
            key = pollutant.replace(".", "").upper()
            out[key] = {"value": _to_number(mm.group(1)), "unit": (mm.group(2) or "").strip()}
    return out

def parse_precipitation(text: str) -> Dict[str, Any]:
    """
    Extract precipitation totals, probabilities, and rates.
    """
    lc = text.lower()
    out = {}
    # probability of precipitation
    m = re.search(r"(?:probability|chance)\s*(?:of\s*)?precip(?:itation)?[:\s]*([0-9]{1,3})\s*%?", lc)
    if m:
        out["precip_probability_percent"] = _to_number(m.group(1))
    # totals in mm
    m2 = re.search(r"([\d\.,]+)\s*(mm|cm|inches|in)\s*(?:of\s*)?precip(?:itation|itation)?", lc)
    if m2:
        val = _to_number(m2.group(1))
        unit = m2.group(2)
        out["precip_total"] = {"value": val, "unit": unit}
    # rates mm/hr
    m3 = re.search(r"([\d\.,]+)\s*(mm\/hr|mm/hr|mm per hour)", lc)
    if m3:
        out["precip_rate_mm_per_hr"] = _to_number(m3.group(1))
    return out

def parse_crime_rate(text: str) -> Dict[str, Any]:
    """
    Extract crime statistics: incidents, rates per 1k or per 100k, and breakdowns if available.
    """
    out = {}
    # rate per 1000 or 100k
    m = re.search(r"([\d\.,]+)\s*(?:per|/)\s*(1000|100k|100000)\b", text, re.IGNORECASE)
    if m:
        out["rate"] = _to_number(m.group(1))
        out["per"] = m.group(2)
    # total incidents
    m2 = re.search(r"(?:total|reported)\s+(?:incidents|crimes)[:\s]*([\d,]+)", text, re.IGNORECASE)
    if m2:
        out["incidents_total"] = _to_number(m2.group(1))
    # category breakdowns like "theft: 20, assault: 5"
    breakdown = {}
    for cat in ["theft", "assault", "burglary", "robbery", "vandalism", "vehicle theft"]:
        r = re.search(rf"{cat}[:\s]*([\d,]+)", text, re.IGNORECASE)
        if r:
            breakdown[cat] = _to_number(r.group(1))
    if breakdown:
        out["breakdown"] = breakdown
    return out

def parse_ndvi(text: str) -> Dict[str, Any]:
    """
    Extract NDVI values or percentiles.
    """
    out = {}
    m = re.search(r"ndvi[:\s]*([-+]?\d+(?:\.\d+)?)", text, re.IGNORECASE)
    if m:
        out["ndvi"] = _to_number(m.group(1))
    # ranges or percent green
    m2 = re.search(r"green cover[:\s]*([\d\.,]+)\s*%?", text, re.IGNORECASE)
    if m2:
        out["green_percent"] = _to_number(m2.group(1))
    return out

def extract_labeled_numbers(text: str) -> List[Dict[str, Any]]:
    """
    Extract numeric values along with possible descriptive labels (context words nearby).
    Example:
        "≈ 21.16 N, 72.84 E"  -> latitude=21.16, longitude=72.84
        "10 m resolution"     -> resolution_m=10
        "2020 / 2021"         -> years=[2020, 2021]
    """
    results = []
    # Normalize spaces and remove markdown
    text = re.sub(r"[ ]", " ", text)  # replace non-breaking spaces

    # Latitude / Longitude special handling
    coord_match = re.search(r"([0-9]+\.[0-9]+)\s*[°]?\s*[Nn]\s*[,/ ]+\s*([0-9]+\.[0-9]+)\s*[°]?\s*[Ee]", text)
    if coord_match:
        results.append({"key": "latitude", "value": float(coord_match.group(1)), "unit": "°N"})
        results.append({"key": "longitude", "value": float(coord_match.group(2)), "unit": "°E"})

    # Year ranges like 2020 / 2021
    year_matches = re.findall(r"\b(20[0-9]{2})\b", text)
    if year_matches:
        results.append({"key": "years", "value": [int(y) for y in sorted(set(year_matches))], "unit": "year"})

    # Resolution like "10 m" or "100 m"
    res_match = re.search(r"(\d+(?:\.\d+)?)\s*m(?:etre|eter|)\b", text, re.IGNORECASE)
    if res_match:
        results.append({"key": "resolution_m", "value": float(res_match.group(1)), "unit": "m"})

    # Other labeled numeric patterns: "<label>: <number><unit>"
    labeled_re = re.compile(
        r"([A-Za-z][A-Za-z\s\-/]{2,40})[:\s]+([-+]?\d+(?:\.\d+)?)(?:\s*(kW|kWh|m|mm|cm|%|USD|\$)?)",
        re.IGNORECASE
    )
    for m in labeled_re.finditer(text):
        key = re.sub(r"[^A-Za-z0-9]+", "_", m.group(1).strip().lower())
        val = _to_number(m.group(2))
        unit = (m.group(3) or "").strip()
        results.append({"key": key, "value": val, "unit": unit})

    # Fallback: all raw numeric values (optional)
    try:
        # try to extract JSON first
        basic_nums = extract_numbers_with_units(text)
    except ValueError:
        # fallback to regex-based numeric extraction
        basic_nums = extract_labeled_numbers(text)
    seen = {(r['value'], r.get('unit')) for r in results}
    for n in basic_nums:
        if (n['value'], n.get('unit')) not in seen:
            results.append({"key": None, **n})
    return results

def parse_solar(text: str) -> Dict[str, Any]:
    """
    Heuristic extractor for solar-specific metrics commonly returned by agents:
    - panel count, system size (kW), yearly energy (kWh), payback years, annual savings
    """
    try:
        # try to extract JSON first
        nums = extract_numbers_with_units(text)
    except ValueError:
        # fallback to regex-based numeric extraction
        nums = extract_labeled_numbers(text)
    insights = {}
    lc = text.lower()

    # panel count
    m = re.search(r"(\d{1,4})\s*(?:panels|modules)\b", lc)
    if m:
        insights["panel_count"] = int(m.group(1))

    # system size kW
    m = re.search(r"([\d\.,]+)\s*k\s?w\b", lc)
    if m:
        insights["system_kw"] = _to_number(m.group(1))

    # yearly energy
    m = re.search(r"([\d\.,]+)\s*(kwh|kwh/yr|kwh/yr|kwh/year|kwh per year)\b", lc)
    if m:
        insights["yearly_kwh"] = _to_number(m.group(1))

    # payback years
    m = re.search(r"payback(?:\s*period)?[:\s]*([\d\.]+)\s*(years|yrs)?", lc)
    if m:
        insights["payback_years"] = _to_number(m.group(1))
    else:
        m = re.search(r"([\d\.]+)\s*years\s*(?:to\s*payback|payback)", lc)
        if m:
            insights["payback_years"] = _to_number(m.group(1))

    # annual savings (currency)
    m = re.search(r"(?:(?:\$|usd)\s*[\d\.,]+|[\d\.,]+\s*(?:usd|\$))", text, re.IGNORECASE)
    if m:
        # reuse NUMBER_RE to get value & unit
        for n in nums:
            if n["unit"] and n["unit"].lower() in ("$", "usd") or "$" in n["raw"]:
                insights.setdefault("monetary_values", []).append(n)
    # fallback: collect numeric summary
    if "yearly_kwh" not in insights:
        for n in nums:
            if (n["unit"] or "").lower() in ("kwh",):
                insights["yearly_kwh"] = n["value"]
                break

    return insights

def parse_agent_response(text: str, filter_name: str = None) -> Dict[str, Any]:
    """
    Returns dict with:
     - clean_text: markdown stripped text
     - extracted_json: any JSON objects parsed from code blocks
     - extracted_urls: list of referenced urls
     - numeric_values: list of {raw, value, unit}
     - time_series: list of {date, value, unit}
     - breakdowns: any parsed categorical breakdowns (best-effort)
     - filter_specific: object with heuristic fields (e.g., solar metrics)
    """
    text = text or ""
    clean_text, extracted_json, extracted_urls = _strip_markdown(text)

    # If the agent returned a JSON object, prefer parsing that as source of truth
    parsed_from_json: Optional[Dict[str, Any]] = None
    if extracted_json:
        # pick first JSON object that looks like insights or a dict
        for j in extracted_json:
            if isinstance(j, dict):
                parsed_from_json = j
                break

    try:
        # try to extract JSON first
        numeric_insight = extract_numbers_with_units(clean_text)
    except ValueError:
        # fallback to regex-based numeric extraction
        numeric_insight = extract_labeled_numbers(clean_text)

    time_series = extract_time_series(clean_text)

    result: Dict[str, Any] = {
        "clean_text": clean_text,
        "extracted_urls": extracted_urls,
        "numeric_insights": numeric_insight,
        "time_series": time_series,
        "breakdowns": [],
        "filter_specific": {}
    }

    # If JSON contained structured insights, merge/return it under parsed_insights
    if parsed_from_json:
        # simple merging strategy: keep parsed JSON as 'parsed_insights'
        result["parsed_insights"] = parsed_from_json

    if filter_name:
        fn = filter_name.lower()
        if "solar" in fn:
            result["filter_specific"] = parse_solar(clean_text)
        elif "air quality" in fn or "air" == fn:
            result["filter_specific"] = parse_aqi(clean_text)
        elif "precipitation" in fn or "rain" in fn or "snow" in fn:
            result["filter_specific"] = parse_precipitation(clean_text)
        elif "crime" in fn or "safety" in fn:
            result["filter_specific"] = parse_crime_rate(clean_text)
        elif "ndvi" in fn or "vegetation" in fn:
            result["filter_specific"] = parse_ndvi(clean_text)
        else:
            result["filter_specific"] = {}

    # best-effort breakdown extraction (simple category: value pairs)
    cat_re = re.compile(r"([A-Za-z &\/\-]{3,50})[:\s]+([\d,]+(?:\.\d+)?)", re.IGNORECASE)
    breakdown = {}
    for m in cat_re.finditer(clean_text):
        key = m.group(1).strip()
        val = _to_number(m.group(2))
        if key and val is not None:
            breakdown[key] = val
    if breakdown:
        result["breakdowns"] = breakdown

    return result