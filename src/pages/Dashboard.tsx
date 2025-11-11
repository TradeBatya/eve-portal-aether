import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SideNav } from "@/components/SideNav";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OperationsWidget } from "@/components/dashboard/OperationsWidget";
import { IntelWidget } from "@/components/dashboard/IntelWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { StatsWidget } from "@/components/dashboard/StatsWidget";
import { PingsWidget } from "@/components/dashboard/PingsWidget";
import { DashboardWelcome } from "@/components/dashboard/DashboardWelcome";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PluginsWidget } from "@/components/dashboard/PluginsWidget";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSideNavOpen(!isSideNavOpen)}
          className="mb-4 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold font-orbitron flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            {language === "en" ? "Dashboard" : "Панель управления"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en" 
              ? "Your personal command center" 
              : "Ваш персональный командный центр"}
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
          {/* Welcome Widget - Spans 2 columns */}
          <div className="lg:col-span-2">
            <DashboardWelcome />
          </div>

          {/* Quick Actions Widget */}
          <div className="lg:col-span-1">
            <QuickActionsWidget />
          </div>

          {/* Stats Widget - Full width */}
          <div className="lg:col-span-3">
            <StatsWidget />
          </div>

          {/* Operations Widget */}
          <div className="lg:col-span-2">
            <OperationsWidget />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>

          {/* Pings Widget */}
          <div className="lg:col-span-2">
            <PingsWidget />
          </div>

          {/* Intel Widget */}
          <div className="lg:col-span-1">
            <IntelWidget />
          </div>

          {/* Plugins Widget - Full width */}
          <div className="lg:col-span-3">
            <PluginsWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
