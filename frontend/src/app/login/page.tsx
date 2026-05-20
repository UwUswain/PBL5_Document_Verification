'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, AppleFilled } from '@ant-design/icons';
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
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen bg-[#f8fafc]">
      {/* FRAME TRÁI: GIỚI THIỆU HỆ THỐNG */}
      <div className="hidden lg:flex flex-col justify-center items-start px-20 bg-gradient-to-br from-[#008080] to-[#0f766e] text-white">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 drop-shadow-sm">DOCUMIND PBL5</h1>
        <p className="text-xl font-medium mb-12 opacity-90">
          Nền tảng phân tích và quản lý văn bản hành chính thông minh.
        </p>
        
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="text-3xl bg-white/10 p-3 rounded-xl backdrop-blur-sm">🛡️</div>
            <div>
              <p className="text-lg font-medium opacity-90 m-0">Xác thực tính toàn vẹn văn bằng bằng SHA-256.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl bg-white/10 p-3 rounded-xl backdrop-blur-sm">🤖</div>
            <div>
              <p className="text-lg font-medium opacity-90 m-0">Tự động bóc tách thực thể thông minh với YOLOv8.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl bg-white/10 p-3 rounded-xl backdrop-blur-sm">📊</div>
            <div>
              <p className="text-lg font-medium opacity-90 m-0">Quản lý và chia sẻ không gian lưu trữ (My Space) tiện lợi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* FRAME PHẢI: FORM ĐĂNG NHẬP */}
      <div className="flex flex-col justify-center items-center p-6 bg-white relative">
        <Card 
          className="w-full max-w-[450px] border-0 sm:border sm:border-gray-200 sm:shadow-xl rounded-2xl overflow-hidden" 
          styles={{ body: { padding: '40px 32px' } }}
        >
          <div className="text-center mb-8">
            <Title level={2} className="m-0 font-bold text-gray-900 tracking-tight">Chào mừng bạn quay trở lại!</Title>
            <div className="text-gray-500 mt-2 text-base">Đăng nhập để truy cập không gian lưu trữ văn bằng của bạn</div>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <Button 
              size="large" 
              className="w-full flex items-center justify-center gap-2 rounded-full font-semibold text-gray-700 h-12 border-gray-300 shadow-sm"
              onClick={() => message.info("Tính năng đang được phát triển")}
            >
              <GoogleOutlined className="text-red-500 text-lg" /> Tiếp tục với Google
            </Button>
            <Button 
              size="large" 
              className="w-full flex items-center justify-center gap-2 rounded-full font-semibold text-gray-700 h-12 border-gray-300 shadow-sm"
              onClick={() => message.info("Tính năng đang được phát triển")}
            >
              <AppleFilled className="text-black text-lg" /> Tiếp tục với Apple
            </Button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-200 w-full absolute"></div>
            <div className="bg-white px-4 text-sm text-gray-400 relative z-10">hoặc tiếp tục với email</div>
          </div>
          
          <Form
            name="login"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="Tên đăng nhập" className="rounded-xl h-12" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Mật khẩu" className="rounded-xl h-12" />
            </Form.Item>

            <Form.Item className="mt-8 mb-4">
              <Button type="primary" htmlType="submit" className="w-full h-12 rounded-full bg-[#008080] hover:bg-[#0f766e] font-semibold text-base shadow-md border-0" loading={loading}>
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Typography.Text className="text-gray-500">
              Chưa có tài khoản?{' '}
              <a href="/register" className="text-[#008080] font-semibold hover:underline">
                Đăng ký ngay
              </a>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
