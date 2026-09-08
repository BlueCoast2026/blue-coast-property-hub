export type ReadinessValue = "ready" | "minor_attention" | "work_required" | "not_ready";
const scores: Record<ReadinessValue, number> = { ready: 10, minor_attention: 7.5, work_required: 5, not_ready: 2.5 };
const values: ReadinessValue[] = ["ready", "minor_attention", "work_required", "not_ready"];
const options = (labels: [string, string, string, string]) => values.map((value, index) => ({ value, label: labels[index], score: scores[value] }));

export const readyToRentQuestions = [
  { key: "safety_compliance", category: "Safety & Compliance", text: "Are the property's essential safety and compliance requirements current and ready for a new tenancy?", options: options(["All requirements are current and documented", "One minor check or update remains", "Several requirements are outstanding", "Requirements have not been assessed"]) },
  { key: "smoke_alarms", category: "Smoke Alarms", text: "Are smoke alarms installed, compliant, tested and ready for the tenancy commencement date?", options: options(["Compliant, tested and documented", "Installed with a minor service due", "Testing or upgrades are required", "Missing, faulty or not assessed"]) },
  { key: "electrical_safety", category: "Electrical Safety", text: "Are electrical fittings, switches, power points and supplied equipment in safe working condition?", options: options(["All inspected items work safely", "One minor defect needs attention", "Multiple repairs or checks are needed", "Known hazards or major faults exist"]) },
  { key: "plumbing_water", category: "Plumbing & Water", text: "Are taps, toilets, drains and hot-water systems working correctly without visible leaks or faults?", options: options(["Everything operates with no visible leaks", "A minor drip or adjustment remains", "Repairs are needed in several areas", "A major leak or system fault exists"]) },
  { key: "locks_security", category: "Locks & Security", text: "Do external doors, windows, locks and security devices operate correctly and provide appropriate security?", options: options(["All access points lock and operate correctly", "One minor adjustment or key issue remains", "Several locks or windows need repair", "The property cannot be secured adequately"]) },
  { key: "cleanliness", category: "Cleanliness", text: "Is the property clean throughout and ready to be presented to prospective tenants?", options: options(["Professionally clean and presentation-ready", "Only minor touch-ups are needed", "A substantial clean is still required", "Not yet cleaned or presentable"]) },
  { key: "repairs_maintenance", category: "Repairs & Maintenance", text: "Have known repairs, damage and maintenance items been completed to a suitable standard?", options: options(["All known items have been completed", "Only minor cosmetic work remains", "Several repairs are still outstanding", "Major damage or urgent work remains"]) },
  { key: "fixtures_appliances", category: "Fixtures & Appliances", text: "Are included fixtures, appliances, lighting and ventilation systems clean and operating correctly?", options: options(["All included items are clean and working", "One minor service or replacement remains", "Multiple items need repair or cleaning", "Essential fixtures or appliances do not work"]) },
  { key: "grounds_access", category: "Grounds & Access", text: "Are gardens, outdoor areas, paths, stairs and property access tidy, safe and presentable?", options: options(["Tidy, safe and presentation-ready", "Minor gardening or tidying remains", "Maintenance or safety work is required", "Access or outdoor areas are unsafe"]) },
  { key: "records_readiness", category: "Records & Readiness", text: "Are keys, manuals, compliance records and other tenancy information organised and available?", options: options(["All keys and records are organised", "One minor document or key remains", "Several records or keys are missing", "Handover information is not prepared"]) },
] as const;

export type ReadinessLevel = "green" | "orange" | "red";
export const readinessResultContent: Record<ReadinessLevel, { heading: string; description: string }> = {
  green: { heading: "Ready for the Rental Market", description: "The property appears well prepared across most of the areas reviewed." },
  orange: { heading: "Some Items Need Attention", description: "A few areas may benefit from attention before the property is offered for rent." },
  red: { heading: "Preparation Recommended", description: "Several areas may require work or professional review before the property is ready to rent." },
};
