'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Switch, message, Typography, Empty } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import { useState } from 'react';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  // Bảo vệ route phía Client
  if (currentUser && currentUser.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => docService.adminGetAllUsers().then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => docService.adminUpdateUser(id, data),
    onSuccess: () => {
      message.success('Cập nhật người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setIsModalOpen(false);
    },
    onError: () => message.error('Có lỗi xảy ra khi cập nhật')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => docService.adminDeleteUser(id),
    onSuccess: () => {
      message.success('Đã xóa người dùng');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
    onError: () => message.error('Không thể xóa người dùng này')
  });

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Họ và tên', dataIndex: 'full_name', key: 'full_name', render: (text: string) => text || 'Chưa cập nhật' },
    {
      title: 'Vai trò', dataIndex: 'role', key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'volcano' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active',
      render: (active: boolean) => (
        active 
          ? <Tag color="success">ĐANG HOẠT ĐỘNG</Tag> 
          : <Tag color="error">ĐÃ KHÓA</Tag>
      )
    },
    {
      title: 'Ngày tham gia', dataIndex: 'created_at', key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          >
            Sửa
          </Button>
          <Button 
            danger 
            icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => updateMutation.mutate({ id: record.id, data: { is_active: !record.is_active } })}
          >
            {record.is_active ? 'Khóa' : 'Mở khóa'}
          </Button>
        </Space>
      )
    }
  ];

  const handleUpdate = (values: any) => {
    updateMutation.mutate({ id: editingUser.id, data: values });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            <Title level={4} style={{ margin: 0 }}>Quản lý người dùng hệ thống</Title>
          </Space>
        }
        bordered={false}
      >
        {isLoading ? (
          <SkeletonTable rowCount={5} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={users} 
            rowKey="id" 
            locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="Chỉnh sửa người dùng"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="full_name" label="Họ và tên">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò">
            <Select>
              <Select.Option value="user">USER</Select.Option>
              <Select.Option value="admin">ADMIN</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái hoạt động" valuePropName="checked">
            <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
