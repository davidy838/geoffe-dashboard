import { tokens } from "../theme";

// Simple BC CHSA data with unit costs
export const bcChsaData = [
  { id: "VICTORIA", value: 67.58 },
  { id: "VANCOUVER", value: 53.55 },
  { id: "OKANAGAN", value: 184.54 },
  { id: "NORTHERN", value: 215.16 },
  { id: "COASTAL", value: 138.74 },
];

// Very simple BC map with basic rectangular regions that will definitely work
export const bcChsaFeatures = {
  type: "FeatureCollection",
  features: [
    // Victoria (Southern Vancouver Island)
    {
      type: "Feature",
      properties: {
        name: "Victoria",
        CHSA_Name: "VICTORIA",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-123.4, 48.4],
          [-123.2, 48.4],
          [-123.2, 48.6],
          [-123.4, 48.6],
          [-123.4, 48.4]
        ]]
      },
      id: "VICTORIA",
    },
    // Vancouver (Lower Mainland)
    {
      type: "Feature",
      properties: {
        name: "Vancouver",
        CHSA_Name: "VANCOUVER",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-123.1, 49.2],
          [-122.9, 49.2],
          [-122.9, 49.4],
          [-123.1, 49.4],
          [-123.1, 49.2]
        ]]
      },
      id: "VANCOUVER",
    },
    // Okanagan (Interior)
    {
      type: "Feature",
      properties: {
        name: "Okanagan",
        CHSA_Name: "OKANAGAN",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-119.6, 49.8],
          [-119.2, 49.8],
          [-119.2, 50.0],
          [-119.6, 50.0],
          [-119.6, 49.8]
        ]]
      },
      id: "OKANAGAN",
    },
    // Northern BC
    {
      type: "Feature",
      properties: {
        name: "Northern BC",
        CHSA_Name: "NORTHERN",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-126.0, 53.0],
          [-125.5, 53.0],
          [-125.5, 54.0],
          [-126.0, 54.0],
          [-126.0, 53.0]
        ]]
      },
      id: "NORTHERN",
    },
    // Coastal BC
    {
      type: "Feature",
      properties: {
        name: "Coastal BC",
        CHSA_Name: "COASTAL",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-126.3, 52.0],
          [-126.1, 52.0],
          [-126.1, 52.5],
          [-126.3, 52.5],
          [-126.3, 52.0]
        ]]
      },
      id: "COASTAL",
    },
  ],
}; 