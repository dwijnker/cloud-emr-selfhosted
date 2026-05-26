import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Activity, Users, Calendar, FileText, Pill, BarChart3, Zap } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Activity className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Cloud EMR</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive, elegant electronic health record system designed for modern healthcare providers
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Patient Management"
              description="Complete patient profiles with demographics, insurance, and provider team assignments"
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8" />}
              title="Clinical Chart"
              description="Comprehensive medical records including problems, allergies, medications, and history"
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8" />}
              title="Visit Notes"
              description="SOAP-style clinical documentation with templates and clinical summaries"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Vitals Tracking"
              description="Record and visualize patient vitals with historical trends and charting"
            />
            <FeatureCard
              icon={<Pill className="w-8 h-8" />}
              title="Orders Management"
              description="Lab, imaging, and cardiac orders with comprehensive tracking and results"
            />
            <FeatureCard
              icon={<Calendar className="w-8 h-8" />}
              title="Scheduling"
              description="Calendar-based appointment management with status tracking and provider assignment"
            />
          </div>

          {/* Additional Features */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Feature Set</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureItem title="Documents & Reports" />
              <FeatureItem title="Referrals & Letters" />
              <FeatureItem title="Prescriptions & Refills" />
              <FeatureItem title="Care Gaps Tracking" />
              <FeatureItem title="Patient Forms" />
              <FeatureItem title="Quality Measures" />
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || "Provider"}
          </h1>
          <p className="text-lg text-muted-foreground">
            Access your comprehensive EMR system
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <QuickActionCard
            title="Patients"
            description="View and manage patient records"
            onClick={() => navigate("/patients")}
            icon={<Users className="w-6 h-6" />}
          />
          <QuickActionCard
            title="Appointments"
            description="Schedule and manage appointments"
            onClick={() => navigate("/appointments")}
            icon={<Calendar className="w-6 h-6" />}
          />
          <QuickActionCard
            title="Orders"
            description="Create and track lab/imaging orders"
            onClick={() => navigate("/patients")}
            icon={<BarChart3 className="w-6 h-6" />}
          />
          <QuickActionCard
            title="Reports"
            description="View clinical reports and documents"
            onClick={() => navigate("/patients")}
            icon={<FileText className="w-6 h-6" />}
          />
        </div>

        {/* Recent Activity Placeholder */}
        <div className="card-base">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <p className="text-muted-foreground">
            Recent patient visits and updates will appear here
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function FeatureItem({ title }: { title: string }) {
  return (
    <div className="flex items-center">
      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
      <span className="text-gray-700">{title}</span>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="card-base text-left hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="text-primary mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}
