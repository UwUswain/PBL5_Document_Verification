'use client';
import { useState } from 'react';
import { 
  Table, Card, Input, Button, Tag, Space, 
  Typography, message, Tooltip, theme, Row, Col, Tabs
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LockOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';

const { Title, Text } = Typography;

export default function SharedDocumentsPage() {
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgContainer === '#141414';
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: resData, isLoading } = useQuery({
    queryKey: ['shared_docs', currentPage, pageSize, searchQuery],
    queryFn: () => docService.getSharedDocs(pageSize, (currentPage - 1) * pageSize, searchQuery).then(res => res.data),
    refetchInterval: (query: any) => {
      const items = query.state.data?.items || [];
      const hasPending = items.some((doc: any) => !['COMPLETED', 'FAILED'].includes(doc.status?.toUpperCase()));
      return hasPending ? 5000 : false;
    }
  });

  const docs = resData?.items || [];
  const totalDocs = resData?.meta?.total || 0;

  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'owner_name',
      key: 'owner_name',
      render: (text: string) => <Tag icon={<TeamOutlined />} color="purple">{text || 'Ẩn danh'}</Tag>
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Ngày chia sẻ',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ color: '#64748b' }}>{new Date(date).toLocaleDateString('vi-VN')}</span>
    },
    {
      title: 'Quyền truy cập',
      key: 'privacy',
      render: (_: any, record: any) => {
        const privacy = record.ai_results?.privacy_level || 'PRIVATE';
        if (privacy === 'SHARED') return <Tag icon={<TeamOutlined />} color="cyan">Shared</Tag>;
        if (privacy === 'PUBLIC') return <Tag icon={<GlobalOutlined />} color="green">Public</Tag>;
        return <Tag icon={<LockOutlined />} color="default">Private</Tag>;
      }
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
      title: 'Hệ thống',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'COMPLETED' ? 'blue' : status === 'FAILED' ? 'error' : 'processing';
        return <Tag bordered={false} color={color}>{status?.toUpperCase() || 'PENDING'}</Tag>;
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
            Shared With Me
          </Title>
          <Text style={{ color: '#64748b', fontSize: 15, marginTop: 4, display: 'block' }}>
            Tài liệu bạn được cấp quyền xem từ người khác
          </Text>
        </Col>
        <Col>
          <Space>
            <Input 
              placeholder="Tìm kiếm tài liệu..." 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              onPressEnter={() => {
                setSearchQuery(tempSearch);
                setCurrentPage(1);
              }}
              style={{ width: 300, borderRadius: 8 }}
            />
            <Button type="primary" onClick={() => { setSearchQuery(tempSearch); setCurrentPage(1); }}>
              Tìm kiếm
            </Button>
          </Space>
        </Col>
      </Row>

      <Card 
        bordered={false} 
        style={{ 
          borderRadius: 16, 
          boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)',
          background: isDarkMode ? '#1f1f1f' : '#ffffff'
        }}
        bodyStyle={{ padding: '20px 24px' }}
      >
        <Tabs 
          activeKey="all" 
          items={[
            { key: 'all', label: 'Tất cả tài liệu được chia sẻ' }
          ]} 
        />
        
        <div style={{ marginTop: 16 }}>
          {isLoading ? (
             <SkeletonTable columns={5} rowCount={5} />
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
                emptyText: <EmptyState type="empty" description="Không có tài liệu nào được chia sẻ với bạn" />
              }}
              rowClassName={() => 'custom-table-row'}
              scroll={{ x: 800 }}
            />
          )}
        </div>
      </Card>

      <DocumentDetailDrawer 
        open={!!selectedDoc} 
        document={selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
      />
    </div>
  );
}
