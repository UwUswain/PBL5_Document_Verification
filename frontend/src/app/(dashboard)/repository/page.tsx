'use client';
import { useState } from 'react';
import { 
  Table, Card, Input, Button, Tag, Space, 
  Typography, message, Popconfirm, Tooltip, theme, Row, Col, Empty, Tabs
} from 'antd';
import { 
  SearchOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';

const { Title, Text } = Typography;

export default function RepositoryPage() {
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgContainer === '#141414'; // Simple check for AntD default dark bg
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docService.getDocs().then(res => res.data.items || []),
  });

  const docs = data || [];

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await docService.searchDocs(value);
      setSearchResults(res.data.results);
    } catch (e) {
      message.error("Lỗi tìm kiếm");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => docService.deleteDoc(id),
    onSuccess: () => {
      message.success('Xóa tài liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
    onError: () => message.error('Không thể xóa tài liệu này')
  });

  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>
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
      title: 'Ngày tải lên',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EyeOutlined />} 
              onClick={() => setSelectedDoc(record)} 
            />
          </Tooltip>
          
          <Popconfirm
            title="Xác nhận thực hiện?"
            description="Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể hoàn tác."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xác nhận"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button 
              danger 
              shape="circle" 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  let displayDocs = searchResults || docs;
  if (activeTab === 'foreign') {
    displayDocs = displayDocs.filter(d => d.file_name?.toLowerCase().includes('chứng chỉ') || d.file_name?.toLowerCase().includes('tiếng') || d.file_name?.toLowerCase().includes('ielts') || d.file_name?.toLowerCase().includes('toeic'));
  } else if (activeTab === 'award') {
    displayDocs = displayDocs.filter(d => d.file_name?.toLowerCase().includes('khen') || d.file_name?.toLowerCase().includes('giải'));
  }

  const tabItems = [
    { key: 'all', label: 'Tất cả văn bằng' },
    { key: 'foreign', label: 'Chứng chỉ ngoại ngữ' },
    { key: 'award', label: 'Bằng khen & Giải thưởng' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: token.colorText }}>Không gian của tôi (My Space)</Title>
        <Space>
          <Input.Search 
            placeholder="Tìm kiếm thông minh..." 
            onSearch={handleSearch}
            allowClear
            onChange={(e) => {
              if (!e.target.value) setSearchResults(null);
            }}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<UploadOutlined />}>Tải lên</Button>
        </Space>
      </div>

      <Card bordered={false}>
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }} />
        {isLoading ? (
          <SkeletonTable rowCount={8} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={displayDocs} 
            rowKey="id" 
            locale={{
              emptyText: <Empty description="Chưa có dữ liệu" />
            }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <DocumentDetailDrawer 
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdate={() => {
          refetch();
          // Update selectedDoc to show new data in drawer immediately
          if (selectedDoc) {
            docService.getDocs().then(res => {
              const updated = res.data.items?.find((d: any) => d.id === selectedDoc.id);
              if (updated) setSelectedDoc(updated);
            });
          }
        }}
      />
    </div>
  );
}

