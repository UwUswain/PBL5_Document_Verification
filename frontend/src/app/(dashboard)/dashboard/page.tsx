'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Typography, Table, Tag, Button, Input, Dropdown, MenuProps, Space, Badge, ConfigProvider, Tooltip, notification 
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
  FileImageOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';
import { DocumentDetailDrawer } from '@/components/shared/DocumentDetailDrawer';
import { UploadModalTeal } from '@/components/dashboard/UploadModalTeal';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

// Mapping FSM Stages to UI
const STATUS_CONFIG: Record<string, { color: string, text: string, dot: string }> = {
  'RECEIVED': { color: 'default', text: 'Received', dot: '#94a3b8' },
  'PROCESSING': { color: 'processing', text: 'Processing', dot: '#3b82f6' },
  'OCR_DONE': { color: 'cyan', text: 'OCR Done', dot: '#06b6d4' },
  'ENRICHING': { color: 'warning', text: 'Enriching', dot: '#eab308' }, // Vàng đặc trưng
  'COMPLETED': { color: 'success', text: 'Completed', dot: '#22c55e' },
  'FAILED': { color: 'error', text: 'Failed', dot: '#ef4444' }
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'suspicious', label: 'Suspicious' },
  { key: 'processing', label: 'In workflow' },
  { key: 'failed', label: 'Rejected' }
];

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

  const docs = data || [];

  // Local Filtering
  const filteredDocs = docs.filter((doc: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'verified') return doc.verification_status?.toUpperCase() === 'VERIFIED';
    if (activeTab === 'suspicious') return doc.verification_status?.toUpperCase() === 'SUSPICIOUS';
    if (activeTab === 'processing') return !['COMPLETED', 'FAILED'].includes(doc.status?.toUpperCase());
    if (activeTab === 'failed') return doc.status?.toUpperCase() === 'FAILED';
    return true;
  });

  const getTabCount = (tabKey: string) => {
    if (tabKey === 'all') return docs.length;
    if (tabKey === 'verified') return docs.filter((d: any) => d.verification_status?.toUpperCase() === 'VERIFIED').length;
    if (tabKey === 'suspicious') return docs.filter((d: any) => d.verification_status?.toUpperCase() === 'SUSPICIOUS').length;
    if (tabKey === 'processing') return docs.filter((d: any) => !['COMPLETED', 'FAILED'].includes(d.status?.toUpperCase())).length;
    if (tabKey === 'failed') return docs.filter((d: any) => d.status?.toUpperCase() === 'FAILED').length;
    return 0;
  };
  
  const hasSuspicious = docs.some((d: any) => d.verification_status?.toUpperCase() === 'SUSPICIOUS');
  
  const formatCategory = (cat: string) => {
    if (!cat) return 'N/A';
    const upper = cat.toUpperCase();
    if (upper.startsWith('CÔN') || upper.startsWith('CON')) return 'Công văn';
    if (upper.startsWith('QUY')) return 'Quyết định';
    if (upper.startsWith('THÔ') || upper.startsWith('THO')) return 'Thông báo';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);
    try {
      await docService.upload(file);
      refetch();
      onSuccess('ok');
      // Tự động đóng modal sau khi upload xong 1 file
      setIsUploadModalOpen(false);
    } catch (e) {
      onError(e);
    } finally {
      setIsUploading(false);
    }
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG['RECEIVED'];
        return (
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 6, 
            padding: '4px 10px', borderRadius: 20, 
            border: `1px solid ${config.dot}40`,
            background: 'transparent'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: config.dot }} />
            <Text style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{config.text}</Text>
          </div>
        );
      }
    },
    {
      title: 'Document name',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: any) => (
        <Space>
          {text.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined style={{ color: '#ef4444' }} /> : <FileImageOutlined style={{ color: '#008080' }} />}
          <Text strong style={{ color: '#0f172a' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Details',
      key: 'details',
      width: 150,
      render: (_: any, record: any) => {
        const hasSeal = record.ai_results?.vision_analysis?.entities?.some((e: any) => e.label === 'con_dau' || e.label === 'seal');
        const hasSign = record.ai_results?.vision_analysis?.entities?.some((e: any) => e.label === 'signature' || e.label === 'chu_ky');
        
        return (
          <Space size="small">
            <Tooltip title={`Category: ${record.category || 'N/A'}`}>
              <Tag color="#f1f5f9" style={{ color: '#475569', margin: 0, border: 'none' }}>
                {formatCategory(record.category)}
              </Tag>
            </Tooltip>
            {hasSeal && <Tooltip title="Has Seal"><SafetyCertificateFilled style={{ color: '#f59e0b', fontSize: 16 }} /></Tooltip>}
            {hasSign && <Tooltip title="Has Signature"><EditFilled style={{ color: '#008080', fontSize: 16 }} /></Tooltip>}
          </Space>
        );
      }
    },
    {
      title: 'Document ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (id: string) => <Text style={{ fontFamily: 'monospace', color: '#64748b' }}>{id.split('-')[0]}</Text>
    },
    {
      title: 'Verification',
      dataIndex: 'verification_status',
      key: 'verification_status',
      width: 160,
      render: (vStatus: string, record: any) => {
        if (record.status !== 'COMPLETED') return <Text type="secondary">-</Text>;
        return vStatus === 'VERIFIED' 
          ? <Space><CheckCircleFilled style={{ color: '#22c55e' }} /><Text type="success" strong>Verified</Text></Space>
          : <Space><WarningFilled style={{ color: '#f59e0b' }} /><Text type="warning" strong>Suspicious</Text></Space>
      }
    },
    {
      title: 'Received at',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => {
        const d = new Date(date);
        return <Text style={{ color: '#475569' }}>{d.toLocaleDateString('vi-VN')} {d.getHours()}:{d.getMinutes().toString().padStart(2, '0')}</Text>;
      }
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_: any, record: any) => {
        const items: MenuProps['items'] = [
          { key: 'view', label: 'View Details', icon: <EyeOutlined />, onClick: () => setSelectedDoc(record) },
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
          colorText: '#334155',
          fontFamily: 'Inter, sans-serif',
        },
        components: {
          Table: {
            headerBg: 'transparent',
            headerColor: '#64748b',
            rowHoverBg: '#f8fafc',
            headerSplitColor: 'transparent',
            cellPaddingBlock: 16,
          }
        }
      }}
    >
      <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '32px 48px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
            Quản lý Văn bản <span style={{ fontSize: 14, color: '#94a3b8', verticalAlign: 'middle', marginLeft: 8 }}>▼</span>
          </Title>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, background: '#e2e8f0', padding: 4, borderRadius: 8 }}>
              <Button type="text" style={{ background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', borderRadius: 6, fontWeight: 600 }}>Documents</Button>
              <Button type="text" style={{ color: '#64748b', fontWeight: 600 }}>Emails</Button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e2e8f0', flex: 1, marginRight: 32 }}>
            {TABS.map(tab => (
              <div 
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{ 
                  padding: '8px 4px 16px', 
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.key ? '2px solid #008080' : '2px solid transparent',
                  color: activeTab === tab.key ? '#008080' : '#64748b',
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                {tab.label}
                <Badge 
                  count={getTabCount(tab.key)} 
                  style={{ 
                    backgroundColor: activeTab === tab.key ? '#008080' : '#e2e8f0', 
                    color: activeTab === tab.key ? '#fff' : '#64748b',
                    boxShadow: 'none'
                  }} 
                />
              </div>
            ))}
          </div>

          {/* Tools & Buttons */}
          <Space size="middle">
            <Input.Search 
              placeholder="Search..." 
              onSearch={(val) => setSearchQuery(val)}
              allowClear
              enterButton={
                <Button type="primary" style={{ backgroundColor: '#008080' }}>
                  <SearchOutlined />
                </Button>
              }
              style={{ borderRadius: 8, width: 250 }}
            />
            <Button type="text" icon={<FilterOutlined />} style={{ color: '#64748b' }} onClick={() => notification.info({ message: 'Đang mở Filter', description: 'Tính năng lọc nâng cao đang được phát triển.' })} />
            <Button type="text" icon={<SettingOutlined />} style={{ color: '#64748b' }} onClick={() => notification.info({ message: 'Settings', description: 'Cài đặt bảng dữ liệu đang được phát triển.' })} />
            <Button 
              type="default" 
              onClick={() => setIsUploadModalOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600, borderColor: '#cbd5e1', color: '#334155' }}
            >
              Upload
            </Button>
            {isAdmin && (
              <Button 
                type="primary" 
                icon={<EyeOutlined />} 
                onClick={() => router.push('/repository')}
                disabled={!hasSuspicious}
                style={{ 
                  borderRadius: 8, fontWeight: 600, 
                  backgroundColor: hasSuspicious ? '#008080' : '#cbd5e1',
                  boxShadow: hasSuspicious ? '0 4px 6px -1px rgba(0, 128, 128, 0.2)' : 'none' 
                }}
              >
                Review
              </Button>
            )}
          </Space>
        </div>

        {/* Table Area */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '8px 24px 24px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
            <Button type="text" icon={<span style={{ fontSize: 18 }}>⊕</span>} style={{ fontWeight: 600, color: '#0f172a', padding: 0 }}>
              Add filter
            </Button>
            <Button type="text" style={{ color: '#64748b' }}>Clear filters</Button>
          </div>

          {isLoading ? (
            <SkeletonTable rowCount={5} />
          ) : (
            <Table 
              rowSelection={{ type: 'checkbox' }}
              columns={columns} 
              dataSource={filteredDocs} 
              rowKey="id" 
              pagination={{
                position: ['bottomRight'],
                pageSize: 8,
                showSizeChanger: false,
                itemRender: (_, type, originalElement) => {
                  if (type === 'prev') return <a>&lt;</a>;
                  if (type === 'next') return <a>&gt;</a>;
                  return originalElement;
                }
              }}
            />
          )}
        </div>

        {/* Document Detail Drawer */}
        <DocumentDetailDrawer 
          document={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={() => refetch()}
        />

        {/* Upload Modal */}
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
