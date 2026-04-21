'use client';

import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Table, Typography, Tag, Upload, Button, message } from 'antd';
import { FileProtectOutlined, ClockCircleOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';

const { Title } = Typography;

const COLORS = ['#1677ff', '#ff4d4f', '#52c41a', '#faad14', '#722ed1'];

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docService.getDocs().then(res => res.data.items || []),
  });

  const docs = data || [];
  const verifiedCount = docs.filter((d: any) => d.status === 'verified').length;
  const pendingCount = docs.filter((d: any) => d.status === 'pending').length;

  // Tính toán dữ liệu cho PieChart
  const categoryCount = docs.reduce((acc: any, doc: any) => {
    const cat = doc.category?.toUpperCase() || 'KHÁC';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(categoryCount).map(key => ({ name: key, value: categoryCount[key] }));

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      await docService.upload(file);
      message.success('Tải lên thành công');
      refetch();
      onSuccess('ok');
    } catch (e) {
      message.error('Tải lên thất bại');
      onError(e);
    }
  };

  const columns = [
    { title: 'Tên văn bản', dataIndex: 'file_name', key: 'file_name', ellipsis: true },
    {
      title: 'Phân loại', dataIndex: 'category', key: 'category',
      render: (cat: string) => {
        const c = cat?.toLowerCase() || '';
        let color = 'default';
        if (c.includes('quyết định')) color = 'red';
        else if (c.includes('công văn')) color = 'blue';
        else if (c.includes('hợp đồng')) color = 'green';
        else if (c.includes('đơn từ')) color = 'gold';
        return <Tag color={color}>{cat?.toUpperCase() || 'KHÁC'}</Tag>;
      }
    },
    {
      title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        status === 'verified' 
          ? <Tag icon={<FileProtectOutlined />} color="success">Đã xác thực</Tag> 
          : <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Tổng quan hệ thống</Title>
        <Upload customRequest={handleUpload} showUploadList={false} accept="image/*,.pdf">
          <Button type="primary" icon={<UploadOutlined />}>Tải lên văn bản</Button>
        </Upload>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false}><Statistic title="Tổng số văn bản" value={docs.length} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}><Statistic title="Đã xác thực" value={verifiedCount} prefix={<FileProtectOutlined />} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col span={8}>
          <Card bordered={false}><Statistic title="Đang chờ xử lý" value={pendingCount} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="Phân loại tự động" bordered={false} style={{ height: '100%' }}>
            {chartData.length > 0 ? (
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chưa có dữ liệu</div>}
          </Card>
        </Col>
        <Col span={16}>
          <Card title="Văn bản gần đây" bordered={false} style={{ height: '100%' }}>
            {isLoading ? (
              <SkeletonTable rowCount={5} />
            ) : (
              <Table columns={columns} dataSource={docs.slice(0, 5)} rowKey="id" pagination={false} size="middle" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
