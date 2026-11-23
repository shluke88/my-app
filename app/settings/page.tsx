import type { Metadata } from "next";
import SettingsScreen from "@/components/settings/SettingsScreen";

export const metadata: Metadata = { title: "설정 — PoseFit" };

// ④ 설정 화면 (/settings)
export default function SettingsPage() {
  return <SettingsScreen />;
}
