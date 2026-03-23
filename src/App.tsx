import { useState } from "react";
import type { ActivePage } from "./types";
import Landing from "./pages/Landing";
import BalancetePage from "./components/balancete/BalancetePage";
import JornalPage from "./components/jornal/JornalPage";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("landing");

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header activePage={activePage} onNavigateHome={() => setActivePage("landing")} />
      <main className="flex-1">
        {activePage === "landing" && <Landing onSelect={setActivePage} />}
        {activePage === "balancete" && <BalancetePage onBack={() => setActivePage("landing")} />}
        {activePage === "jornal" && <JornalPage onBack={() => setActivePage("landing")} />}
      </main>
      <Footer />
    </div>
  );
}
