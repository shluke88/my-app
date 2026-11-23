import type { Metadata } from "next";
import HistoryScreen from "@/components/history/HistoryScreen";

export const metadata: Metadata = { title: "기록 — PoseFit" };

// 기록 (/history): 이 기기에 저장된 운동 기록
export default function HistoryPage() {
  return <HistoryScreen />;
}
