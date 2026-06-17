'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Typography, Table, Tag, Button, Input, Dropdown, MenuProps, Space, Badge, ConfigProvider, Tooltip, notification, Card, Empty, Popconfirm, Spin
} from 'antd';
import { 
  SearchOutlined, 
  SettingOutlined, 
  FilterOutlined, 
  UploadOutlined, 
  MoreOutlined,
  EyeOutlined,
  FilePdfOutlined,
  CheckCircleFilled,
  WarningFilled,
  SyncOutlined,
  SafetyCertificateFilled,
  EditFilled,
  FileImageOutlined,
  FileTextOutlined,
  LineChartOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';
import { DocumentDetailDrawer } from '@/components/shared/DocumentDetailDrawer';
import { UploadModalTeal } from '@/components/dashboard/UploadModalTeal';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const { Title, Text } = Typography;

// Mapping FSM Stages to UI (Antd compatible)
const STATUS_CONFIG: Record<string, { bg: string, text: string, dot: string }> = {
  'RECEIVED': { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  'PROCESSING': { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  'OCR_DONE': { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  'ENRICHING': { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
  'COMPLETED': { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  'FAILED': { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' }
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'suspicious', label: 'Suspicious' },
  { key: 'processing', label: 'In workflow' },
  { key: 'failed', label: 'Rejected' }
];


function StatCard({ label, value, subtext, icon: Icon, color, bg, isLoading }: any) {
  return (
    <Card 
      styles={{ body: { padding: 24 } }}
      style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: 'block' }}>{label}</Text>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 700 }}>
            {isLoading ? <Spin size="small" /> : value}
          </Title>
          <Text style={{ fontSize: 13, color: '#64748b' }}>
            {subtext}
          </Text>
        </div>
        <div style={{ padding: 12, borderRadius: 12, backgroundColor: bg }}>
          <Icon style={{ fontSize: 24, color: color }} />
        </div>
      </div>
    </Card>
  );
}

function ActivityItem({ action, document, time, type }: any) {
  const iconMap: Record<string, any> = {
    success: { icon: CheckCircleOutlined, color: '#16a34a', bg: '#f0fdf4' },
    pending: { icon: ClockCircleOutlined, color: '#d97706', bg: '#fffbeb' },
    error: { icon: WarningOutlined, color: '#dc2626', bg: '#fef2f2' },
    info: { icon: FileTextOutlined, color: '#2563eb', bg: '#eff6ff' },
  };

  const config = iconMap[type] || iconMap.info;
  const Icon = config.icon;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 16 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ color: config.color, fontSize: 16 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 14, color: '#1e293b', display: 'block' }}>{action}</Text>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{document}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{time}</Text>
      </div>
    </div>
  );
}

const formatCategory = (cat: string) => {
  if (!cat) return 'N/A';
  const upper = cat.toUpperCase();
  if (upper.startsWith('CÔN') || upper.startsWith('CON')) return 'Công văn';
  if (upper.startsWith('QUY')) return 'Quyết định';
  if (upper.startsWith('THÔ') || upper.startsWith('THO')) return 'Thông báo';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
};

