import os
import math

import requests


def load_env_var(key, env_path=".env"):
    """
    Loads a single environment variable from a .env file.
    Falls back to os.environ if the key is not present in the file.
    """
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                env_key, env_value = line.split("=", 1)
                if env_key.strip() == key:
                    return env_value.strip().strip('"').strip("'")

    return os.environ.get(key)

def get_zipcode_data(zip_code, census_api_key):
    """
    Returns underwriting-ready area risk features for a given ZIP code.
    """

    # -----------------------------
    # SAFE REQUEST
    # -----------------------------
    def safe_get(url, params=None):
        try:
            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            return {"error": str(e)}

    # -----------------------------
    # 1. FETCH RAW CENSUS DATA
    # -----------------------------
    def get_census():
        url = "https://api.census.gov/data/2021/acs/acs5"

        variables = [
            "B01003_001E",  # population
            "B19013_001E",  # median income
            "B25077_001E",  # home value
            "B25064_001E",  # rent
            "B15003_022E",  # bachelors
            "B15003_023E",  # masters
            "B25002_001E",  # total housing
            "B25002_002E",  # occupied
            "B25002_003E",  # vacant
        ]

        params = {
            "get": ",".join(variables),
            "for": f"zip code tabulation area:{zip_code}",
            "key": census_api_key
        }

        data = safe_get(url, params)

        if not isinstance(data, list) or len(data) < 2:
            return {"error": "census_failed", "raw": data}

        headers = data[0]
        values = data[1]
        result = dict(zip(headers, values))

        return {
            "population": int(result["B01003_001E"]),
            "median_income": int(result["B19013_001E"]),
            "median_home_value": int(result["B25077_001E"]),
            "median_rent": int(result["B25064_001E"]),
            "bachelors": int(result["B15003_022E"]),
            "masters": int(result["B15003_023E"]),
            "total_units": int(result["B25002_001E"]),
            "occupied_units": int(result["B25002_002E"]),
            "vacant_units": int(result["B25002_003E"]),
        }

    def log_scale(value, max_value):
        if value <= 0 or max_value <= 1:
            return 0.0
        return min(math.log(value) / math.log(max_value), 1.0)

    # -----------------------------
    # 2. TRANSFORM → INSURANCE FEATURES
    # -----------------------------
    def transform(census):
        if "error" in census:
            return census

        population = census["population"]
        total_units = census["total_units"]
        vacant = census["vacant_units"]

        if total_units == 0 or population == 0:
            return {"error": "invalid_data"}

        # Core derived features for modeling.
        exposure = min((population / total_units) / 5, 1.0)
        vacancy_rate = vacant / total_units
        education_rate = (census["bachelors"] + census["masters"]) / population
        stability = ((1 - vacancy_rate) + education_rate) / 2

        severity = log_scale(census["median_home_value"], 3_000_000)
        income = log_scale(census["median_income"], 300_000)
        rent = log_scale(census["median_rent"], 6_000)

        return {
            "raw_metrics": census,
            "risk_features": {
                "area_exposure": exposure,
                "vacancy_risk": vacancy_rate,
                "area_stability": stability,
                "loss_severity": severity,
                "income_level": income
            },
            "normalized_features": {
                "exposure": exposure,
                "vacancy_rate": vacancy_rate,
                "stability": stability,
                "severity": severity,
                "income": income,
                "rent": rent,
            }
        }

    # -----------------------------
    # EXECUTION
    # -----------------------------
    census = get_census()
    features = transform(census)

    return {
        "zip_code": zip_code,
        "area_profile": features
    }


if __name__ == "__main__":
    api_key = load_env_var("CENSUS_API_KEY")
    if not api_key:
        raise ValueError("Missing CENSUS_API_KEY in .env or environment variables.")

    zipcode_data = get_zipcode_data("90210", api_key)
    print(zipcode_data)
