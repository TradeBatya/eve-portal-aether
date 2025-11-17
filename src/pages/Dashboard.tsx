import { useAuth } from "@/contexts/AuthContext";
import { SideNav } from "@/components/SideNav";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
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
    <div className="min-h-screen flex bg-background">
      <SideNav isOpen={isSideNavOpen} onToggle={() => setIsSideNavOpen(!isSideNavOpen)} />
      
      <div className={`flex-1 transition-all duration-300 ${isSideNavOpen ? 'md:ml-64' : 'ml-0'} flex flex-col`}>
        <div className="border-b bg-card/50 backdrop-blur-sm p-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSideNavOpen(!isSideNavOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">EVE Portal Aether</h1>
                <p className="text-sm text-muted-foreground">Advent Coalition Dashboard</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <UnifiedDashboard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
