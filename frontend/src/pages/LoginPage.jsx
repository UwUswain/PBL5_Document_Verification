import { LoginForm } from "../components/ui/LoginForm"
import { docService } from "../services/api"

export function LoginPage({ onLogin }) {
  const handleLogin = async (username, password) => {
    try {
      await docService.login(username, password)
      onLogin()
    } catch (err) {
      alert("Đăng nhập thất bại! Kiểm tra lại tài khoản.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <LoginForm onLogin={handleLogin} />
    </div>
  )
}
