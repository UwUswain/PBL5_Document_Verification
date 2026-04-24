'use client';
import { useState } from 'react';
import { 
  Table, Card, Input, Button, Tag, Space, 
  Typography, message, Popconfirm, Tooltip, theme, Row, Col 
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

  const { data, isLoading } = useQuery({
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
      render: (cat: string) => <Tag color="blue">{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        status === 'verified' 
          ? <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag> 
          : <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>
      )
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
            title="Xóa tài liệu"
            description="Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
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

  const displayDocs = searchResults || docs;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: token.colorText }}>Kho tài liệu văn bản</Title>
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
        {isLoading ? (
          <SkeletonTable rowCount={8} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={displayDocs} 
            rowKey="id" 
            locale={{
              emptyText: (
                <EmptyState 
                  type={searchResults ? 'search' : 'docs'} 
                  onAction={() => {
                    // Trigger the same logic as the header upload button if needed, 
                    // or simply scroll to top/show a message. 
                    // In a real app, this might open the upload modal directly.
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )
            }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Document Detail Discovery */}
      <DocumentDetailDrawer 
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}

