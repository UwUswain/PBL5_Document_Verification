'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Typography, Card, Tag, Row, Col, Space, Spin, Button, Steps, QRCode, Divider, Result 
} from 'antd';
import { 
  ArrowLeftOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  QrcodeOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';

const { Title, Text, Paragraph } = Typography;

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;

  const { data: document, isLoading, isError } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => docService.getDocById(docId).then(res => res.data),
    enabled: !!docId,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <Result
        status="404"
        title="Không tìm thấy tài liệu"
        subTitle="Tài liệu không tồn tại hoặc bạn không có quyền truy cập."
        extra={<Button type="primary" onClick={() => router.push('/dashboard')}>Về trang chủ</Button>}
      />
    );
  }

  // Helper cho trạng thái
  const isSuspicious = document.verification_status === 'SUSPICIOUS';
  const isVerified = document.verification_status === 'VERIFIED';
  
  // Entities
  const entities = document.ai_results?.vision_analysis?.entities || [];
  const hasSignature = entities.some((e: any) => e.label === 'signature' || e.label === 'chu_ky');
  const hasSeal = entities.some((e: any) => e.label === 'seal' || e.label === 'con_dau');

  // Verify Link
  const verifyLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${document.public_token || document.id}`;

  // Timeline logic
  const status = document.status?.toUpperCase() || 'RECEIVED';
  let currentStep = 0;
  let finalStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';

  if (status === 'RECEIVED') { currentStep = 0; finalStatus = 'finish'; }
  else if (status === 'PROCESSING') { currentStep = 1; finalStatus = 'process'; }
  else if (status === 'OCR_DONE') { currentStep = 2; finalStatus = 'process'; }
  else if (status === 'ENRICHING') { currentStep = 2; finalStatus = 'process'; }
  else if (status === 'COMPLETED') { currentStep = 3; finalStatus = 'finish'; }
  else if (status === 'FAILED') { currentStep = 3; finalStatus = 'error'; }

  const timelineItems = [
    { title: 'Uploaded', description: new Date(document.created_at).toLocaleString('vi-VN') },
    { title: 'OCR Processed' },
    { title: 'AI Analysis' },
    { title: 'Verification', description: document.updated_at ? new Date(document.updated_at).toLocaleString('vi-VN') : '' }
  ];

  return (
    <div style={{ padding: '24px 48px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text" />
        <div>
          <Title level={3} style={{ margin: 0, color: '#0f172a' }}>{document.file_name}</Title>
          <Text type="secondary">ID: {document.id}</Text>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI - 16 */}
        <Col span={16}>
          {/* Thông tin Cơ bản */}
          <Card title={<Space><FileTextOutlined style={{ color: '#008080' }}/> Thông tin Cơ bản</Space>} style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Row gutter={[24, 24]}>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>NGƯỜI UPLOAD</Text>
                <Space style={{ marginTop: 8 }}>
                  <UserOutlined style={{ color: '#64748b' }} />
                  <Text strong>{document.owner_name || 'Hệ thống'}</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>LOẠI TÀI LIỆU</Text>
                <Tag color="processing" style={{ marginTop: 8, fontSize: 14, padding: '4px 12px' }}>{document.category || 'N/A'}</Tag>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>NGÀY TẠO</Text>
                <Space style={{ marginTop: 8 }}>
                  <CalendarOutlined style={{ color: '#64748b' }} />
                  <Text strong>{new Date(document.created_at).toLocaleDateString('vi-VN')}</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* AI Analysis */}
          <Card title={<Space><RobotOutlined style={{ color: '#008080' }}/> Phân tích AI</Space>} style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, marginBottom: 24, borderLeft: '4px solid #008080' }}>
              <Text strong style={{ color: '#0f766e', display: 'block', marginBottom: 8 }}>AI INSIGHT</Text>
              <Text italic>"{document.ai_results?.content_analysis?.insight || 'Không có nhận định đặc biệt.'}"</Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>TÓM TẮT (SUMMARY)</Text>
                <Paragraph style={{ fontSize: 14, lineHeight: 1.6 }}>{document.summary || document.ai_results?.content_analysis?.summary_short || 'N/A'}</Paragraph>
              </Col>

              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>ĐIỂM CHÍNH (MAIN POINTS)</Text>
                <Space direction="vertical">
                  {document.ai_results?.content_analysis?.main_points?.length > 0 
                    ? document.ai_results.content_analysis.main_points.map((p: string, i: number) => (
                        <Text key={i}><CheckCircleOutlined style={{ color: '#008080', marginRight: 8 }} />{p}</Text>
                      ))
                    : <Text type="secondary">N/A</Text>
                  }
                </Space>
              </Col>

              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>TỪ KHÓA (KEYWORDS)</Text>
                <div>
                  {document.ai_results?.content_analysis?.keywords?.length > 0 
                    ? document.ai_results.content_analysis.keywords.map((kw: string, i: number) => (
                        <Tag key={i} color="default" style={{ marginBottom: 8 }}>{kw}</Tag>
                      ))
                    : <Text type="secondary">N/A</Text>
                  }
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* CỘT PHẢI - 8 */}
        <Col span={8}>
          {/* Trạng thái Xác thực */}
          <Card title={<Space><SafetyCertificateOutlined style={{ color: '#008080' }}/> Xác thực</Space>} style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              {isVerified ? (
                <Tag color="success" style={{ padding: '8px 24px', fontSize: 16, borderRadius: 24, margin: 0 }}><CheckCircleOutlined /> HỢP LỆ (VERIFIED)</Tag>
              ) : isSuspicious ? (
                <Tag color="warning" style={{ padding: '8px 24px', fontSize: 16, borderRadius: 24, margin: 0 }}><WarningOutlined /> NGHI VẤN (SUSPICIOUS)</Tag>
              ) : (
                <Tag color="default" style={{ padding: '8px 24px', fontSize: 16, borderRadius: 24, margin: 0 }}>ĐANG XỬ LÝ (PENDING)</Tag>
              )}
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>CHỮ KÝ (SIGNATURE)</Text>
                {hasSignature ? <Tag color="success"><CheckCircleOutlined /> Đã tìm thấy</Tag> : <Tag color="error"><CloseCircleOutlined /> Không thấy</Tag>}
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>CON DẤU (SEAL)</Text>
                {hasSeal ? <Tag color="success"><CheckCircleOutlined /> Đã tìm thấy</Tag> : <Tag color="error"><CloseCircleOutlined /> Không thấy</Tag>}
              </Col>
            </Row>
          </Card>

          {/* QR Code */}
          <Card title={<Space><QrcodeOutlined style={{ color: '#008080' }}/> Mã QR Công Khai</Space>} style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <QRCode value={verifyLink} size={150} />
              <div style={{ marginTop: 16, width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>QR TOKEN</Text>
                <Paragraph copyable style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                  {document.public_token || 'N/A'}
                </Paragraph>
              </div>
              <div style={{ marginTop: 12, width: '100%' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>NGÀY TẠO QR</Text>
                <Text strong style={{ fontSize: 13 }}>{new Date(document.created_at).toLocaleString('vi-VN')}</Text>
              </div>
            </div>
          </Card>

          {/* Processing History */}
          <Card title="Tiến trình xử lý" style={{ borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <Steps
              direction="vertical"
              size="small"
              current={currentStep}
              status={finalStatus}
              items={timelineItems}
            />
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Created: {new Date(document.created_at).toLocaleDateString('vi-VN')}</Text>
              {document.updated_at && <Text type="secondary" style={{ fontSize: 11 }}>Updated: {new Date(document.updated_at).toLocaleDateString('vi-VN')}</Text>}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
