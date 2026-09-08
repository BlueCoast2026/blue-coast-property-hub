export type HealthAnswerValue = "excellent" | "good" | "fair" | "needs_improvement";
const scores: Record<HealthAnswerValue, number> = { excellent: 10, good: 7.5, fair: 5, needs_improvement: 2.5 };
const values: HealthAnswerValue[] = ["excellent", "good", "fair", "needs_improvement"];
const options = (labels: [string, string, string, string]) => values.map((value, index) => ({ value, label: labels[index], score: scores[value] }));

export const healthCheckQuestions = [
  { key: "communication", category: "Communication", text: "How would you rate the communication you receive from your current property manager?", options: options(["Proactive, clear and timely", "Usually clear with minor delays", "Inconsistent or often delayed", "Poor or difficult to obtain"]) },
  { key: "routine_inspections", category: "Routine Inspections", text: "How satisfied are you with the frequency, quality and follow-up of routine property inspections?", options: options(["On schedule with detailed follow-up", "Generally consistent and useful", "Irregular or lacking detail", "Rarely completed or followed up"]) },
  { key: "rent_arrears_management", category: "Rent Arrears Management", text: "How effectively are rent arrears monitored, communicated and addressed when they occur?", options: options(["Monitored daily with prompt action", "Usually identified and handled quickly", "Updates or action are sometimes late", "Little visibility or effective follow-up"]) },
  { key: "maintenance_handling", category: "Maintenance Handling", text: "How would you rate the way maintenance requests and repairs are coordinated and communicated?", options: options(["Prompt, well coordinated and documented", "Most repairs are handled appropriately", "Delays or communication gaps occur", "Repairs are frequently unresolved"]) },
  { key: "lease_renewals", category: "Lease Renewals", text: "How effectively are lease renewals planned, discussed and completed before key dates?", options: options(["Discussed early and completed on time", "Usually managed before expiry", "Often handled close to expiry", "Deadlines are missed or unmanaged"]) },
  { key: "compliance_management", category: "Compliance Management", text: "How confident are you that relevant property compliance obligations are being monitored and managed?", options: options(["Fully documented and proactively managed", "Generally managed with current records", "Some obligations or records are unclear", "Compliance is not actively managed"]) },
  { key: "owner_reporting", category: "Owner Reporting", text: "How useful, accurate and timely is the reporting you receive about your property?", options: options(["Detailed, accurate and delivered on time", "Useful with occasional gaps", "Limited detail or frequently delayed", "Reports are inaccurate or unavailable"]) },
  { key: "market_rent_reviews", category: "Market Rent Reviews", text: "How satisfied are you with the timing and quality of market rent reviews for your property?", options: options(["Regular, evidence-based recommendations", "Reviewed at appropriate intervals", "Infrequent or lightly supported", "No meaningful rent review provided"]) },
  { key: "fee_transparency", category: "Fee Transparency", text: "How clear and transparent are the management fees, charges and statements you receive?", options: options(["All charges are clear and reconciled", "Mostly clear with minor questions", "Several charges require clarification", "Fees or statements are unclear"]) },
  { key: "overall_management_confidence", category: "Overall Management Confidence", text: "Overall, how confident are you in the current management of your investment property?", options: options(["Fully confident in the service", "Generally confident", "Some important concerns remain", "Little or no confidence"]) },
] as const;

export type ResultLevel = "green" | "orange" | "red";
export const resultContent: Record<ResultLevel, { heading: string; description: string }> = {
  green: { heading: "Strong Overall Condition", description: "The property management service appears to be performing well across most assessment areas." },
  orange: { heading: "Areas Worth Reviewing", description: "Some areas may benefit from further review, discussion or improvement." },
  red: { heading: "Further Attention Recommended", description: "Several areas may require closer review or follow-up." },
};
