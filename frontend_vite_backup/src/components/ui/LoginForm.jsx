import { useState } from "react"
import { Lock, Mail, Loader2 } from "lucide-react"

export function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("admin@pbl5.com")
  const [password, setPassword] = useState("123456")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onLogin(email, password)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Hệ thống AI PBL5</h2>
        <p className="mt-1 text-xs text-slate-500 uppercase tracking-widest font-bold">Yêu cầu đăng nhập</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400">Email Admin</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400">Mật khẩu</label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 shadow-lg shadow-indigo-100"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "TRUY CẬP HỆ THỐNG"}
        </button>
      </form>
    </div>
  )
}