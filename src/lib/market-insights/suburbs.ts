export type GoldCoastZone = "Coastal" | "Central" | "Northern" | "Hinterland";
export type BrisbaneZone = "Brisbane City" | "Logan" | "Ipswich" | "South Brisbane";
export type MarketRegion = "gold_coast" | "brisbane";

export type SuburbProfile = {
  name: string;
  postcode: string;
  slug: string;
  zone: GoldCoastZone | BrisbaneZone;
  market?: MarketRegion;
  description: string;
};

export const goldCoastSuburbProfiles: SuburbProfile[] = [
  { name: "Surfers Paradise", postcode: "4217", slug: "surfers-paradise", zone: "Coastal", description: "High-rise beachfront living and the Gold Coast's best-known tourism precinct." },
  { name: "Broadbeach", postcode: "4218", slug: "broadbeach", zone: "Coastal", description: "Beachside apartments, dining, retail and major entertainment amenities." },
  { name: "Broadbeach Waters", postcode: "4218", slug: "broadbeach-waters", zone: "Central", description: "Canal-front homes with convenient access to Broadbeach and major retail." },
  { name: "Mermaid Beach", postcode: "4218", slug: "mermaid-beach", zone: "Coastal", description: "Established beachside housing close to employment, dining and transport." },
  { name: "Mermaid Waters", postcode: "4218", slug: "mermaid-waters", zone: "Central", description: "Residential waterfront neighbourhoods near the central coastal corridor." },
  { name: "Burleigh Heads", postcode: "4220", slug: "burleigh-heads", zone: "Coastal", description: "A prominent beach, dining and lifestyle precinct with varied housing." },
  { name: "Miami", postcode: "4220", slug: "miami", zone: "Coastal", description: "A compact coastal suburb between Burleigh Heads and Mermaid Beach." },
  { name: "Palm Beach", postcode: "4221", slug: "palm-beach", zone: "Coastal", description: "Southern coastal living around beaches, creeks and local retail centres." },
  { name: "Currumbin", postcode: "4223", slug: "currumbin", zone: "Coastal", description: "Beach, creek and valley neighbourhoods with strong natural amenity." },
  { name: "Coolangatta", postcode: "4225", slug: "coolangatta", zone: "Coastal", description: "The southern beachfront centre near the airport and New South Wales border." },
  { name: "Southport", postcode: "4215", slug: "southport", zone: "Central", description: "A major business, health and education centre with diverse housing." },
  { name: "Labrador", postcode: "4215", slug: "labrador", zone: "Central", description: "Broadwater-side housing immediately north of the Southport centre." },
  { name: "Biggera Waters", postcode: "4216", slug: "biggera-waters", zone: "Northern", description: "Broadwater apartments and homes close to Harbour Town and transport." },
  { name: "Runaway Bay", postcode: "4216", slug: "runaway-bay", zone: "Northern", description: "Waterfront residential areas supported by established shopping and recreation." },
  { name: "Hope Island", postcode: "4212", slug: "hope-island", zone: "Northern", description: "Master-planned waterfront and golf communities in the northern corridor." },
  { name: "Helensvale", postcode: "4212", slug: "helensvale", zone: "Northern", description: "Established family housing with major rail, light rail and motorway connections." },
  { name: "Coomera", postcode: "4209", slug: "coomera", zone: "Northern", description: "A fast-growing northern centre with new housing, retail and transport links." },
  { name: "Robina", postcode: "4226", slug: "robina", zone: "Central", description: "A master-planned centre anchored by employment, education and major retail." },
  { name: "Varsity Lakes", postcode: "4227", slug: "varsity-lakes", zone: "Central", description: "Planned residential communities close to education and the rail network." },
  { name: "Mudgeeraba", postcode: "4213", slug: "mudgeeraba", zone: "Hinterland", description: "Established village and family neighbourhoods at the edge of the hinterland." },
];

export const brisbaneSuburbProfiles: SuburbProfile[] = [
  { name: "Brisbane City", postcode: "4000", slug: "brisbane-city", zone: "Brisbane City", market: "brisbane", description: "Queensland's capital-city centre with apartments, employment, education and major transport connections." },
  { name: "Logan", postcode: "4114", slug: "logan", zone: "Logan", market: "brisbane", description: "A major growth corridor between Brisbane and the Gold Coast with diverse housing and expanding infrastructure." },
  { name: "Ipswich", postcode: "4305", slug: "ipswich", zone: "Ipswich", market: "brisbane", description: "A historic regional centre west of Brisbane supported by transport, employment and new residential growth." },
  { name: "Park Ridge", postcode: "4125", slug: "park-ridge", zone: "Logan", market: "brisbane", description: "A developing residential area in the Logan growth corridor with expanding community infrastructure." },
  { name: "Sunnybank", postcode: "4109", slug: "sunnybank", zone: "South Brisbane", market: "brisbane", description: "An established southside suburb known for retail, dining, schools and access to major transport routes." },
  { name: "Sunnybank Hills", postcode: "4109", slug: "sunnybank-hills", zone: "South Brisbane", market: "brisbane", description: "An established family suburb with schools, shopping and convenient connections across Brisbane's southside." },
];
