export type DecisionAnswerValue = "low" | "moderate" | "high" | "very_high";
const scores: Record<DecisionAnswerValue, number> = { low: 2.5, moderate: 5, high: 7.5, very_high: 10 };
const values: DecisionAnswerValue[] = ["low", "moderate", "high", "very_high"];
const options = (labels: [string, string, string, string]) => values.map((value, index) => ({ value, label: labels[index], score: scores[value] }));

export const propertyDecisionQuestions = [
  { key: "goal_alignment", category: "Owner Plans", text: "Does this property still align with your current financial or investment goals?", options: options(["Yes, it strongly supports my goals", "Mostly, although my priorities are changing", "I am unsure whether it still fits", "No, it no longer aligns with my goals"]) },
  { key: "market_value_awareness", category: "Property", text: "Do you know the property's approximate current market value?", options: options(["Yes, from a recent professional appraisal", "I have a reasonable estimate", "My estimate may be out of date", "No, I would like an appraisal"]) },
  { key: "capital_growth_awareness", category: "Financial", text: "Do you know how much the property's value has changed since you purchased it?", options: options(["Yes, I track its capital growth", "I have a general idea", "I am uncertain about the change", "No, I have not assessed it"]) },
  { key: "investment_performance", category: "Financial", text: "Are you satisfied with the property's current rental return or overall investment performance?", options: options(["Very satisfied", "Generally satisfied", "Performance is below my expectations", "No, I am seriously concerned about performance"]) },
  { key: "upcoming_costs", category: "Property", text: "Are upcoming maintenance, renovation or ownership costs influencing your decision to keep the property?", options: options(["No significant costs are expected", "Some manageable costs are approaching", "Costs are affecting my decision", "Major costs are making me reconsider ownership"]) },
  { key: "next_goal", category: "Owner Plans", text: "Would selling the property help you achieve another financial or lifestyle goal?", options: options(["No, holding supports my current plans", "Possibly, but there is no immediate need", "Yes, it could support an important goal", "Yes, selling would directly enable my next step"]) },
  { key: "selling_cost_awareness", category: "Financial", text: "Do you have a clear idea of the costs involved in selling the property?", options: options(["Yes, I have a current detailed estimate", "I understand the main costs", "I only have a rough idea", "No, I need a selling cost estimate"]) },
  { key: "local_market_awareness", category: "Market", text: "Do you know how properties similar to yours are currently performing in the local market?", options: options(["Yes, I actively follow comparable sales", "I know the general market direction", "My market information is limited", "No, I would like a local market update"]) },
  { key: "twelve_month_intent", category: "Owner Plans", text: "If the right price could be achieved, would you consider selling within the next 12 months?", options: options(["No, I intend to continue holding", "Possibly, depending on my circumstances", "Yes, I would seriously consider it", "Yes, I am ready to discuss selling"]) },
  { key: "confidential_assessment", category: "Next Step", text: "Would you find it helpful to receive a confidential assessment comparing selling now with continuing to hold the property?", options: options(["Not at this stage", "Maybe in the future", "Yes, a comparison would be useful", "Yes, I would like to speak with an agent"]) },
] as const;

export type DecisionLevel = "hold" | "improve" | "sell";
export const decisionResultContent: Record<DecisionLevel, { heading: string; description: string }> = {
  hold: { heading: "Continuing to Hold May Still Suit Your Plans", description: "Your responses suggest the property remains broadly aligned with your current goals. Regularly reviewing performance and market value can help keep that decision informed." },
  improve: { heading: "Review and Improve Before Deciding", description: "Your responses highlight information or performance areas worth reviewing before making a final decision. An updated appraisal and property strategy discussion may clarify your best next step." },
  sell: { heading: "Now May Be the Right Time to Explore Selling", description: "Your responses suggest that selling could support your financial or lifestyle plans. A confidential appraisal can help you compare a potential sale with continuing to hold." },
};
