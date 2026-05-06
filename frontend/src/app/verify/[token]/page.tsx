'use client';
import { useEffect, useState } from 'react';
import { Typography, Card, Tag, Space, Spin, Alert, Divider } from 'antd';
import { SafetyCertificateFilled, WarningFilled, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import { api } from '@/services/api';

const { Title, Text } = Typography;

export default function VerifyPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerifyData = async () => {
      try {
        const res = await api.get(`/docs/verify/${params.token}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Không tìm thấy dữ liệu xác thực.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerifyData();
  }, [params.token]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9' }}>
        <Spin size="large" tip="Đang truy xuất dữ liệu xác thực..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9' }}>
        <Alert 
          message="Lỗi Xác Thực" 
          description={error} 
          type="error" 
          showIcon 
          style={{ width: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        />
      </div>
    );
  }

  const isVerified = data.status === 'VERIFIED';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ color: '#0f172a', fontWeight: 800, marginBottom: 8 }}>
            DocuMind AI
          </Title>
          <Text type="secondary">Cổng Xác Thực Văn Bản Điện Tử</Text>
        </div>

        {/* Status Card */}
        <Card 
          style={{ 
            borderRadius: 16, 
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            border: isVerified ? '2px solid #22c55e' : '2px solid #f59e0b',
            marginBottom: 24,
            overflow: 'hidden'
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ 
            background: isVerified ? '#f0fdf4' : '#fffbeb',
            padding: '32px 24px',
            textAlign: 'center',
            borderBottom: '1px solid #e2e8f0'
          }}>
            {isVerified ? (
              <SafetyCertificateFilled style={{ fontSize: 64, color: '#22c55e', marginBottom: 16 }} />
            ) : (
              <WarningFilled style={{ fontSize: 64, color: '#f59e0b', marginBottom: 16 }} />
            )}
            
            <Title level={3} style={{ color: isVerified ? '#166534' : '#92400e', margin: '0 0 8px 0' }}>
              {isVerified ? 'VĂN BẢN ĐÃ ĐƯỢC XÁC THỰC BỞI DOCUMIND AI' : 'VĂN BẢN CÓ DẤU HIỆU ĐÁNG NGỜ'}
            </Title>
            <Text style={{ color: isVerified ? '#15803d' : '#b45309' }}>
              {isVerified 
                ? 'Hệ thống AI đã tìm thấy đầy đủ chữ ký và con dấu hợp lệ trên tài liệu này.' 
                : 'Hệ thống không thể tìm thấy chữ ký hoặc con dấu. Cần kiểm tra lại bản gốc.'}
            </Text>
          </div>

          <div style={{ padding: '24px 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}><CalendarOutlined /> NGÀY XÁC THỰC</Text>
                <Text strong>{new Date(data.created_at).toLocaleString('vi-VN')}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}><FileTextOutlined /> PHÂN LOẠI AI</Text>
                <Tag color="#008080" style={{ borderRadius: 4, fontWeight: 600 }}>
                  {data.ai_results?.nlp?.category?.toUpperCase() || 'KHÁC'}
                </Tag>
              </div>
            </div>
            
            <Divider style={{ margin: '24px 0' }} />
            
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8, fontWeight: 600 }}>NỘI DUNG RÚT GỌN (PREVIEW)</Text>
              <div style={{ 
                background: '#f8fafc', padding: 16, borderRadius: 8, 
                border: '1px dashed #cbd5e1', color: '#475569', fontSize: 13,
                fontFamily: 'monospace', whiteSpace: 'pre-wrap'
              }}>
                {data.raw_text}
              </div>
            </div>
          </div>
        </Card>

        {/* Vùng phát hiện AI */}
        {data.ai_results?.vision?.entities && data.ai_results.vision.entities.length > 0 && (
          <Card 
            title={<span style={{ color: '#0f172a', fontWeight: 700 }}>Vùng phát hiện (AI Crops)</span>}
            style={{ borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {data.ai_results.vision.entities.map((ent: any, idx: number) => (
                <div key={idx} style={{ 
                  border: '1px solid #e2e8f0', borderRadius: 8, padding: 12,
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <img 
                    src={ent.crop_url} 
                    alt={ent.label} 
                    style={{ maxWidth: '100%', height: 120, objectFit: 'contain', marginBottom: 12 }} 
                  />
                  <Tag color={ent.label === 'signature' || ent.label === 'chu_ky' ? 'blue' : 'red'}>
                    {ent.label.toUpperCase()}
                  </Tag>
                </div>
              ))}
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
