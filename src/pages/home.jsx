import Navbar from "../components/NavBar";
import Hero from "../components/Hero";
import StatsSection from "../components/StatsSection";
import ProblemSection from "../components/ProblemSection";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      <div className="pt-20 md:pt-24">
        <Hero />
        <StatsSection />
        <ProblemSection />
      </div>
    </div>
  );
}
