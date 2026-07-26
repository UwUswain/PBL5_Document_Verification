'use client';
import React, { useState } from 'react';
import { 
  Drawer, Tag, Typography, theme, Row, Col, Space, Button, Alert 
} from 'antd';
import { 
  SearchOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  EditOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';
import { AutoZoomCard } from './AutoZoomCard';
import ManualCropModal from './ManualCropModal';

const { Title, Text } = Typography;

interface DocumentDetailDrawerProps {
  document: any;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void; // Callback để load lại dữ liệu sau khi verify
}
import { useAuth } from '@/providers/AuthProvider';

export function DocumentDetailDrawer({ document, open, onClose, onUpdate }: DocumentDetailDrawerProps) {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const isDarkMode = token.colorBgContainer === '#141414';

  if (!document) return null;

  const isSuspicious = document.verification_status === 'SUSPICIOUS';
  const isVerified = document.verification_status === 'VERIFIED';
  const isOwner = user?.id === document?.owner_id;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: token.colorText }}>{document.file_name}</span>
          <Space>
            <Tag color="blue" style={{ borderRadius: 4, fontWeight: 'bold', fontSize: 10 }}>
              {document.status?.toUpperCase()}
            </Tag>
            <Tag 
              color={isVerified ? 'success' : isSuspicious ? 'warning' : 'default'} 
              style={{ borderRadius: 4, fontWeight: 'bold', fontSize: 10 }}
              icon={isVerified ? <SafetyCertificateOutlined /> : undefined}
            >
              {(document.verification_status || 'PENDING').toUpperCase()}
            </Tag>
          </Space>
        </div>
      }
      width="95%"
      onClose={onClose}
      open={open}
      styles={{ body: { padding: 0, backgroundColor: token.colorBgLayout, overflow: 'hidden' } }}
      extra={
        <Space>
          {isSuspicious && isOwner && (
            <Button 
              type="primary" 
              danger 
              icon={<EditOutlined />} 
              onClick={() => setCropModalVisible(true)}
            >
              Xác thực thủ công
            </Button>
          )}
          <Button type="text" icon={<SearchOutlined />} />
        </Space>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* CỘT TRÁI: ẢNH GỐC / PDF */}
        <div style={{ 
          flex: 1, 
          background: isDarkMode ? '#1a1a1a' : '#f0f2f5', 
          padding: 40, 
          overflowY: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          borderRight: `1px solid ${token.colorBorderSecondary}`
        }}>
          <img 
            src={document.file_path ? (docService.getImageUrl(document.file_path) ?? '') : ''} 
            alt="Original" 
            style={{ 
              maxWidth: '100%', 
              borderRadius: 4, 
              boxShadow: isDarkMode ? '0 20px 50px rgba(0,0,0,0.8)' : '0 10px 30px rgba(0,0,0,0.1)',
              border: isDarkMode ? '1px solid #333' : '1px solid #ddd'
            }} 
          />
        </div>

        {/* CỘT PHẢI: AI ANALYSIS REPORT */}
        <div style={{ width: 500, padding: '32px 24px', overflowY: 'auto', background: token.colorBgContainer }}>
          <Space direction="vertical" size={32} style={{ width: '100%' }}>
            
            {isSuspicious && (
              <Alert
                message="Phát hiện nghi vấn"
                description="AI không tìm thấy con dấu hoặc chữ ký trên văn bản này. Vui lòng kiểm tra lại ảnh gốc hoặc sử dụng nút 'Xác thực thủ công' nếu AI đã bỏ sót."
                type="warning"
                showIcon
                action={
                  isOwner ? (
                    <Button size="small" type="primary" danger onClick={() => setCropModalVisible(true)}>
                      Xử lý ngay
                    </Button>
                  ) : null
                }
              />
            )}

            {/* Section 1: Phân loại */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>PHÂN LOẠI VĂN BẢN</Text>
                <Tag color="processing" bordered={false} style={{ fontSize: 10, fontWeight: 800 }}>AI ANALYZED</Tag>
              </div>
              <Title level={2} style={{ margin: '0 0 16px 0', fontWeight: 800 }}>{document.category?.toUpperCase() || 'KHÁC'}</Title>
              
              <div style={{ 
                padding: 16, 
                background: isDarkMode ? 'rgba(22, 119, 255, 0.1)' : '#e6f4ff', 
                borderRadius: 12, 
                border: `1px solid ${isDarkMode ? 'rgba(22, 119, 255, 0.2)' : '#91caff'}`,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#1677ff', fontWeight: 700, fontSize: 12 }}>
                  <RobotOutlined /> AI NHẬN ĐỊNH:
                </div>
                <Text italic style={{ color: isDarkMode ? '#aaa' : '#003a8c', fontSize: 13, lineHeight: 1.5 }}>
                  "{document.ai_results?.content_analysis?.insight || `Đây là văn bản ${document.category?.toLowerCase()} chính thức, đã qua phân tích và xác thực.`}"
                </Text>
              </div>
            </section>

            {/* Section 2: Thông tin trích xuất */}
            <section>
              <Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '1px' }}>
                <SearchOutlined style={{ color: '#1677ff' }} /> THÔNG TIN TRÍCH XUẤT
              </Title>
              <Row gutter={[24, 24]}>
                {document.ai_results?.content_analysis?.document_number && document.ai_results?.content_analysis?.document_number !== 'N/A' && (
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>SỐ HIỆU</Text>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{document.ai_results.content_analysis.document_number}</div>
                  </Col>
                )}
                {document.ai_results?.content_analysis?.issued_date && document.ai_results?.content_analysis?.issued_date !== 'N/A' && (
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>NGÀY BAN HÀNH</Text>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{document.ai_results.content_analysis.issued_date}</div>
                  </Col>
                )}
                {document.ai_results?.content_analysis?.issuer && document.ai_results?.content_analysis?.issuer !== 'N/A' && (
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: 11 }}>CƠ QUAN BAN HÀNH</Text>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{document.ai_results.content_analysis.issuer}</div>
                  </Col>
                )}
              </Row>
            </section>

            {/* Section 3: AI Trích xuất nội dung */}
            <section>
              <div style={{ padding: '20px 0', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                <Title level={5} style={{ color: '#1677ff', fontSize: 12, marginBottom: 24 }}>AI TRÍCH XUẤT NỘI DUNG</Title>
                
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 12, color: token.colorTextSecondary }}>TÓM TẮT THÔNG MINH</Text>
                  <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                    {document.summary || document.ai_results?.content_analysis?.summary_short}
                  </div>
                </div>

                {document.ai_results?.content_analysis?.main_points && document.ai_results.content_analysis.main_points.length > 0 && (
                  <div>
                    <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 12, color: token.colorTextSecondary }}>CÁC ĐIỂM CHÍNH</Text>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {document.ai_results.content_analysis.main_points.map((point: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                          <span style={{ fontSize: 13 }}>{point}</span>
                        </div>
                      ))}
                    </Space>
                  </div>
                )}
              </div>
            </section>

            {/* Section 4: Thực thể bóc tách */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={5} style={{ margin: 0, fontSize: 12, letterSpacing: '1px' }}>KHU VỰC KIỂM CHỨNG</Title>
                {isOwner && (
                  <Button 
                    size="small" 
                    type="link" 
                    icon={<EditOutlined />} 
                    onClick={() => setCropModalVisible(true)}
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    CẮT ẢNH THỦ CÔNG
                  </Button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <AutoZoomCard 
                  title="CHỮ KÝ" 
                  entity={document.ai_results?.vision_analysis?.entities?.find((e: any) => e.label === 'signature' || e.label === 'chu_ky')} 
                />
                <AutoZoomCard 
                  title="CON DẤU" 
                  entity={document.ai_results?.vision_analysis?.entities?.find((e: any) => e.label === 'seal' || e.label === 'con_dau')} 
                />
              </div>
            </section>

          </Space>
        </div>
      </div>

      {/* Manual Verification Modal */}
      <ManualCropModal
        visible={cropModalVisible}
        onCancel={() => setCropModalVisible(false)}
        onSuccess={() => {
          setCropModalVisible(false);
          if (onUpdate) onUpdate();
        }}
        documentId={document.id}
        imageUrl={document.file_path ? (docService.getImageUrl(document.file_path) ?? '') : ''}
      />
    </Drawer>
  );
}
