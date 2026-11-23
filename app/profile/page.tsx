import type { Metadata } from "next";
import ProfileScreen from "@/components/profile/ProfileScreen";

export const metadata: Metadata = { title: "프로필 — PoseFit" };

// 프로필 (/profile): 캐릭터·부위별 레벨·아이템·신체정보
export default function ProfilePage() {
  return <ProfileScreen />;
}
