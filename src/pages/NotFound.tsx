import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Log error silently - never show technical details to user
    console.error("404:", location.pathname);
  }, [location.pathname]);

  const handleGoHome = () => {
    if (user) {
      // Check if user is a company user (simplified check)
      navigate('/mein-bereich');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="max-w-md w-full text-center">
        {/* Friendly illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-6xl">🙈</span>
          </div>
        </div>

        {/* Friendly message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Ups, da ist etwas schiefgelaufen
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Die Seite, die du suchst, existiert leider nicht oder wurde verschoben.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
          <Button
            onClick={handleGoHome}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
