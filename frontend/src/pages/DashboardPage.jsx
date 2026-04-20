import { useState, useEffect, useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { StatsCards } from "../components/dashboard/StatsCards"
import { DocumentTable } from "../components/dashboard/DocumentTable"
import { UploadSection } from "../components/dashboard/UploadSection"
import { DocumentDrawer } from "../components/dashboard/DocumentDrawer"
import { docService } from "../services/api"
import { motion } from "framer-motion"

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#64748b'];

export function DashboardPage() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const res = await docService.getDocs()
      const data = res.data?.items || []
      setDocuments([...data].reverse())
    } catch (e) {
      console.error("Dashboard Load Error", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadDocuments() }, [])

  const stats = useMemo(() => ({
    total: documents.length,
    verified: documents.filter(d => d.status === "verified").length,
    pending: documents.filter(d => d.status === "pending").length,
  }), [documents])

  const pieData = useMemo(() => {
    const counts = {};
    documents.forEach(d => {
      const cat = d.category || "Khác";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [documents])

  const handleUpload = async (file) => {
    setIsLoading(true)
    try {
      await docService.upload(file)
      await loadDocuments()
    } catch (e) {
      alert("Lỗi upload!")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-xl shadow-indigo-100/40">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-6">Tỷ lệ phân loại AI</h3>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={85} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs italic font-bold">Chưa có dữ liệu phân loại...</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <UploadSection onUpload={handleUpload} />
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-indigo-100/40 overflow-hidden">
            <DocumentTable 
              documents={documents.slice(0, 5)} 
              onDocumentClick={setSelectedDoc}
              onRefresh={loadDocuments}
              isLoading={isLoading}
              title="Văn bản gần đây"
            />
          </div>
        </div>
      </div>

      <DocumentDrawer
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        getImageUrl={docService.getImageUrl}
      />
    </motion.div>
  )
}
