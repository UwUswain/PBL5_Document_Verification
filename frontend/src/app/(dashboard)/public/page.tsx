'use client';
import { useState } from 'react';
import { 
  Table, Card, Input, Button, Tag, Space, 
  Typography, Row, Col, Select, DatePicker, Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PublicRepositoryPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [filters, setFilters] = useState({
    keyword: '',
    category: 'all',
    owner: '',
    date: null as string | null
  });
  
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const { data: resData, isLoading } = useQuery({
    queryKey: ['public_docs', currentPage, pageSize, filters],
    queryFn: () => docService.getPublicDocs(
      pageSize, 
      (currentPage - 1) * pageSize,
      filters.category === 'all' ? undefined : filters.category,
      filters.owner || undefined,
      filters.date || undefined,
      filters.keyword || undefined
    ).then(res => res.data),
  });

  const docs = resData?.items || [];
  const totalDocs = resData?.meta?.total || 0;

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const reset = { keyword: '', category: 'all', owner: '', date: null };
    setTempFilters(reset);
    setFilters(reset);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Người chia sẻ (Owner)',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text: string) => <Tag color="purple">{text || 'Ẩn danh'}</Tag>
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Ngày công khai',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ color: '#64748b' }}>{new Date(date).toLocaleDateString('vi-VN')}</span>
    },
    {
      title: 'Thẩm định',
      key: 'verification',
      render: (_: any, record: any) => {
        const vStatus = record.verification_status;
        if (vStatus === 'VERIFIED') return <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag>;
        if (vStatus === 'SUSPICIOUS') return <Tag icon={<ClockCircleOutlined />} color="warning">Nghi vấn</Tag>;
        return <Tag color="default">Chờ xử lý</Tag>;
      }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết (Chỉ đọc)">
            <Button 
              type="text" 
              icon={<EyeOutlined style={{ color: '#0ea5e9' }} />} 
              onClick={() => setSelectedDoc(record)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Knowledge Repository
          </Title>
          <Text style={{ color: '#64748b', fontSize: 15, marginTop: 4, display: 'block' }}>
            Kho tài liệu công khai toàn hệ thống
          </Text>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input 
              placeholder="Tìm theo tên văn bản..." 
              prefix={<SearchOutlined />}
              value={tempFilters.keyword}
              onChange={e => setTempFilters({...tempFilters, keyword: e.target.value})}
              onPressEnter={handleApplyFilters}
            />
          </Col>
          <Col span={4}>
            <Select 
              value={tempFilters.category} 
              onChange={v => setTempFilters({...tempFilters, category: v})}
              style={{ width: '100%' }}
              options={[
                { value: 'all', label: 'Tất cả phân loại' },
                { value: 'chứng chỉ ngoại ngữ', label: 'Chứng chỉ ngoại ngữ' },
                { value: 'bằng tốt nghiệp', label: 'Bằng tốt nghiệp' },
                { value: 'khác', label: 'Khác' }
              ]}
            />
          </Col>
          <Col span={5}>
            <Input 
              placeholder="Người chia sẻ (Owner)" 
              value={tempFilters.owner}
              onChange={e => setTempFilters({...tempFilters, owner: e.target.value})}
              onPressEnter={handleApplyFilters}
            />
          </Col>
          <Col span={5}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Chọn ngày công khai"
              value={tempFilters.date ? dayjs(tempFilters.date) : null}
              onChange={(d, dateStr) => setTempFilters({...tempFilters, date: typeof dateStr === 'string' ? dateStr : ''})}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>Lọc</Button>
              <Button onClick={handleResetFilters}>Reset</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 16 }}>
        {isLoading ? (
          <SkeletonTable columns={6} rowCount={8} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={docs} 
            rowKey="id" 
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalDocs,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
            locale={{
              emptyText: <EmptyState type="empty" description="Không tìm thấy tài liệu công khai nào" />
            }}
          />
        )}
      </Card>

      <DocumentDetailDrawer 
        open={!!selectedDoc} 
        document={selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
      />
    </div>
  );
}