export default function DashboardTealPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs', searchQuery],
    queryFn: () => {
      if (searchQuery) return docService.searchDocs(searchQuery).then(res => res.data.items || []);
      return docService.getDocs(100, 0).then(res => res.data.items || []);
    },
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => docService.getDashboardStats().then(res => res.data),
  });

  const { data: publicDocsData, isLoading: isPublicLoading } = useQuery({
    queryKey: ['public_docs'],
    queryFn: () => docService.getPublicDocs(4, 0).then(res => res.data.items || []),
  });
  const publicDocs = publicDocsData || [];

  const docs = data || [];

  // Local Filtering
  const filteredDocs = useMemo(() => {
    return docs.filter((doc: any) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'verified') return doc.verification_status?.toUpperCase() === 'VERIFIED';
      if (activeTab === 'suspicious') return doc.status?.toUpperCase() === 'COMPLETED' && doc.verification_status?.toUpperCase() !== 'VERIFIED';
      if (activeTab === 'processing') return !['COMPLETED', 'FAILED'].includes(doc.status?.toUpperCase());
      if (activeTab === 'failed') return doc.status?.toUpperCase() === 'FAILED';
      return true;
    });
  }, [docs, activeTab]);

  // Analytics Data
  const analytics = useMemo(() => {
    const totalDocs = docs.length;
    const completed = docs.filter((d: any) => d.status === 'COMPLETED').length;
    const suspicious = docs.filter((d: any) => d.verification_status === 'SUSPICIOUS').length;
    const failed = docs.filter((d: any) => d.status === 'FAILED').length;

    // Categories
    const categoryCount: Record<string, number> = {};
    docs.forEach((d: any) => {
      const cat = formatCategory(d.category);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const pieData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#ffc658'];

    // Timeline
    const dateCount: Record<string, number> = {};
    [...docs].reverse().forEach((d: any) => {
      const date = new Date(d.created_at).toLocaleDateString('vi-VN');
      dateCount[date] = (dateCount[date] || 0) + 1;
    });
    const lineData = Object.keys(dateCount).map(date => ({ date, count: dateCount[date] }));

    return { totalDocs, completed, suspicious, failed, pieData, lineData, COLORS };
  }, [docs]);

  // Real Recent Activity from docs
  const recentActivity = useMemo(() => {
    return [...docs]
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((doc: any) => {
        let action = 'Document Uploaded';
        let type = 'info';
        
        if (doc.status === 'COMPLETED') {
          if (doc.verification_status === 'VERIFIED') {
            action = 'Verification Passed';
            type = 'success';
          } else if (doc.verification_status === 'SUSPICIOUS') {
            action = 'Suspicious Detected';
            type = 'pending';
          } else {
            action = 'Extraction Complete';
            type = 'success';
          }
        } else if (doc.status === 'FAILED') {
          action = 'Extraction Failed';
          type = 'error';
        } else if (doc.status === 'OCR_DONE' || doc.status === 'ENRICHING') {
          action = 'AI Processing';
          type = 'info';
        }

        // Format time difference
        const diffMs = new Date().getTime() - new Date(doc.created_at).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const timeStr = diffMins < 1 ? 'Vừa xong' :
                       diffMins < 60 ? `${diffMins} phút trước` : 
                       diffMins < 1440 ? `${Math.floor(diffMins / 60)} giờ trước` : 
                       `${Math.floor(diffMins / 1440)} ngày trước`;

        return {
          id: doc.id,
          action,
          document: doc.file_name,
          time: timeStr,
          type
        };
      });
  }, [docs]);

  const getTabCount = (tabKey: string) => {
    if (tabKey === 'all') return docs.length;
    if (tabKey === 'verified') return docs.filter((d: any) => d.verification_status?.toUpperCase() === 'VERIFIED').length;
    if (tabKey === 'suspicious') return docs.filter((d: any) => d.status?.toUpperCase() === 'COMPLETED' && d.verification_status?.toUpperCase() !== 'VERIFIED').length;
    if (tabKey === 'processing') return docs.filter((d: any) => !['COMPLETED', 'FAILED'].includes(d.status?.toUpperCase())).length;
    if (tabKey === 'failed') return docs.filter((d: any) => d.status?.toUpperCase() === 'FAILED').length;
    return 0;
  };
  
  const hasSuspicious = docs.some((d: any) => d.status?.toUpperCase() === 'COMPLETED' && d.verification_status?.toUpperCase() !== 'VERIFIED');
  

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);
    try {
      await docService.upload(file);
      refetch();
      onSuccess('ok');
      setIsUploadModalOpen(false);
    } catch (e) {
      onError(e);
    } finally {
      setIsUploading(false);
    }
  };

  const columns = [
    {
      title: 'TÊN VĂN BẢN',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {text.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} /> : <FileImageOutlined style={{ color: '#008080', fontSize: 16 }} />}
          </div>
          <div>
            <Text strong style={{ color: '#0f172a', display: 'block', fontSize: 14 }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{record.id.split('-')[0]}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'LOẠI',
      key: 'details',
      width: 140,
      render: (_: any, record: any) => {
        return (
          <Tag color="#f1f5f9" style={{ color: '#475569', margin: 0, border: 'none', fontWeight: 500, padding: '4px 8px', borderRadius: 6 }}>
            {formatCategory(record.category)}
          </Tag>
        );
      }
    },
    {
      title: 'NGÀY TẠO',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => {
        const d = new Date(date);
        return <Text style={{ color: '#64748b' }}>{d.toLocaleDateString('vi-VN')} {d.getHours()}:{d.getMinutes().toString().padStart(2, '0')}</Text>;
      }
    },
    {
      title: 'TRẠNG THÁI AI',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG['RECEIVED'];
        return (
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, 
            padding: '4px 10px', borderRadius: 20, 
            backgroundColor: config.bg
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: config.dot }} />
            <Text style={{ fontSize: 12, fontWeight: 600, color: config.text, textTransform: 'capitalize' }}>
              {status.toLowerCase()}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'ĐỘ TIN CẬY',
      dataIndex: 'verification_status',
      key: 'verification_status',
      width: 160,
      render: (vStatus: string, record: any) => {
        if (record.status !== 'COMPLETED') return <Text type="secondary">—</Text>;
        return vStatus === 'VERIFIED' 
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircleFilled style={{ color: '#16a34a' }} /><Text style={{ color: '#16a34a', fontWeight: 600 }}>Verified</Text></div>
          : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><WarningFilled style={{ color: '#d97706' }} /><Text style={{ color: '#d97706', fontWeight: 600 }}>Suspicious</Text></div>
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: 'view', label: 'View Details', icon: <EyeOutlined />, onClick: () => setSelectedDoc(record) },
          { key: 'download', label: 'Download', icon: <DownloadOutlined /> },
          { type: 'divider' },
          { key: 'delete', label: (
            <Popconfirm
              title="Xác nhận thực hiện?"
              description="Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể hoàn tác."
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={(e) => {
                e?.stopPropagation(); // Xử lý nếu cần
              }}
            >
              <Text type="danger">Delete</Text>
            </Popconfirm>
          ), icon: <DeleteOutlined style={{ color: '#ef4444' }} /> },
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined style={{ fontSize: 18, color: '#94a3b8' }} />} />
          </Dropdown>
        );
      }
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#008080', // Teal
          colorBgContainer: '#ffffff',
          colorText: '#1e293b',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
        },
        components: {
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
            rowHoverBg: '#f1f5f9',
            headerSplitColor: 'transparent',
            cellPaddingBlock: 16,
            borderColor: '#e2e8f0'
          }
        }
      }}
    >
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
        
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>PBL5</Title>
              <Text type="secondary" style={{ fontSize: 14 }}>Hệ thống phân tích văn bản hành chính thông minh</Text>
            </div>
            <Space>
              <Button icon={<FilterOutlined />} style={{ fontWeight: 500, borderColor: '#cbd5e1' }}>Filter</Button>
              <Button type="primary" icon={<UploadOutlined />} style={{ backgroundColor: '#008080', fontWeight: 600 }} onClick={() => setIsUploadModalOpen(true)}>Upload Document</Button>
            </Space>
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px' }}>
          
          {/* BIG SEARCH BANNER (STUDOCU STYLE) */}
          <div style={{ 
            marginBottom: 40, 
            padding: '48px 24px', 
            background: 'linear-gradient(to right, #008080, #0f766e)', 
            borderRadius: 24, 
            textAlign: 'center',
            boxShadow: '0 10px 15px -3px rgba(0, 128, 128, 0.3)' 
          }}>
            <Title level={2} style={{ color: '#ffffff', margin: '0 0 24px 0', fontWeight: 700 }}>Bạn đang tìm kiếm tài liệu gì?</Title>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <Input.Search 
                placeholder="Nhập tên văn bằng, chứng chỉ hoặc từ khóa bạn muốn tìm kiếm..." 
                onSearch={(val) => setSearchQuery(val)}
                allowClear
                size="large"
                enterButton={<Button type="primary" size="large" style={{ backgroundColor: '#ffffff', color: '#008080', fontWeight: 600, border: 'none' }}>Tìm kiếm</Button>}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              {["📑 Bằng Đại học", "🇯🇵 Chứng chỉ JLPT", "🇬🇧 Chứng chỉ TOEIC", "🛡️ Chứng chỉ AWS"].map((tag, idx) => (
                <Button 
                  key={idx} 
                  shape="round" 
                  type="default" 
                  onClick={() => setSearchQuery(tag.split(' ').slice(1).join(' '))}
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 500 }}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Grid (REAL DATA) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
            <StatCard 
              label="Documents Overview" 
              value={analytics.totalDocs} 
              subtext="Tổng số tài liệu" 
              icon={FileTextOutlined} 
              color="#0f766e" bg="#ccfbf1"
              isLoading={isLoading}
            />
            <StatCard 
              label="Hoàn tất xử lý" 
              value={analytics.completed} 
              subtext="AI Analysis Done" 
              icon={CheckCircleOutlined} 
              color="#15803d" bg="#dcfce7" 
              isLoading={isLoading}
            />
            <StatCard 
              label="Nghi vấn (Suspicious)" 
              value={analytics.suspicious} 
              subtext="Cần kiểm tra lại" 
              icon={WarningOutlined} 
              color="#b45309" bg="#fef3c7" 
              isLoading={isLoading}
            />
            <StatCard 
              label="Lỗi trích xuất (Failed)" 
              value={analytics.failed} 
              subtext="Hệ thống từ chối" 
              icon={CloseCircleOutlined} 
              color="#b91c1c" bg="#fee2e2" 
              isLoading={isLoading}
            />
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* Timeline LineChart */}
            <Card title="Upload Trend (Timeline)" style={{ borderRadius: 16 }}>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.lineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Line type="monotone" dataKey="count" stroke="#008080" strokeWidth={3} dot={{r: 4, fill: '#008080', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Categories PieChart & AI Alert */}
            <Card title="Document Categories & AI Stats" style={{ borderRadius: 16 }}>
              <div style={{ height: 220, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={analytics.COLORS[index % analytics.COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: '12px 16px', background: '#fffbeb', borderLeft: '4px solid #d97706', borderRadius: 4 }}>
                  <Text strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <WarningFilled /> Cảnh báo dữ liệu (AI Statistics)
                  </Text>
                  <Text style={{ fontSize: 13, color: '#92400e', display: 'block', marginTop: 4 }}>
                    Hệ thống Database chưa phân tách log của lỗi OCR và lỗi Gemini Analysis. Hiện tại đang hiển thị Tỉ lệ trích xuất thành công toàn trình (Overall Extraction Rate): <b>{stats?.extraction_rate || 0}%</b>.
                  </Text>
                </div>
              </div>
            </Card>
          </div>

          {/* Documents and Activity Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-3">
            {/* Override grid with manual flex to ensure responsiveness matching tailwind lg:col-span-2 if class isn't parsed perfectly */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
              
              {/* Left Column: Documents Table */}
              <div style={{ flex: '2 1 600px', minWidth: 0 }}>
                <Card 
                  styles={{ body: { padding: 0 } }}
                  style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}
                >
                  <div style={{ borderBottom: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: 0 }}>Recent Documents</h2>
                    <Space>
                      {isAdmin && (
                        <Button 
                          type="primary" 
                          icon={<EyeOutlined />} 
                          onClick={() => router.push('/repository')}
                          disabled={!hasSuspicious}
                          style={{ 
                            borderRadius: 6, fontWeight: 600, 
                            backgroundColor: hasSuspicious ? '#008080' : '#cbd5e1',
                            boxShadow: hasSuspicious ? '0 4px 6px -1px rgba(0, 128, 128, 0.2)' : 'none' 
                          }}
                        >
                          Review Queue
                        </Button>
                      )}
                    </Space>
                  </div>
                  
                  {/* Tabs Logic nested inside Card */}
                  <div style={{ padding: '0 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 24, background: '#f8fafc' }}>
                    {TABS.map(tab => (
                      <div 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{ 
                          padding: '16px 4px', 
                          cursor: 'pointer',
                          borderBottom: activeTab === tab.key ? '2px solid #008080' : '2px solid transparent',
                          color: activeTab === tab.key ? '#008080' : '#64748b',
                          fontWeight: activeTab === tab.key ? 600 : 500,
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: 8,
                          marginBottom: -1
                        }}
                      >
                        {tab.label}
                        <Badge 
                          count={getTabCount(tab.key)} 
                          style={{ 
                            backgroundColor: activeTab === tab.key ? '#ccfbf1' : '#e2e8f0', 
                            color: activeTab === tab.key ? '#0f766e' : '#475569',
                            boxShadow: 'none',
                            fontWeight: 600
                          }} 
                        />
                      </div>
                    ))}
                  </div>

                  {isLoading ? (
                    <div style={{ padding: 24 }}><SkeletonTable rowCount={5} /></div>
                  ) : (
                    <Table 
                      columns={columns} 
                      dataSource={filteredDocs} 
                      rowKey="id" 
                      pagination={{
                        position: ['bottomRight'],
                        pageSize: 5,
                        showSizeChanger: false,
                        style: { padding: '16px 24px', margin: 0 }
                      }}
                      locale={{ 
                        emptyText: <Empty 
                          image={Empty.PRESENTED_IMAGE_SIMPLE} 
                          description={
                            activeTab === 'suspicious' ? "Không có tài liệu nào bị cảnh báo" :
                            activeTab === 'failed' ? "Tuyệt vời, không có lỗi xử lý nào" :
                            activeTab === 'processing' ? "Không có tài liệu nào đang xử lý" :
                            activeTab === 'verified' ? "Chưa có tài liệu nào được xác thực" :
                            "Không có tài liệu nào"
                          } 
                        /> 
                      }}
                    />
                  )}
                </Card>
              </div>

              {/* Right Column: Activity Sidebar */}
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <Card 
                  style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}
                  styles={{ body: { padding: 24 } }}
                >
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f172a', margin: '0 0 24px 0' }}>Recent Activity</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {recentActivity.length > 0 ? recentActivity.map((item: any) => (
                      <ActivityItem key={item.id} {...item} />
                    )) : (
                      <div style={{ padding: '24px 0', textAlign: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hoạt động nào" />
                      </div>
                    )}
                  </div>
                  
                  <Button type="default" block style={{ marginTop: 16, borderRadius: 8, fontWeight: 500, color: '#475569', borderColor: '#cbd5e1' }}>
                    View All Activity
                  </Button>
                </Card>
              </div>

            </div>
          </div>
          
          {/* CỘNG ĐỒNG: Tài liệu gợi ý */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{ margin: '0 0 24px 0', color: '#0f172a', fontSize: 24, fontWeight: 700 }}>💡 Tài liệu được tìm kiếm nhiều nhất theo ngành của bạn</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {isPublicLoading ? (
                <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center' }}><Spin /></div>
              ) : publicDocs.length > 0 ? (
                publicDocs.map((doc: any) => (
                  <Card 
                    key={doc.id} 
                    hoverable 
                    style={{ borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}
                    styles={{ body: { padding: 0 } }}
                    onClick={() => window.open(`/verify/${doc.public_token || doc.id}`, '_blank')}
                  >
                    <div style={{ height: 120, backgroundColor: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      {doc.category?.toUpperCase().includes('NHẬT') ? '🇯🇵' : 
                       doc.category?.toUpperCase().includes('ANH') ? '🇬🇧' : 
                       doc.category?.toUpperCase().includes('AWS') ? '☁️' : '📑'}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ marginBottom: 8 }}>
                        {doc.verification_status === 'VERIFIED' && <Tag color="#008080" style={{ borderRadius: 4, margin: 0, fontWeight: 600 }}>Verified by AI</Tag>}
                      </div>
                      <Title level={5} style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: 600, fontSize: 15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {doc.ai_results?.content_analysis?.title || doc.file_name}
                      </Title>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                          {doc.owner_name ? doc.owner_name.charAt(0) : 'A'}
                        </div>
                        <Text style={{ display: 'block', fontSize: 13, color: '#64748b' }}>Đóng góp bởi {doc.owner_name || 'Ẩn danh'}</Text>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center' }}>
                  <Empty description="Chưa có tài liệu cộng đồng nào được chia sẻ" />
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* Modals & Drawers */}
        <DocumentDetailDrawer 
          document={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={() => refetch()}
        />

        <UploadModalTeal 
          open={isUploadModalOpen}
          onCancel={() => !isUploading && setIsUploadModalOpen(false)}
          customRequest={handleUpload}
          isUploading={isUploading}
        />

      </div>
    </ConfigProvider>
  );
}
