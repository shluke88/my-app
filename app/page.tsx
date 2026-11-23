import HomeScreen from "@/components/home/HomeScreen";

// ① 첫 화면 (/) — 저장소를 읽는 부분은 HomeScreen(브라우저 전용)에서 처리한다
export default function Home() {
  return <HomeScreen />;
}
