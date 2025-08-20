export type Insight = { summary: string; reasons: string[] };

export type ProvisionalResult = {
  category: string;
  confidence: number; // 0..1
  insight: Insight;
};

export type FinalResult = {
  primaryGroup: string[];
  secondaryGroup: string[];
  reasons: string[];
}; 