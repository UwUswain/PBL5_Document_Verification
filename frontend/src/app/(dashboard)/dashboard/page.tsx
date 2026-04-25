'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Table, Typography, Tag, Upload, Button, message, Modal, Steps, Space, theme } from 'antd';
import { 
  FileProtectOutlined, 
  ClockCircleOutlined, 
  FileTextOutlined, 
  UploadOutlined, 
  ScanOutlined, 
  AimOutlined, 
  SyncOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  InboxOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';

const { Title, Text } = Typography;

const COLORS = ['#1677ff', '#faad14', '#52c41a', '#ff4d4f', '#722ed1'];

export default function DashboardPage() {
  const { token } = theme.useToken();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docService.getDocs().then(res => res.data.items || []),
  });

  const docs = data || [];
  const verifiedCount = docs.filter((d: any) => d.verification_status === 'VERIFIED').length;
  const suspiciousCount = docs.filter((d: any) => d.verification_status === 'SUSPICIOUS').length;
  
  const processedToday = docs.filter((d: any) => {
    const today = new Date();
    const docDate = new Date(d.created_at);
    return docDate.getDate() === today.getDate() &&
           docDate.getMonth() === today.getMonth() &&
           docDate.getFullYear() === today.getFullYear();
  }).length;

  const categoryCount = docs.reduce((acc: any, doc: any) => {
    const cat = doc.category?.toUpperCase() || 'KHÁC';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);
    try {
      await docService.upload(file);
      message.success('Văn bản đã được AI phân tích thành công!');
      refetch();
      onSuccess('ok');
    } catch (e) {
      message.error('Tải lên thất bại. Vui lòng thử lại.');
      onError(e);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadSteps = [
    { title: 'Scanning', description: 'Khử nhiễu ảnh', icon: <ScanOutlined />, status: 'process' as const },
    { title: 'Extraction', description: 'Bóc tách vùng văn bản', icon: <AimOutlined />, status: 'process' as const },
    { title: 'OCR Engine', description: 'Đọc chữ thô', icon: <SyncOutlined spin />, status: 'process' as const },
    { title: 'GenAI', description: 'Gemini phân tích ngữ nghĩa', icon: <RobotOutlined />, status: 'process' as const },
    { title: 'Lưu CSDL', description: 'Hoàn tất', icon: <CheckCircleOutlined />, status: 'process' as const },
  ];

  const columns = [
    { title: 'Tên văn bản', dataIndex: 'file_name', key: 'file_name', ellipsis: true },
    {
      title: 'Phân loại', dataIndex: 'category', key: 'category',
      render: (cat: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Thẩm định', dataIndex: 'verification_status', key: 'verification_status',
      render: (vStatus: string) => (
        vStatus === 'VERIFIED' 
          ? <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag> 
          : vStatus === 'SUSPICIOUS' 
            ? <Tag icon={<ClockCircleOutlined />} color="warning">Nghi vấn</Tag>
            : <Tag color="default">Chờ xử lý</Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />} 
          onClick={() => setSelectedDoc(record)}
        >
          Xem
        </Button>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header & Quick Action */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>
            PBL <span style={{ color: '#2563eb' }}>5</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Phân loại, tóm tắt, tìm kiếm văn bản scan sử dụng AI</Text>
        </div>
        
        <div style={{ flex: '1 1 400px', maxWidth: 600 }}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '12px 16px' }}
            style={{ 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              background: '#fff'
            }}
          >
            <Upload.Dragger 
              customRequest={handleUpload} 
              showUploadList={false} 
              accept="image/*,.pdf"
              style={{ background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '4px 8px' }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 8, 
                  background: '#eff6ff', color: '#2563eb', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>
                  <UploadOutlined />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <Text strong style={{ display: 'block', fontSize: 14 }}>Quick Upload</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Drop files here or click to scan documents</Text>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tag style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>PDF</Tag>
                  <Tag style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>IMG</Tag>
                </div>
              </div>
            </Upload.Dragger>
          </Card>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '20px 24px' }} 
            style={{ 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text type="secondary" strong style={{ fontSize: 13, letterSpacing: '0.025em' }}>INDEXED DOCUMENTS</Text>
                <div style={{ color: '#64748b', fontSize: 20 }}><FileTextOutlined /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{docs.length}</span>
                <Text type="secondary" style={{ fontSize: 12 }}>files</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '20px 24px' }} 
            style={{ 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text type="secondary" strong style={{ fontSize: 13, letterSpacing: '0.025em' }}>VERIFIED</Text>
                <div style={{ color: '#10b981', fontSize: 20 }}><FileProtectOutlined /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{verifiedCount}</span>
                <Text type="success" style={{ fontSize: 12 }}>hợp lệ</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '20px 24px' }} 
            style={{ 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text type="secondary" strong style={{ fontSize: 13, letterSpacing: '0.025em' }}>SUSPICIOUS</Text>
                <div style={{ color: '#f59e0b', fontSize: 20 }}><ClockCircleOutlined /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{suspiciousCount}</span>
                <Text type="warning" style={{ fontSize: 12 }}>nghi vấn</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            bordered={false} 
            bodyStyle={{ padding: '20px 24px' }} 
            style={{ 
              borderRadius: 12, 
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text type="secondary" strong style={{ fontSize: 13, letterSpacing: '0.025em' }}>PROCESSED TODAY</Text>
                <div style={{ color: '#2563eb', fontSize: 20 }}><BarChartOutlined /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{processedToday}</span>
                <Text style={{ fontSize: 12, color: '#64748b' }}>hôm nay</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Content Sections */}
      <Row gutter={[24, 24]}>
        <Col span={10}>
          <Card 
            title={<Space><PieChart style={{ color: '#1677ff' }} /> <span style={{ fontWeight: 700 }}>Phân loại tự động</span></Space>} 
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}
          >
            {chartData.length > 0 ? (
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" iconType="circle" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState transparent title="Chưa có dữ liệu" description="Hãy tải lên văn bản để xem thống kê phân loại." icon={false} />
            )}
          </Card>
        </Col>
        <Col span={14}>
          <Card 
            title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /> <span style={{ fontWeight: 700 }}>Văn bản xử lý gần đây</span></Space>} 
            extra={<Button type="link" style={{ fontWeight: 600 }}>Xem tất cả <ArrowRightOutlined /></Button>}
            bordered={false} 
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}
          >
            {isLoading ? (
              <SkeletonTable rowCount={5} />
            ) : (
              <Table 
                columns={columns} 
                dataSource={docs.slice(0, 6)} 
                rowKey="id" 
                pagination={false} 
                size="middle"
                locale={{
                  emptyText: <EmptyState transparent onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Chưa có văn bản" description="Các văn bản mới tải lên sẽ xuất hiện tại đây." />
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer 
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdate={() => {
          refetch();
          if (selectedDoc) {
            docService.getDocs().then(res => {
              const updated = res.data.items?.find((d: any) => d.id === selectedDoc.id);
              if (updated) setSelectedDoc(updated);
            });
          }
        }}
      />

      {/* AI Pipeline Modal */}
      <Modal 
        title={<div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#1677ff' }}>AI PROCESSING PIPELINE</div>}
        open={isUploading} 
        closable={false} 
        footer={null}
        width={1000}
        centered
        styles={{ body: { padding: '40px 60px' } }}
      >
        <Steps items={uploadSteps} />
        <div style={{ textAlign: 'center', color: '#8c8c8c', marginTop: 32, fontSize: 15 }}>
          <Space>
            <SyncOutlined spin />
            <span>Đang sử dụng <Text strong>Gemini 1.5 Flash</Text> & <Text strong>PaddleOCR</Text> để phân tích ngữ nghĩa...</span>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
