import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from "../components/dashboard/Sidebar"
import { Header } from "../components/dashboard/Header"

export function DashboardLayout({ onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const getActiveNav = () => {
    if (location.pathname === "/repository") return "documents"
    if (location.pathname === "/search") return "search"
    if (location.pathname === "/trash") return "trash"
    return "overview"
  }

  const handleNavChange = (id) => {
    if (id === "overview") navigate("/")
    else if (id === "documents") navigate("/repository")
    else if (id === "search") navigate("/search")
    else if (id === "trash") navigate("/trash")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar activeNav={getActiveNav()} onNavChange={handleNavChange} onLogout={onLogout} />
      <main className="flex-1 md:ml-64 transition-all flex flex-col min-h-screen">
        <Header searchQuery={""} onSearchChange={() => {}} onSearchSubmit={() => {}} />
        <div className="flex-1 p-6 bg-slate-50/50 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="mx-auto max-w-7xl relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
