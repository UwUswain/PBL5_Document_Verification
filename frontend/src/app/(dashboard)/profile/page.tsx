'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Avatar, Button, Row, Col, Space, Divider, Form, Input, 
  Tag, Skeleton, Modal, message, Badge 
} from 'antd';
import { 
  UserOutlined, SafetyCertificateFilled, WarningFilled, 
  EditOutlined, MailOutlined, PhoneOutlined, SafetyOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, UserProfileData } from '@/lib/services/user.service';
import { docService } from '@/services/api';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch complete user profile data
  const { data: userProfile, isLoading: isUserLoading, isError } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: userService.getCurrentUser,
    retry: 1,
  });

  // Handle unauthorized (401 is typically handled by interceptor, but as backup)
  useEffect(() => {
    if (isError) {
      message.error("Phiên đăng nhập đã hết hạn hoặc không có quyền truy cập");
      router.push('/login');
    }
  }, [isError, router]);

  // Fetch documents for statistics
  const { data: docsData, isLoading: isDocsLoading } = useQuery({
    queryKey: ['myDocsStats'],
    queryFn: () => docService.getDocs(100, 0).then(res => res.data.items || []),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UserProfileData) => userService.updateProfile(data),
    onSuccess: () => {
      message.success('Cập nhật thông tin thành công!');
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.detail || 'Đã có lỗi xảy ra khi cập nhật hồ sơ');
    }
  });

  const handleEditClick = () => {
    if (userProfile) {
      form.setFieldsValue({
        full_name: userProfile.full_name,
        phone_number: userProfile.phone_number,
        avatar_url: userProfile.avatar_url,
      });
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateSubmit = (values: UserProfileData) => {
    updateProfileMutation.mutate(values);
  };

  const stats = React.useMemo(() => {
    if (!docsData) return { verified: 0, suspicious: 0 };
    return {
      verified: docsData.filter((d: any) => d.verification_status?.toUpperCase() === 'VERIFIED').length,
      suspicious: docsData.filter((d: any) => d.verification_status?.toUpperCase() === 'SUSPICIOUS').length,
    };
  }, [docsData]);

  const isLoading = isUserLoading || isDocsLoading;
  const displayUser = userProfile || authUser;

  if (isLoading) {
    return (
      <div style={{ padding: '32px 48px', background: '#f1f5f9', minHeight: '100vh' }}>
        <Title level={3} style={{ marginBottom: 24 }}>Hồ sơ cá nhân</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton avatar={{ size: 80 }} active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 48px', background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
          Hồ sơ cá nhân
        </Title>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={handleEditClick}
          style={{ backgroundColor: '#008080', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 128, 128, 0.2)' }}
        >
          Chỉnh sửa hồ sơ
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: User Info */}
        <Col xs={24} md={16}>
          <Card 
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24, border: 'none' }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32 }}>
              <div style={{ position: 'relative' }}>
                {displayUser?.avatar_url ? (
                  <Avatar size={100} src={displayUser.avatar_url} style={{ border: '4px solid #f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                ) : (
                  <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#008080', border: '4px solid #f8fafc', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                )}
                {displayUser?.role === 'admin' && (
                  <Badge 
                    count={<SafetyOutlined style={{ color: '#fff', fontSize: 14 }} />} 
                    style={{ backgroundColor: '#7c3aed', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid #fff', position: 'absolute', bottom: 4, right: 4 }} 
                  />
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                    {displayUser?.full_name || 'Người dùng chưa cập nhật tên'}
                  </Title>
                  <Tag color={displayUser?.role === 'admin' ? '#f3e8ff' : '#ccfbf1'} style={{ color: displayUser?.role === 'admin' ? '#7c3aed' : '#0f766e', fontWeight: 600, border: 'none', padding: '4px 12px', borderRadius: 20 }}>
                    {displayUser?.role === 'admin' ? 'ADMIN' : 'USER'}
                  </Tag>
                </div>
                
                <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MailOutlined style={{ color: '#64748b', fontSize: 16 }} />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 600 }}>ĐỊA CHỈ EMAIL</Text>
                      <Text strong style={{ fontSize: 15, color: '#334155' }}>{displayUser?.email}</Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PhoneOutlined style={{ color: '#64748b', fontSize: 16 }} />
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 600 }}>SỐ ĐIỆN THOẠI</Text>
                      <Text strong style={{ fontSize: 15, color: '#334155' }}>{displayUser?.phone_number || 'Chưa cập nhật'}</Text>
                    </div>
                  </div>
                </Space>
              </div>
            </div>
          </Card>

          <Card 
            title={<><SafetyOutlined style={{ color: '#008080', marginRight: 8 }} /> Thiết lập Bảo mật</>}
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: 'none' }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
               <div>
                 <Title level={5} style={{ margin: 0, color: '#334155' }}>Mật khẩu đăng nhập</Title>
                 <Text type="secondary">Cập nhật mật khẩu thường xuyên để bảo vệ tài khoản</Text>
               </div>
               <Button style={{ borderRadius: 8 }}>Đổi mật khẩu</Button>
             </div>
             <Divider style={{ margin: '12px 0' }} />
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
               <div>
                 <Title level={5} style={{ margin: 0, color: '#334155' }}>Xác thực hai yếu tố (2FA)</Title>
                 <Text type="secondary">Bảo vệ tài khoản bằng mã xác nhận qua điện thoại</Text>
               </div>
               <Tag color="default">Sắp ra mắt</Tag>
             </div>
          </Card>
        </Col>

        {/* Right Column: Statistics */}
        <Col xs={24} md={8}>
          <Card 
            title={<span style={{ fontWeight: 700, color: '#0f172a' }}>Thống kê hệ thống</span>}
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: 'none' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ background: '#f0fdf4', padding: 24, borderRadius: 16, border: '1px solid #bbf7d0', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <Text style={{ color: '#166534', fontWeight: 700, letterSpacing: 0.5, fontSize: 13 }}>VĂN BẢN HỢP LỆ</Text>
                  <Title level={1} style={{ margin: '8px 0 0 0', color: '#15803d', fontWeight: 800 }}>{stats.verified}</Title>
                  <Text style={{ color: '#15803d', fontSize: 13 }}>Tài liệu đã qua kiểm duyệt AI</Text>
                </div>
                <SafetyCertificateFilled style={{ fontSize: 100, color: '#22c55e', opacity: 0.1, position: 'absolute', right: -10, bottom: -20, zIndex: 1 }} />
              </div>

              <div style={{ background: '#fffbeb', padding: 24, borderRadius: 16, border: '1px solid #fde68a', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <Text style={{ color: '#92400e', fontWeight: 700, letterSpacing: 0.5, fontSize: 13 }}>CÓ DẤU HIỆU ĐÁNG NGỜ</Text>
                  <Title level={1} style={{ margin: '8px 0 0 0', color: '#b45309', fontWeight: 800 }}>{stats.suspicious}</Title>
                  <Text style={{ color: '#b45309', fontSize: 13 }}>Cần xem xét thủ công</Text>
                </div>
                <WarningFilled style={{ fontSize: 100, color: '#f59e0b', opacity: 0.1, position: 'absolute', right: -10, bottom: -20, zIndex: 1 }} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>Chỉnh sửa thông tin cá nhân</span>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleUpdateSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item label={<span style={{ fontWeight: 600 }}>Email đăng nhập</span>}>
            <Input disabled value={displayUser?.email} style={{ borderRadius: 8, background: '#f8fafc' }} />
          </Form.Item>

          <Form.Item 
            label={<span style={{ fontWeight: 600 }}>Họ và tên</span>} 
            name="full_name" 
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item 
            label={<span style={{ fontWeight: 600 }}>Số điện thoại</span>} 
            name="phone_number"
          >
            <Input placeholder="0987654321" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item 
            label={<span style={{ fontWeight: 600 }}>Ảnh đại diện (URL)</span>} 
            name="avatar_url"
            extra="Nhập đường link hình ảnh (VD: https://imgur.com/...)"
          >
            <Input placeholder="https://..." size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          {/* Real-time avatar preview */}
          <Form.Item noStyle dependencies={['avatar_url']}>
            {({ getFieldValue }) => {
              const url = getFieldValue('avatar_url');
              if (!url) return null;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Xem trước:</Text>
                  <Avatar src={url} size={48} icon={<UserOutlined />} />
                </div>
              );
            }}
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
            <Button onClick={() => setIsEditModalOpen(false)} style={{ borderRadius: 8 }}>
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={updateProfileMutation.isPending}
              style={{ backgroundColor: '#008080', borderRadius: 8, fontWeight: 600 }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
