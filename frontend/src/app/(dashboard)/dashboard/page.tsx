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
  ThunderboltOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';

const { Title, Text } = Typography;

const COLORS = ['#1677ff', '#faad14', '#52c41a', '#ff4d4f', '#722ed1'];

export default function DashboardPage() {
  const { token } = theme.useToken();
  const [uploadingState, setUploadingState] = useState({ visible: false, step: 0 });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docService.getDocs().then(res => res.data.items || []),
  });

  const docs = data || [];
  const verifiedCount = docs.filter((d: any) => d.status === 'verified').length;
  const pendingCount = docs.filter((d: any) => d.status === 'pending').length;

  const categoryCount = docs.reduce((acc: any, doc: any) => {
    const cat = doc.category?.toUpperCase() || 'KHÁC';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploadingState({ visible: true, step: 0 });

    const timer1 = setTimeout(() => setUploadingState({ visible: true, step: 1 }), 800);
    const timer2 = setTimeout(() => setUploadingState({ visible: true, step: 2 }), 1800);
    const timer3 = setTimeout(() => setUploadingState({ visible: true, step: 3 }), 3000);

    try {
      await docService.upload(file);
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
      setUploadingState({ visible: true, step: 4 });
      message.success('Văn bản đã được AI phân tích thành công!');
      refetch();
      onSuccess('ok');
      setTimeout(() => setUploadingState({ visible: false, step: 0 }), 1500);
    } catch (e) {
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
      setUploadingState({ visible: false, step: 0 });
      message.error('Tải lên thất bại');
      onError(e);
    }
  };

  const uploadSteps = [
    { title: 'Scanning', description: 'Khử nhiễu ảnh', icon: <ScanOutlined /> },
    { title: 'Extraction', description: 'YOLO bóc tách', icon: <AimOutlined /> },
    { title: 'OCR Engine', description: 'Đọc chữ thô', icon: <SyncOutlined spin={uploadingState.step === 2} /> },
    { title: 'GenAI', description: 'Gemini hiểu nghĩa', icon: <RobotOutlined /> },
    { title: 'Hoàn tất', description: 'Lưu CSDL', icon: <CheckCircleOutlined /> }
  ];

  const columns = [
    { title: 'Tên văn bản', dataIndex: 'file_name', key: 'file_name', ellipsis: true },
    {
      title: 'Phân loại', dataIndex: 'category', key: 'category',
      render: (cat: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        status === 'verified' 
          ? <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag> 
          : <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Bảng điều khiển <span style={{ color: '#1677ff' }}>Hệ thống</span>
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Chào mừng bạn quay trở lại. Hôm nay hệ thống AI có gì mới?</Text>
        </div>
        <Upload customRequest={handleUpload} showUploadList={false} accept="image/*,.pdf">
          <Button type="primary" size="large" icon={<UploadOutlined />} style={{ borderRadius: 8, height: 48, padding: '0 24px', fontWeight: 600, boxShadow: '0 4px 12px rgba(22, 119, 255, 0.25)' }}>
            Tải lên văn bản mới
          </Button>
        </Upload>
      </div>

      {/* Bento Stats Grid */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col span={6}>
          <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(22, 119, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1677ff', fontSize: 24 }}>
                <FileTextOutlined />
              </div>
              <Statistic title={<Text type="secondary" strong>TỔNG VĂN BẢN</Text>} value={docs.length} valueStyle={{ fontWeight: 800, fontSize: 28 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(82, 196, 26, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52c41a', fontSize: 24 }}>
                <FileProtectOutlined />
              </div>
              <Statistic title={<Text type="secondary" strong>ĐÃ XÁC THỰC</Text>} value={verifiedCount} valueStyle={{ fontWeight: 800, fontSize: 28, color: '#52c41a' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} bodyStyle={{ padding: 24 }} style={{ borderRadius: 16, border: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(250, 173, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#faad14', fontSize: 24 }}>
                <ClockCircleOutlined />
              </div>
              <Statistic title={<Text type="secondary" strong>ĐANG XỬ LÝ</Text>} value={pendingCount} valueStyle={{ fontWeight: 800, fontSize: 28, color: '#faad14' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} bodyStyle={{ padding: 24, background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)' }} style={{ borderRadius: 16, boxShadow: '0 8px 24px rgba(22, 119, 255, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <ThunderboltOutlined />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.8 }}>AI PERFORMANCE</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>MẠNH MẼ</div>
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
              <EmptyState title="Chưa có dữ liệu" description="Hãy tải lên văn bản để xem thống kê phân loại." icon={false} />
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
                  emptyText: <EmptyState title="Chưa có văn bản" description="Các văn bản mới tải lên sẽ xuất hiện tại đây." />
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* AI Pipeline Modal */}
      <Modal 
        title={<div style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#1677ff' }}>AI PROCESSING PIPELINE</div>}
        open={uploadingState.visible} 
        closable={false} 
        footer={null}
        width={1000}
        centered
        bodyStyle={{ padding: '40px 60px' }}
      >
        <Steps current={uploadingState.step} items={uploadSteps} />
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
