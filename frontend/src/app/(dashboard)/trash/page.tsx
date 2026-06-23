'use client';
import { useState } from 'react';
import { Table, Card, Button, Typography, Space, message, Popconfirm, Tag } from 'antd';
import { ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';

const { Title, Text } = Typography;

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: resData, isLoading } = useQuery({
    queryKey: ['trash', currentPage, pageSize],
    queryFn: () => docService.getTrashedDocs(pageSize, (currentPage - 1) * pageSize).then(res => res.data),
  });

  const docs = resData?.items || [];
  const totalDocs = resData?.meta?.total || 0;

  const restoreMutation = useMutation({
    mutationFn: (id: string) => docService.restoreDoc(id),
    onSuccess: () => {
      message.success('Khôi phục tài liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
    onError: () => message.error('Không thể khôi phục tài liệu này')
  });

  const deleteForceMutation = useMutation({
    mutationFn: (id: string) => docService.forceDeleteDoc(id),
    onSuccess: () => {
      message.success('Đã xóa vĩnh viễn tài liệu');
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
    onError: () => message.error('Không thể xóa vĩnh viễn tài liệu này')
  });

  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Thời gian xóa',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      render: (date: string) => date ? new Date(date).toLocaleString('vi-VN') : 'Không xác định'
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost
            icon={<ReloadOutlined />} 
            onClick={() => restoreMutation.mutate(record.id)}
            loading={restoreMutation.isPending}
          >
            Khôi phục
          </Button>
          
          <Popconfirm
            title="Xóa vĩnh viễn?"
            description="Tài liệu sẽ bị xóa hoàn toàn khỏi hệ thống."
            onConfirm={() => deleteForceMutation.mutate(record.id)}
            okText="Xóa luôn"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteForceMutation.isPending }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa vĩnh viễn</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Thùng rác (Recycle Bin)</Title>
        <Text type="secondary">Tài liệu đã xóa có thể được khôi phục hoặc xóa vĩnh viễn.</Text>
      </div>

      <Card bordered={false}>
        {isLoading ? (
          <SkeletonTable rowCount={5} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={docs} 
            rowKey="id" 
            locale={{ emptyText: <EmptyState description="Thùng rác trống" /> }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalDocs,
              onChange: (page, size) => { setCurrentPage(page); setPageSize(size); }
            }}
          />
        )}
      </Card>
    </div>
  );
}
