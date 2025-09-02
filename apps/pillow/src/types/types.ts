export type FinalResult = {
  primaryGroup: string[];        // ←配列で統一
  secondaryGroup: string[];
  reasons: string[];
  insight?: { summary: string; reasons: string[] };
}; 