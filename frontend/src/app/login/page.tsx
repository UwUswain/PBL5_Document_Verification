'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/providers/AuthProvider';
import { useState } from 'react';

const { Title } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
    } catch (error) {
      message.error('Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ margin: 0, color: '#1677ff' }}>HỆ THỐNG PBL5</Title>
          <div style={{ color: '#8c8c8c' }}>Đăng nhập để quản lý văn bản</div>
        </div>
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              ĐĂNG NHẬP
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Typography.Text style={{ color: '#8c8c8c' }}>
            Chưa có tài khoản?{' '}
            <a href="/register" style={{ color: '#1677ff', fontWeight: 500 }}>
              Đăng ký ngay
            </a>
          </Typography.Text>
        </div>
      </Card>
    </div>
  );
}
