import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import PatientList from "./pages/PatientList";
import PatientDetail from "./pages/PatientDetail";
import PatientCreate from "./pages/PatientCreate";
import ClinicalChart from "./pages/ClinicalChart";
import VisitNotes from "./pages/VisitNotes";
import Vitals from "./pages/Vitals";
import Orders from "./pages/Orders";
import Appointments from "./pages/Appointments";
import Documents from "./pages/Documents";
import Referrals from "./pages/Referrals";
import Prescriptions from "./pages/Prescriptions";
import CareGaps from "./pages/CareGaps";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/patients"}>
        {() => (
          <DashboardLayout>
            <PatientList />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/new"}>
        {() => (
          <DashboardLayout>
            <PatientCreate />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id"}>
        {(params) => (
          <DashboardLayout>
            <PatientDetail patientId={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/chart"}>
        {(params) => (
          <DashboardLayout>
            <ClinicalChart />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/visits"}>
        {(params) => (
          <DashboardLayout>
            <VisitNotes />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/vitals"}>
        {(params) => (
          <DashboardLayout>
            <Vitals />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/orders"}>
        {(params) => (
          <DashboardLayout>
            <Orders />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/appointments"}>
        {() => (
          <DashboardLayout>
            <Appointments />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/appointments"}>
        {(params) => (
          <DashboardLayout>
            <Appointments />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/referrals"}>
        {(params) => (
          <DashboardLayout>
            <Referrals />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/prescriptions"}>
        {(params) => (
          <DashboardLayout>
            <Prescriptions />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/patients/:id/care-gaps"}>
        {(params) => (
          <DashboardLayout>
            <CareGaps />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
