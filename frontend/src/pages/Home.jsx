import HeroSection from "@/components/landing_page/HeroSection";
import HomeContactSection from "@/components/landing_page/HomeContactSection";
import LandingSection2 from "@/components/landing_page/LandingSection2";
import LandingSection3 from "@/components/landing_page/LandingSection3";
import { useEffect } from "react";

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "LankaNest";
  }, []);

  return (
    <div className="ln-page-surface text-slate-950">
      <HeroSection />
      <LandingSection2 />
      <LandingSection3 />
      <HomeContactSection />
    </div>
  );
};

export default Home;
