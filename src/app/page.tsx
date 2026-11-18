import { PrototypeBanner } from "@/components/PrototypeBanner";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeIntro } from "@/components/home/HomeIntro";

export default function Home() {
  return (
    <>
      <PrototypeBanner />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-10 px-4 py-12 md:flex-row md:justify-between">
        <HomeIntro />
        <HomeHero className="max-w-2xl md:w-[58%] md:shrink-0" />
      </main>
    </>
  );
}
