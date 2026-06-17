'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined, AppleFilled, RobotOutlined, SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
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
      <div className="relative hidden lg:flex flex-col justify-center px-16 xl:px-24 bg-[#0b1120] text-white overflow-hidden">
        {/* Decorative Ambient Background */}
        <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-[#008080] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-[#0369a1] rounded-full mix-blend-screen filter blur-[120px] opacity-30"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-60"></div>
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8 shadow-2xl">
            <span className="flex h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping absolute"></span>
            <span className="flex h-2 w-2 rounded-full bg-[#2dd4bf]"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-teal-300 ml-2">Hệ thống đồ án PBL5</span>
          </div>
          
          <h1 className="text-6xl xl:text-7xl font-black tracking-tight mb-6 leading-tight">
            DOCU<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">MIND</span>
          </h1>
          
          <p className="text-lg xl:text-xl font-light mb-12 text-slate-300 leading-relaxed">
            Giải pháp toàn diện biến văn bản giấy thành dữ liệu tri thức. Tự động hóa trích xuất, tra cứu ngữ nghĩa và xác thực thông minh.
          </p>
          
          <div className="space-y-4">
            {[
              {
                icon: <RobotOutlined className="text-2xl text-teal-400" />,
                title: "Trích xuất thông minh",
                desc: "Số hóa tức thì với Tesseract OCR & Gemini AI."
              },
              {
                icon: <SearchOutlined className="text-2xl text-cyan-400" />,
                title: "Tra cứu ngữ nghĩa",
                desc: "Tìm kiếm siêu tốc theo ngữ cảnh cùng ChromaDB."
              },
              {
                icon: <SafetyCertificateOutlined className="text-2xl text-amber-400" />,
                title: "Xác thực toàn vẹn",
                desc: "Chống giả mạo tài liệu qua công nghệ QR Token."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group flex items-center gap-5 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-default">
                <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-black/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide mb-1">{feature.title}</h3>
                  <p className="text-slate-400 m-0 text-sm leading-snug">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FRAME PHẢI: FORM ĐĂNG NHẬP */}
      <div className="flex flex-col justify-center items-center p-6 lg:p-12 bg-[#f8fafc] relative overflow-hidden">
        {/* Subtle background decoration for right side */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>
        <div className="absolute bottom-0 left-[-10%] w-[40rem] h-[40rem] bg-cyan-50 rounded-full mix-blend-multiply filter blur-[80px] opacity-70"></div>

        <Card 
          className="w-full max-w-[420px] border-0 sm:border sm:border-white sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[2rem] bg-white/80 backdrop-blur-xl relative z-10" 
          styles={{ body: { padding: '48px 32px' } }}
        >
          <div className="text-center mb-8">
            <Title level={2} className="m-0 font-extrabold text-slate-800 tracking-tight">Đăng nhập</Title>
            <div className="text-slate-500 mt-2 text-base">Truy cập không gian lưu trữ văn bằng thông minh</div>
          </div>

          <div className="flex flex-col gap-3 mb-8">
            <Button 
              size="large" 
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-slate-600 h-12 border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
              onClick={() => message.info("Tính năng đang được phát triển")}
            >
              <GoogleOutlined className="text-red-500 text-lg" /> Tiếp tục với Google
            </Button>
            <Button 
              size="large" 
              className="w-full flex items-center justify-center gap-2 rounded-2xl font-semibold text-slate-600 h-12 border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
              onClick={() => message.info("Tính năng đang được phát triển")}
            >
              <AppleFilled className="text-slate-800 text-lg" /> Tiếp tục với Apple
            </Button>
          </div>

          <div className="relative flex items-center justify-center mb-8">
            <div className="border-t border-slate-200 w-full absolute"></div>
            <div className="bg-white/80 backdrop-blur-sm px-4 text-sm text-slate-400 font-medium relative z-10">hoặc bằng Email</div>
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
              <Input 
                prefix={<UserOutlined className="text-slate-400 mr-2" />} 
                placeholder="Tên đăng nhập" 
                className="rounded-xl h-12 bg-slate-50 border-slate-200 hover:border-teal-400 focus:border-teal-500 focus:bg-white transition-all text-base" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-slate-400 mr-2" />} 
                placeholder="Mật khẩu" 
                className="rounded-xl h-12 bg-slate-50 border-slate-200 hover:border-teal-400 focus:border-teal-500 focus:bg-white transition-all text-base" 
              />
            </Form.Item>

            <Form.Item className="mt-8 mb-6">
              <Button 
                type="primary" 
                htmlType="submit" 
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 font-bold text-base text-white shadow-[0_8px_20px_-6px_rgba(20,184,166,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(20,184,166,0.6)] border-0 transition-all" 
                loading={loading}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Typography.Text className="text-slate-500 text-sm">
              Chưa có tài khoản?{' '}
              <a href="/register" className="text-teal-600 font-bold hover:text-teal-500 transition-colors">
                Đăng ký ngay
              </a>
            </Typography.Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
