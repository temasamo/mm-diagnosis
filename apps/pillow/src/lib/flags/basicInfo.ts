export type BasicInfoPosition = "end" | "top" | "preview";
export const BASIC_INFO_POSITION: BasicInfoPosition =
  (process.env.NEXT_PUBLIC_BASIC_INFO_POSITION as BasicInfoPosition) ?? "end"; 