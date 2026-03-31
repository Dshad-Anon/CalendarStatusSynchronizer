import { Link, useNavigate } from "react-router-dom";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && (
        <nav className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-1 pt-1 text-gray-900 font-medium hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/calendar"
                  className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                >
                  Calendar
                </Link>
                <Link
                  to="/rules"
                  className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                >
                  Rules
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-blue-600"
                >
                  Settings
                </Link>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};
