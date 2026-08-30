import type { ActionId, LocationId, LogLayer, Weather } from "./types";

export const LOCATION_LABEL: Record<LocationId, string> = {
  house: "House",
  field: "Field",
  forest: "Forest",
  pond: "Pond",
  storage: "Storage",
};

export const ACTION_WHAT: Record<ActionId, string> = {
  rest: "Rested.",
  draw_water: "Drew water.",
  water_field: "Watered the field.",
  plant_seeds: "Planted seeds.",
  harvest: "Harvested.",
  chop_wood: "Chopped wood.",
  store: "Stored supplies.",
  scout: "Scouted.",
  dig_irrigation: "Dug irrigation.",
  do_nothing: "Did nothing.",
};

export const ACTION_VALID_LOCATION: Record<ActionId, readonly LocationId[] | "any"> = {
  rest: ["house"],
  draw_water: ["pond"],
  water_field: ["field"],
  plant_seeds: ["field"],
  harvest: ["field"],
  chop_wood: ["forest"],
  store: ["storage"],
  scout: "any",
  dig_irrigation: ["field"],
  do_nothing: "any",
};

export const WEATHER_LABEL: Record<Weather, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  rain: "Rain",
  drought: "Drought",
};

export const LAYER_LABEL: Record<LogLayer, string> = {
  today: "Today",
  decision: "Decision",
  consequence: "Consequence",
};

export function formatDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[month - 1]} ${year}`;
}
