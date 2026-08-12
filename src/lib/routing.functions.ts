import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(extra: Record<string, string> = {}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps connection is not configured.");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function handleDenied(response: Response) {
  const text = await response.text();
  if (response.status === 403) {
    let reason: string | undefined;
    try {
      reason = JSON.parse(text)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason;
    } catch {
      /* ignore */
    }
    if (reason === "API_KEY_HTTP_REFERRER_BLOCKED")
      throw new Error('Maps server key is referrer-restricted. Set its application restrictions to "None" or "IP addresses".');
    if (reason === "API_KEY_SERVICE_BLOCKED")
      throw new Error("Maps server key does not allow this API. Add it to the key's allowed-APIs list.");
    throw new Error("Google Maps request was denied (403). Check the server key restrictions.");
  }
  throw new Error(`Google Maps request failed [${response.status}]: ${text}`);
}

export const suggestPlaces = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ query: z.string().min(2).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${GATEWAY}/places/v1/places:autocomplete`, {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        input: data.query,
        includedRegionCodes: ["in"],
        locationBias: {
          circle: { center: { latitude: 22.9734, longitude: 78.6569 }, radius: 1500000 },
        },
      }),
    });
    if (!response.ok) await handleDenied(response);
    const json = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId: string;
          text?: { text?: string };
          structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
        };
      }>;
    };
    return (json.suggestions ?? [])
      .filter((s) => s.placePrediction)
      .slice(0, 5)
      .map((s) => ({
        placeId: s.placePrediction!.placeId,
        main: s.placePrediction!.structuredFormat?.mainText?.text ?? s.placePrediction!.text?.text ?? "",
        secondary: s.placePrediction!.structuredFormat?.secondaryText?.text ?? "",
        full: s.placePrediction!.text?.text ?? "",
      }));
  });

const endpointSchema = z.object({ placeId: z.string().optional(), address: z.string().min(2).max(200).optional() });

export const computeSafeRoutes = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ origin: endpointSchema, destination: endpointSchema }).parse(data))
  .handler(async ({ data }) => {
    const toWaypoint = (p: { placeId?: string; address?: string }) =>
      p.placeId ? { placeId: p.placeId } : { address: p.address ?? "" };

    const response = await fetch(`${GATEWAY}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: gatewayHeaders({
        "X-Goog-FieldMask":
          "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.startLocation,routes.legs.endLocation",
      }),
      body: JSON.stringify({
        origin: toWaypoint(data.origin),
        destination: toWaypoint(data.destination),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: true,
        languageCode: "en-IN",
        units: "METRIC",
      }),
    });
    if (!response.ok) await handleDenied(response);
    const json = (await response.json()) as {
      routes?: Array<{
        duration?: string;
        distanceMeters?: number;
        description?: string;
        polyline?: { encodedPolyline?: string };
        legs?: Array<{
          startLocation?: { latLng?: { latitude: number; longitude: number } };
          endLocation?: { latLng?: { latitude: number; longitude: number } };
        }>;
      }>;
    };
    return (json.routes ?? []).map((r, i) => ({
      id: `route-${i}`,
      durationSeconds: Number((r.duration ?? "0s").replace("s", "")),
      distanceMeters: r.distanceMeters ?? 0,
      description: r.description ?? "",
      encodedPolyline: r.polyline?.encodedPolyline ?? "",
      start: r.legs?.[0]?.startLocation?.latLng ?? null,
      end: r.legs?.[r.legs.length - 1]?.endLocation?.latLng ?? null,
    }));
  });
