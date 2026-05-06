'use client';
import { Typography, Card, Avatar, Button, Row, Col, Space, Divider, Form, Input, Statistic, message } from 'antd';
import { UserOutlined, SafetyCertificateFilled, WarningFilled, SettingOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const onUpdatePassword = async (values: any) => {
    setLoading(true);
    try {
      // Gọi API update password (tạm thời mock thành công)
      await new Promise(res => setTimeout(res, 1000));
      message.success('Cập nhật mật khẩu thành công!');
    } catch (e) {
      message.error('Lỗi khi cập nhật mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 48px', background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Title level={3} style={{ marginBottom: 24, fontWeight: 700, color: '#0f172a' }}>
        Hồ sơ cá nhân
      </Title>

      <Row gutter={[24, 24]}>
        {/* Cột trái: Thông tin & Đổi mật khẩu */}
        <Col xs={24} md={16}>
          <Card 
            title={<><UserOutlined style={{ marginRight: 8 }} /> Thông tin tài khoản</>}
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#008080' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{user?.full_name || 'Người dùng hệ thống'}</Title>
                <Text type="secondary">{user?.email}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag color={user?.role === 'admin' ? 'purple' : 'blue'}>
                    {user?.role?.toUpperCase()}
                  </Tag>
                </div>
              </div>
            </div>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}><KeyOutlined style={{ marginRight: 8 }}/> Đổi mật khẩu</Title>
            <Form layout="vertical" onFinish={onUpdatePassword}>
              <Form.Item label="Mật khẩu hiện tại" name="old_password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}>
                <Input.Password placeholder="••••••••" size="large" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Mật khẩu mới" name="new_password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}>
                    <Input.Password placeholder="••••••••" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Xác nhận mật khẩu mới" name="confirm_password" rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}>
                    <Input.Password placeholder="••••••••" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#008080', fontWeight: 600 }}>
                Cập nhật bảo mật
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Cột phải: Thống kê */}
        <Col xs={24} md={8}>
          <Card 
            title="Thống kê hoạt động"
            style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#166534', fontWeight: 600 }}>ĐÃ XÁC THỰC</Text>
                  <Title level={2} style={{ margin: 0, color: '#15803d' }}>142</Title>
                </div>
                <SafetyCertificateFilled style={{ fontSize: 40, color: '#22c55e', opacity: 0.8 }} />
              </div>

              <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text style={{ color: '#92400e', fontWeight: 600 }}>ĐÁNG NGỜ</Text>
                  <Title level={2} style={{ margin: 0, color: '#b45309' }}>18</Title>
                </div>
                <WarningFilled style={{ fontSize: 40, color: '#f59e0b', opacity: 0.8 }} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// Giả lập Import Tag cho component
import { Tag } from 'antd';
