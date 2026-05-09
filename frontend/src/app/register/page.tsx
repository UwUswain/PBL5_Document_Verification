'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const router = useRouter();

  const onFinish = async (values: any) => {
    setLoading(true);
    // Chuẩn bị payload đúng contract backend (không gửi confirmPassword)
    const payload = {
      email: values.email,
      password: values.password,
      full_name: values.full_name,
      phone_number: values.phone_number,
    };

    try {
      await docService.register(payload);
      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Đã có lỗi xảy ra khi đăng ký';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5] p-4">
      <Card className="w-full max-w-[450px] shadow-lg border-0">
        <div className="text-center mb-8">
          <Title level={3} className="m-0 text-[#1677ff] uppercase tracking-tight">Tạo tài khoản mới</Title>
          <Text className="text-[#8c8c8c]">Tham gia hệ thống quản lý văn bản PBL5</Text>
        </div>
        
        <Form
          name="register"
          layout="vertical"
          onFinish={onFinish}
          size="large"
          autoComplete="off"
        >
          <Form.Item
            label="Họ và tên"
            name="full_name"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="email@example.com" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone_number"
            rules={[
              { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải đúng 10 chữ số!' }
            ]}
          >
            <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0123456789" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item className="mt-8">
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full h-12 text-base font-semibold" 
              loading={loading}
              disabled={loading}
            >
              ĐĂNG KÝ NGAY
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text className="text-[#8c8c8c]">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-[#1677ff] font-medium hover:underline">
                Đăng nhập ngay
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
