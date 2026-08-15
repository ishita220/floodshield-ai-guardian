export type RiskLevel = "low" | "moderate" | "severe";

export const cities = [
  { id: "delhi", name: "Delhi", coords: [28.6139, 77.209] as [number, number] },
  { id: "gurgaon", name: "Gurgaon", coords: [28.4595, 77.0266] as [number, number] },
  { id: "mumbai", name: "Mumbai", coords: [19.076, 72.8777] as [number, number] },
  { id: "bangalore", name: "Bangalore", coords: [12.9716, 77.5946] as [number, number] },
  { id: "chennai", name: "Chennai", coords: [13.0827, 80.2707] as [number, number] },
  { id: "hyderabad", name: "Hyderabad", coords: [17.385, 78.4867] as [number, number] },
  { id: "kolkata", name: "Kolkata", coords: [22.5726, 88.3639] as [number, number] },
];

export const liveWeather = {
  temp: 27,
  condition: "Heavy Rainfall",
  rainfall: 38, // mm/hr
  humidity: 92,
  wind: 24,
  pressure: 1004,
  visibility: 1.2,
  source: "OpenWeatherMap • IMD",
  updated: "2 min ago",
};

export const riskZones: {
  id: string;
  name: string;
  area: string;
  level: RiskLevel;
  coords: [number, number];
  radius: number;
  drainage: number;
  elevation: string;
  reports: number;
  /** Observed / estimated standing water depth in centimetres. */
  depthCm: number;
}[] = [
  { id: "z1", name: "IFFCO Chowk Underpass", area: "Gurgaon", level: "severe", coords: [28.4733, 77.0726], radius: 700, drainage: 22, elevation: "Low", reports: 14, depthCm: 62 },
  { id: "z2", name: "Cyber Hub Junction", area: "Gurgaon", level: "moderate", coords: [28.4949, 77.0894], radius: 600, drainage: 48, elevation: "Mid", reports: 6, depthCm: 24 },
  { id: "z3", name: "Sector 29 Market", area: "Gurgaon", level: "moderate", coords: [28.4682, 77.0696], radius: 500, drainage: 55, elevation: "Mid", reports: 4, depthCm: 18 },
  { id: "z4", name: "Hero Honda Chowk", area: "Gurgaon", level: "severe", coords: [28.4221, 76.9926], radius: 800, drainage: 18, elevation: "Low", reports: 21, depthCm: 70 },
  { id: "z5", name: "Golf Course Road", area: "Gurgaon", level: "low", coords: [28.4419, 77.0954], radius: 450, drainage: 78, elevation: "High", reports: 1, depthCm: 4 },
  { id: "z6", name: "MG Road Metro", area: "Gurgaon", level: "moderate", coords: [28.4796, 77.0805], radius: 500, drainage: 52, elevation: "Mid", reports: 5, depthCm: 28 },
];

export const alerts = [
  { id: "a1", level: "severe" as RiskLevel, title: "Severe waterlogging near IFFCO Chowk", time: "Just now", source: "IMD + 14 community reports" },
  { id: "a2", level: "moderate" as RiskLevel, title: "Possible waterlogging at Cyber Hub", time: "8 min ago", source: "Weather.com + traffic data" },
  { id: "a3", level: "moderate" as RiskLevel, title: "Avoid underpass near Hero Honda Chowk", time: "16 min ago", source: "AI risk model" },
  { id: "a4", level: "low" as RiskLevel, title: "Light rainfall expected in Sector 29", time: "32 min ago", source: "OpenWeatherMap" },
];

export const communityReports = [
  { id: "r1", user: "Aarav S.", area: "IFFCO Chowk", time: "3 min ago", note: "Water above knee level, cars stuck.", verified: true, upvotes: 42 },
  { id: "r2", user: "Priya K.", area: "Cyber Hub", time: "11 min ago", note: "Slow moving traffic, drains overflowing.", verified: true, upvotes: 18 },
  { id: "r3", user: "Rahul M.", area: "Sector 29", time: "19 min ago", note: "Ankle-deep water near main market.", verified: false, upvotes: 9 },
  { id: "r4", user: "Neha T.", area: "MG Road", time: "27 min ago", note: "Metro pillar area flooded.", verified: true, upvotes: 24 },
];

export const safeRoutes = [
  { id: "sr1", label: "AI Safe Route", time: "32 min", distance: "14.2 km", risk: "low" as RiskLevel, via: "Golf Course Rd → Sohna Rd", delay: "+6 min" },
  { id: "sr2", label: "Balanced", time: "28 min", distance: "12.8 km", risk: "moderate" as RiskLevel, via: "MG Rd → NH48", delay: "+2 min" },
  { id: "sr3", label: "Fastest (risky)", time: "26 min", distance: "11.4 km", risk: "severe" as RiskLevel, via: "IFFCO Chowk Underpass", delay: "Risk of waterlogging" },
];

export const shelters = [
  { id: "s1", name: "Sector 14 Community Hall", distance: "1.2 km", capacity: "120 ppl" },
  { id: "s2", name: "Govt. School Sector 22", distance: "2.4 km", capacity: "300 ppl" },
  { id: "s3", name: "DLF Phase 2 Clubhouse", distance: "3.1 km", capacity: "80 ppl" },
];

export const emergencyContacts = [
  { id: "e1", name: "NDRF Helpline", number: "1078" },
  { id: "e2", name: "Police", number: "112" },
  { id: "e3", name: "Ambulance", number: "108" },
  { id: "e4", name: "Disaster Mgmt. Gurgaon", number: "1077" },
];

export const rainfallTrend = [12, 18, 24, 30, 38, 34, 28, 22, 16, 20, 32, 38];

export const riskColor: Record<RiskLevel, string> = {
  low: "var(--safe)",
  moderate: "var(--warning)",
  severe: "var(--danger)",
};
