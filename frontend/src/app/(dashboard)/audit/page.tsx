'use client';
import { useState } from 'react';
import { Table, Card, Typography, Row, Col, Input, Select, DatePicker, Button, Space, Tag } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [filters, setFilters] = useState({
    user_email: '',
    action: '',
    date: null as string | null
  });
  
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const { data: resData, isLoading } = useQuery({
    queryKey: ['audit_logs', currentPage, pageSize, filters],
    queryFn: () => docService.getAuditLogs(
      pageSize, 
      (currentPage - 1) * pageSize,
      filters.user_email || undefined,
      filters.action || undefined,
      filters.date || undefined
    ).then(res => res.data),
  });

  const logs = resData?.items || [];
  const totalLogs = resData?.meta?.total || 0;

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const reset = { user_email: '', action: '', date: null };
    setTempFilters(reset);
    setFilters(reset);
    setCurrentPage(1);
  };

  const actionColors: Record<string, string> = {
    'LOGIN': 'green',
    'UPLOAD_DOCUMENT': 'blue',
    'DELETE_DOCUMENT': 'red',
    'RESTORE_DOCUMENT': 'cyan',
    'FORCE_DELETE_DOCUMENT': 'volcano',
    'CHANGE_PRIVACY': 'purple',
    'MOVE_DOCUMENT': 'orange'
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => <span style={{ color: '#64748b' }}>{new Date(date).toLocaleString('vi-VN')}</span>
    },
    {
      title: 'Người dùng',
      dataIndex: 'user_email',
      key: 'user_email',
      render: (email: string) => <Text strong>{email || 'System'}</Text>
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color={actionColors[action] || 'default'}>{action}</Tag>
    },
    {
      title: 'Tài liệu liên quan',
      dataIndex: 'document_name',
      key: 'document_name',
      render: (name: string, record: any) => name ? <Text>{name}</Text> : <Text type="secondary">N/A</Text>
    }
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Audit Logs</Title>
          <Text type="secondary">Lịch sử thao tác hệ thống</Text>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input 
              placeholder="Email người dùng..." 
              prefix={<SearchOutlined />}
              value={tempFilters.user_email}
              onChange={e => setTempFilters({...tempFilters, user_email: e.target.value})}
              onPressEnter={handleApplyFilters}
            />
          </Col>
          <Col span={6}>
            <Select 
              placeholder="Chọn hành động"
              value={tempFilters.action || undefined} 
              onChange={v => setTempFilters({...tempFilters, action: v})}
              style={{ width: '100%' }}
              allowClear
              options={[
                { value: 'LOGIN', label: 'Login' },
                { value: 'UPLOAD_DOCUMENT', label: 'Upload Document' },
                { value: 'DELETE_DOCUMENT', label: 'Soft Delete' },
                { value: 'RESTORE_DOCUMENT', label: 'Restore' },
                { value: 'FORCE_DELETE_DOCUMENT', label: 'Hard Delete' },
                { value: 'CHANGE_PRIVACY', label: 'Change Privacy' },
                { value: 'MOVE_DOCUMENT', label: 'Move Document' }
              ]}
            />
          </Col>
          <Col span={6}>
            <DatePicker 
              style={{ width: '100%' }} 
              placeholder="Chọn ngày"
              value={tempFilters.date ? dayjs(tempFilters.date) : null}
              onChange={(d, dateStr) => setTempFilters({...tempFilters, date: typeof dateStr === 'string' ? dateStr : ''})}
            />
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>Lọc</Button>
              <Button onClick={handleResetFilters}>Xóa bộ lọc</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false}>
        {isLoading ? (
          <SkeletonTable columns={4} rowCount={10} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={logs} 
            rowKey="id" 
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalLogs,
              showSizeChanger: true,
              pageSizeOptions: ['20', '50', '100'],
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
            locale={{ emptyText: <EmptyState description="Không có lịch sử thao tác nào" /> }}
          />
        )}
      </Card>
    </div>
  );
}
