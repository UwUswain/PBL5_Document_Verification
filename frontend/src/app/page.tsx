'use client';

import { Button, Typography, Space, Row, Col, Badge, Card } from 'antd';
import { 
  ArrowRightOutlined, 
  ThunderboltOutlined, 
  SafetyCertificateOutlined, 
  RobotOutlined, 
  FileSearchOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

const { Title, Text } = Typography;

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000', 
      color: '#fff', 
      overflowX: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Hero Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '600px',
        background: 'radial-gradient(circle at 50% 50%, rgba(22, 119, 255, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Navbar */}
      <div style={{ 
        padding: '24px 60px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 10, 
            background: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <RobotOutlined style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>DOCU<span style={{ color: '#1677ff' }}>MIND</span></span>
        </div>
        <Space size="large">
          <Button type="text" style={{ color: '#fff' }}>Tính năng</Button>
          <Button type="text" style={{ color: '#fff' }}>Bảng giá</Button>
          <Button 
            type="primary" 
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
            style={{ borderRadius: 8, height: 40, fontWeight: 600 }}
          >
            {isAuthenticated ? 'Vào Dashboard' : 'Đăng nhập'}
          </Button>
        </Space>
      </div>

      {/* Hero Section */}
      <div style={{ 
        padding: '100px 60px', 
        textAlign: 'center', 
        position: 'relative', 
        zIndex: 1 
      }}>
        <Badge 
          count="AI Document Analysis v2.0" 
          style={{ 
            backgroundColor: 'rgba(22, 119, 255, 0.1)', 
            color: '#1677ff', 
            border: '1px solid rgba(22, 119, 255, 0.3)',
            padding: '4px 12px',
            borderRadius: 20,
            marginBottom: 24
          }} 
        />
        <Title style={{ 
          color: '#fff', 
          fontSize: '72px', 
          fontWeight: 900, 
          letterSpacing: '-2px',
          lineHeight: 1.1,
          maxWidth: 900,
          margin: '0 auto 24px'
        }}>
          Biến văn bản thô thành <span style={{ color: '#1677ff' }}>Dữ liệu thông minh</span>
        </Title>
        <Text style={{ 
          color: 'rgba(255,255,255,0.6)', 
          fontSize: '22px', 
          maxWidth: 700, 
          display: 'block', 
          margin: '0 auto 48px',
          lineHeight: 1.6
        }}>
          Hệ thống xác thực văn bản dựa trên AI, bóc tách dữ liệu tự động với độ chính xác 99% nhờ sức mạnh của Gemini 1.5 Flash.
        </Text>

        <Space size="middle">
          <Button 
            type="primary" 
            size="large" 
            onClick={() => router.push('/dashboard')}
            style={{ 
              height: 56, 
              padding: '0 40px', 
              borderRadius: 12, 
              fontSize: 18, 
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(22, 119, 255, 0.3)'
            }}
          >
            Thử nghiệm ngay <ArrowRightOutlined />
          </Button>
          <Button 
            size="large" 
            ghost
            icon={<PlayCircleOutlined />}
            style={{ 
              height: 56, 
              padding: '0 40px', 
              borderRadius: 12, 
              fontSize: 18, 
              fontWeight: 700,
              border: '2px solid rgba(255,255,255,0.1)'
            }}
          >
            Xem Demo
          </Button>
        </Space>

        {/* Dashboard Preview Overlay */}
        <div style={{ 
          marginTop: 80, 
          borderRadius: 24, 
          border: '1px solid rgba(255,255,255,0.1)',
          padding: 12,
          background: 'rgba(255,255,255,0.05)',
          maxWidth: 1100,
          margin: '80px auto 0',
          boxShadow: '0 40px 100px rgba(0,0,0,0.5)'
        }}>
          <img 
            src="https://images.unsplash.com/photo-1551288049-bbda48652ad8?q=80&w=2070&auto=format&fit=crop" 
            alt="Dashboard Preview" 
            style={{ width: '100%', borderRadius: 16, opacity: 0.8 }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div style={{ padding: '120px 60px', backgroundColor: '#050505' }}>
        <Row gutter={[48, 48]} style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Col span={8}>
            <Card bordered={false} style={{ background: 'transparent' }} bodyStyle={{ padding: 0 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: 'rgba(22, 119, 255, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1677ff', fontSize: 28, marginBottom: 24
              }}>
                <ThunderboltOutlined />
              </div>
              <Title level={3} style={{ color: '#fff', marginBottom: 16 }}>Phân tích Tức thì</Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
                Xử lý hàng nghìn văn bản trong vài giây với kiến trúc xử lý song song hiện đại nhất.
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} style={{ background: 'transparent' }} bodyStyle={{ padding: 0 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: 'rgba(82, 196, 26, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#52c41a', fontSize: 28, marginBottom: 24
              }}>
                <SafetyCertificateOutlined />
              </div>
              <Title level={3} style={{ color: '#fff', marginBottom: 16 }}>Độ tin cậy Cao</Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
                Công nghệ OCR Paddle kết hợp Gemini giúp xác thực tính chính xác của con dấu và chữ ký.
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card bordered={false} style={{ background: 'transparent' }} bodyStyle={{ padding: 0 }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: 'rgba(114, 46, 209, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#722ed1', fontSize: 28, marginBottom: 24
              }}>
                <FileSearchOutlined />
              </div>
              <Title level={3} style={{ color: '#fff', marginBottom: 16 }}>Tìm kiếm Thông minh</Title>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>
                Không chỉ tìm theo tên, hệ thống hiểu nội dung văn bản để đưa ra kết quả chính xác nhất.
              </Text>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Footer */}
      <div style={{ padding: '80px 60px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Text style={{ color: 'rgba(255,255,255,0.3)' }}>© 2026 DOCUMIND AI. Developed for PBL5 BKDN.</Text>
      </div>
    </div>
  );
}
