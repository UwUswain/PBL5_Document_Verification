import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { RepositoryPage } from "./pages/RepositoryPage"
import { SearchPage } from "./pages/SearchPage"
import { docService } from "./services/api"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("pbl5_token");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsInitializing(false);
  }, [])

  if (isInitializing) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? <LoginPage onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <DashboardLayout onLogout={() => {
            docService.logout();
            setIsAuthenticated(false);
          }} /> : <Navigate to="/login" />
        }>
          <Route index element={<DashboardPage />} />
          <Route path="repository" element={<RepositoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="trash" element={<div className="p-10 text-center font-bold text-slate-400">Tính năng Thùng rác đang xây dựng</div>} />
        </Route>
      </Routes>
    </Router>
  )
}