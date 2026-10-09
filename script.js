"use strict";

const temperatureInput = document.getElementById("temperature");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");

const resultElement = document.getElementById("result");
const resultUnitElement = document.getElementById("resultUnit");
const resultMessage = document.getElementById("resultMessage");
const errorMessage = document.getElementById("errorMessage");
const precisionNote = document.getElementById("precisionNote");

const swapBtn = document.getElementById("swapBtn");
const copyBtn = document.getElementById("copyBtn");
const resetBtn = document.getElementById("resetBtn");
const precisionBtn = document.getElementById("precisionBtn");
const precisionOptions = document.getElementById("precisionOptions");
const precisionSelect = document.getElementById("precision");

const SYMBOLS = {
  C: "°C",
  F: "°F",
  K: "K"
};

const UNIT_NAMES = {
  C: "Celsius",
  F: "Fahrenheit",
  K: "Kelvin"
};

let lastResult = null;

function toCelsius(value, unit) {
  switch (unit) {
    case "C":
      return value;
    case "F":
      return (value - 32) * 5 / 9;
    case "K":
      return value - 273.15;
    default:
      throw new Error("Unsupported temperature unit.");
  }
}

function fromCelsius(celsius, unit) {
  switch (unit) {
    case "C":
      return celsius;
    case "F":
      return celsius * 9 / 5 + 32;
    case "K":
      return celsius + 273.15;
    default:
      throw new Error("Unsupported temperature unit.");
  }
}

function convertTemperature(value, sourceUnit, targetUnit) {
  const celsius = toCelsius(value, sourceUnit);

  // Absolute zero is 0 K, approximately -273.15 °C.
  if (celsius < -273.15) {
    throw new Error(
      "Temperature cannot be below absolute zero (0 K or -273.15 °C)."
    );
  }

  const result = fromCelsius(celsius, targetUnit);

  if (!Number.isFinite(result)) {
    throw new Error("This temperature is outside the supported range.");
  }

  return result;
}

function formatNumber(value) {
  const places = Number(precisionSelect.value);

  // Suppress negative zero caused by floating-point rounding.
  const threshold = 0.5 * Math.pow(10, -places);
  const adjustedValue = Math.abs(value) < threshold ? 0 : value;

  return adjustedValue.toLocaleString("en-US", {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits: places
  });
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;

  resultElement.textContent = "—";
  resultUnitElement.textContent = "";
  resultMessage.textContent = "Check your temperature input.";
  precisionNote.textContent = "Waiting for a valid temperature";
  lastResult = null;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function updatePrecisionNote() {
  const places = Number(precisionSelect.value);
  precisionNote.textContent =
    `Rounded to ${places} decimal ${places === 1 ? "place" : "places"}`;
}

function updateConversion() {
  const rawValue = temperatureInput.value.trim();

  clearError();

  if (rawValue === "") {
    showError("Please enter a temperature value.");
    return;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    showError("Enter a valid finite number.");
    return;
  }

  // Validate the original unit before calculating the result.
  const celsius = toCelsius(value, fromUnit.value);

  if (celsius < -273.15) {
    showError(
      "Temperature cannot be below absolute zero (0 K or -273.15 °C)."
    );
    return;
  }

  try {
    const result = convertTemperature(
      value,
      fromUnit.value,
      toUnit.value
    );

    const sourceText = formatNumber(value);
    const resultText = formatNumber(result);

    resultElement.textContent = resultText;
    resultUnitElement.textContent = SYMBOLS[toUnit.value];

    resultMessage.textContent =
      `${sourceText} ${SYMBOLS[fromUnit.value]} = ` +
      `${resultText} ${SYMBOLS[toUnit.value]}`;

    lastResult = {
      value: result,
      text: resultText,
      unit: toUnit.value
    };

    updatePrecisionNote();
  } catch (error) {
    showError(error.message);
  }
}

// Instant conversion when the user types or changes units.
temperatureInput.addEventListener("input", updateConversion);
fromUnit.addEventListener("change", updateConversion);
toUnit.addEventListener("change", updateConversion);
precisionSelect.addEventListener("change", updateConversion);

// Swap units and use the previous result as the new input.
swapBtn.addEventListener("click", () => {
  if (lastResult === null) {
    return;
  }

  const previousResult = lastResult.value;
  const previousTargetUnit = toUnit.value;

  toUnit.value = fromUnit.value;
  fromUnit.value = previousTargetUnit;
  temperatureInput.value = String(previousResult);

  updateConversion();
});

// Show or hide decimal precision settings.
precisionBtn.addEventListener("click", () => {
  precisionOptions.hidden = !precisionOptions.hidden;

  precisionBtn.textContent = precisionOptions.hidden
    ? "Change precision"
    : "Hide precision";

  if (!precisionOptions.hidden) {
    precisionSelect.focus();
  }
});

// Copy the currently displayed conversion result.
copyBtn.addEventListener("click", async () => {
  if (lastResult === null) {
    showError("Enter a valid temperature before copying.");
    return;
  }

  const textToCopy =
    `${lastResult.text} ${SYMBOLS[lastResult.unit]}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
    copyBtn.textContent = "Copied!";

    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1500);
  } catch {
    // Clipboard access may require HTTPS or localhost.
    showError(
      "Clipboard access is unavailable. Select and copy the result manually."
    );
  }
});

// Quick-reference cards fill the converter with their temperature.
document.querySelectorAll(".reference-card").forEach((card) => {
  card.addEventListener("click", () => {
    temperatureInput.value = card.dataset.value;
    fromUnit.value = card.dataset.unit;

    // Choose Fahrenheit as the target unless it is already the source.
    toUnit.value = fromUnit.value === "F" ? "C" : "F";

    updateConversion();

    document.getElementById("converter-title").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
});

// Restore the initial converter state.
resetBtn.addEventListener("click", () => {
  temperatureInput.value = "25";
  fromUnit.value = "C";
  toUnit.value = "F";
  precisionSelect.value = "2";

  precisionOptions.hidden = true;
  precisionBtn.textContent = "Change precision";
  copyBtn.textContent = "Copy";

  updateConversion();
});

// Display the initial result when the page loads.
updateConversion();