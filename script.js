const API_URL = "https://mindcast-h4er.onrender.com";

const form = document.getElementById("predict-form");
const btn = document.getElementById("predict-btn");
const btnLabel = document.getElementById("predict-btn-label");
const errorBanner = document.getElementById("error-banner");
const resultCard = document.getElementById("result-card");
const resultScore = document.getElementById("result-score");
const resultScaleFill = document.getElementById("result-scale-fill");

const fields = {
  age: { type: "number", min: 10, max: 100, integer: true, required: true, label: "age" },
  gender: { type: "select", required: true, label: "gender" },
  country: { type: "text", required: true, label: "country" },
  academic_level: { type: "select", required: true, label: "academic level" },
  most_used_platform: { type: "select", required: true, label: "platform" },
  purpose_of_use: { type: "select", required: true, label: "purpose of use" },
  avg_daily_usage_hours: { type: "number", min: 0, max: 24, required: true, label: "average daily usage hours" },
  daily_unlocks: { type: "number", min: 0, integer: true, required: true, label: "daily unlocks" },
  study_hours: { type: "number", min: 0, max: 24, required: true, label: "study hours" },
  physical_activity_hours: { type: "number", min: 0, max: 24, required: true, label: "physical activity hours" },
  sleep_hours_per_night: { type: "number", min: 0, max: 24, required: true, label: "sleep hours" },
  stress_level: { type: "select", required: true, label: "stress level" },
};

function setError(name, message) {
  const input = document.getElementById(name);
  const errBox = document.getElementById("err-" + name);
  if (message) {
    input.classList.add("invalid");
    errBox.textContent = message;
  } else {
    input.classList.remove("invalid");
    errBox.textContent = "";
  }
}

function validateField(name) {
  const cfg = fields[name];
  const input = document.getElementById(name);
  const raw = input.value.trim();

  if (cfg.required && raw === "") {
    setError(name, "Please provide a value.");
    return null;
  }

  if (cfg.type === "select") {
    setError(name, "");
    return raw;
  }

  if (cfg.type === "text") {
    setError(name, "");
    return raw;
  }

  // numeric
  const num = Number(raw);
  if (Number.isNaN(num)) {
    setError(name, "Enter a valid number.");
    return null;
  }
  if (cfg.integer && !Number.isInteger(num)) {
    setError(name, "Enter a whole number.");
    return null;
  }
  if (cfg.min !== undefined && num < cfg.min) {
    setError(name, `Must be at least ${cfg.min}.`);
    return null;
  }
  if (cfg.max !== undefined && num > cfg.max) {
    setError(name, `Must be at most ${cfg.max}.`);
    return null;
  }
  setError(name, "");
  return num;
}

// live validation
Object.keys(fields).forEach((name) => {
  const el = document.getElementById(name);
  el.addEventListener("blur", () => validateField(name));
  el.addEventListener("input", () => {
    if (el.classList.contains("invalid")) validateField(name);
  });
});

function showBanner(message) {
  if (!message) {
    errorBanner.classList.remove("show");
    errorBanner.textContent = "";
    return;
  }
  errorBanner.textContent = message;
  errorBanner.classList.add("show");
}

function setLoading(isLoading) {
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
  btnLabel.textContent = isLoading ? "Predicting..." : "Predict Mental Health Score";
}

function scoreToPercent(score) {
  // assume a 0-10 scale; clamp for the visual gauge only
  const clamped = Math.max(0, Math.min(10, score));
  return (clamped / 10) * 100;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showBanner("");
  resultCard.classList.remove("show");

  const values = {};
  let firstInvalid = null;
  let allValid = true;

  Object.keys(fields).forEach((name) => {
    const value = validateField(name);
    if (value === null) {
      allValid = false;
      if (!firstInvalid) firstInvalid = name;
    } else {
      values[name] = value;
    }
  });

  if (!allValid) {
    showBanner("Please fix the highlighted fields before predicting.");
    document.getElementById(firstInvalid).focus();
    return;
  }

  const payload = {
    age: values.age,
    gender: values.gender,
    country: values.country,
    academic_level: values.academic_level,
    most_used_platform: values.most_used_platform,
    purpose_of_use: values.purpose_of_use,
    avg_daily_usage_hours: values.avg_daily_usage_hours,
    daily_unlocks: values.daily_unlocks,
    study_hours: values.study_hours,
    physical_activity_hours: values.physical_activity_hours,
    sleep_hours_per_night: values.sleep_hours_per_night,
    stress_level: values.stress_level,
  };

  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = "";
      try {
        const errJson = await response.json();
        detail = errJson.detail ? ` (${JSON.stringify(errJson.detail)})` : "";
      } catch (_) { /* ignore parse errors */ }
      throw new Error(`Server responded with status ${response.status}${detail}`);
    }

    const data = await response.json();
    const score = data.predicted_mental_health_score;

    if (typeof score !== "number") {
      throw new Error("Unexpected response format from the prediction server.");
    }

    resultScore.innerHTML = `${score.toFixed(2)}<span>/10</span>`;
    resultScaleFill.style.width = scoreToPercent(score) + "%";
    resultCard.classList.add("show");
    resultCard.scrollIntoView({ behavior: "smooth", block: "center" });

  } catch (err) {
    if (err instanceof TypeError) {
      // fetch network-level failure (server down, CORS, DNS, etc.)
      showBanner("Unable to connect to the prediction server. Please make sure the FastAPI backend is running.");
    } else {
      showBanner(err.message || "Something went wrong while predicting. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});
