from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class FilterInsight(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    bounding_box: List[float] | None = None
    years: Dict[str, float] | None = None
    data: float | None = None
    dataset: str | None = None
    source: str | None = None
    summary: str | None = None


