'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { 
  Typography, Card, Tag, Row, Col, Space, Spin, Button, Steps, QRCode, Divider, Result, Tabs, Input, message, Select, Modal, Form
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
  QrcodeOutlined,
  PrinterOutlined,
  MessageOutlined,
  SendOutlined,
  DownloadOutlined,
  CopyOutlined,
  LockOutlined,
  TeamOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const { Title, Text, Paragraph } = Typography;

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareForm] = Form.useForm();

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: { level: string, shared_with: string[] }) => docService.updatePrivacy(docId, data),
    onSuccess: () => {
      message.success('Cập nhật quyền truy cập thành công');
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
      setIsShareModalOpen(false);
    },
    onError: () => {
      message.error('Bạn không có quyền thực hiện hoặc có lỗi xảy ra');
    }
  });

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setIsChatting(true);
    
    try {
      const res = await docService.chatWithDocument(docId, q);
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer || 'Không nhận được câu trả lời.' }]);
    } catch (e: any) {
      message.error('Lỗi khi gọi AI Assistant');
      setChatHistory(prev => [...prev, { role: 'error', text: 'Lỗi kết nối đến AI. Vui lòng thử lại.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const { data: document, isLoading, isError } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => docService.getDocById(docId).then(res => res.data),
    enabled: !!docId,
  });

  const handlePrivacyChange = (value: string) => {
    if (value === 'SHARED') {
      const currentShared = document?.ai_results?.shared_with || [];
      shareForm.setFieldsValue({ shared_with: currentShared.join(', ') });
      setIsShareModalOpen(true);
    } else {
      updatePrivacyMutation.mutate({ level: value, shared_with: [] });
    }
  };

  const handleShareSubmit = (values: any) => {
    const emails = values.shared_with 
      ? values.shared_with.split(',').map((e: string) => e.trim()).filter(Boolean) 
      : [];
    updatePrivacyMutation.mutate({ level: 'SHARED', shared_with: emails });
  };

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

  const isOwner = user?.id === document?.owner_id;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .ant-layout-sider, .ant-layout-header { display: none !important; }
          .ant-layout, .ant-layout-content { background: white !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          .ant-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid; margin-bottom: 24px !important; }
          .print-header { display: block !important; margin-bottom: 32px !important; text-align: center; }
          .print-header h1 { font-size: 24px; margin: 0; }
        }
      `}} />
      <div style={{ padding: '24px 48px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="text" />
            <div>
              <Title level={3} style={{ margin: 0, color: '#0f172a' }}>{document.file_name}</Title>
              <Space>
                <Text type="secondary">ID: {document.id}</Text>
                {isOwner && (
                  <>
                    <Divider type="vertical" />
                    <Select
                      value={document?.ai_results?.privacy_level || 'PRIVATE'}
                      onChange={handlePrivacyChange}
                      style={{ width: 110 }}
                      variant="borderless"
                      options={[
                        { value: 'PRIVATE', label: <span style={{ color: '#475569' }}><LockOutlined /> Private</span> },
                        { value: 'SHARED', label: <span style={{ color: '#0284c7' }}><TeamOutlined /> Shared</span> },
                        { value: 'PUBLIC', label: <span style={{ color: '#16a34a' }}><GlobalOutlined /> Public</span> },
                      ]}
                      dropdownStyle={{ borderRadius: 8 }}
                    />
                  </>
                )}
              </Space>
            </div>
          </div>
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => {
                const url = docService.getImageUrl(document.file_path);
                if (url) {
                  const a = window.document.createElement('a');
                  a.href = url;
                  a.download = document.file_name || 'document';
                  a.target = '_blank';
                  window.document.body.appendChild(a);
                  a.click();
                  window.document.body.removeChild(a);
                } else {
                  message.error('Không tìm thấy đường dẫn file.');
                }
              }}
            >
              Download Original
            </Button>
            <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ backgroundColor: '#008080' }}>
              Export PDF Report
            </Button>
          </Space>
        </div>
        
        {/* Chỉ hiển thị khi in */}
        <div className="print-header" style={{ display: 'none' }}>
          <Title level={1}>DOCUMENT ANALYSIS REPORT</Title>
          <Text type="secondary">Generated by DocuMind Platform</Text>
          <Divider />
        </div>

      <Row gutter={[24, 24]}>
        {/* CỘT TRÁI - 16 */}
        <Col span={16}>
          {/* Thông tin Cơ bản */}
          <Card 
            title={<Space><FileTextOutlined style={{ color: '#008080' }}/> Thông tin Cơ bản</Space>} 
            extra={
              <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => {
                navigator.clipboard.writeText(document.raw_text || '');
                message.success('Đã sao chép OCR Text');
              }}>
                Copy OCR Text
              </Button>
            }
            style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
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

          {/* Tabs cho AI Analysis và AI Assistant */}
          <Tabs 
            defaultActiveKey="1" 
            className="no-print"
            items={[
              {
                key: '1',
                label: <span><RobotOutlined /> Phân tích AI</span>,
                children: (
                  <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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
                )
              },
              {
                key: '2',
                label: <span><MessageOutlined /> AI Assistant</span>,
                children: (
                  <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }} bodyStyle={{ display: 'flex', flexDirection: 'column', height: 450, padding: '16px 24px' }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {chatHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: 100 }}>
                          <RobotOutlined style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }} />
                          <Title level={5} style={{ color: '#64748b' }}>Hỏi tôi bất cứ điều gì về tài liệu này</Title>
                          <Space style={{ marginTop: 16 }}>
                            <Button size="small" onClick={() => { setChatInput('Tóm tắt tài liệu này'); }}>Tóm tắt tài liệu này</Button>
                            <Button size="small" onClick={() => { setChatInput('Ai là người ký?'); }}>Ai là người ký?</Button>
                          </Space>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{ 
                              padding: '12px 16px', 
                              borderRadius: 16, 
                              backgroundColor: msg.role === 'user' ? '#008080' : msg.role === 'error' ? '#fee2e2' : '#f8fafc',
                              color: msg.role === 'user' ? '#fff' : msg.role === 'error' ? '#ef4444' : '#0f172a',
                              boxShadow: msg.role !== 'user' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                              border: msg.role !== 'user' ? '1px solid #e2e8f0' : 'none'
                            }}>
                              <Text style={{ color: 'inherit', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.text}</Text>
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div style={{ alignSelf: 'flex-start' }}>
                          <Spin size="small" /> <Text type="secondary" style={{ marginLeft: 8 }}>Đang phân tích...</Text>
                        </div>
                      )}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input 
                        placeholder="Nhập câu hỏi của bạn..." 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        onPressEnter={handleChat}
                        disabled={isChatting}
                        size="large"
                      />
                      <Button size="large" type="primary" icon={<SendOutlined />} onClick={handleChat} loading={isChatting} style={{ backgroundColor: '#008080' }}>Gửi</Button>
                    </div>
                  </Card>
                )
              }
            ]}
          />
          
          {/* Cấu hình hiển thị lúc in cho AI Analysis (Vì in không hỗ trợ Tabs) */}
          <div className="print-header" style={{ display: 'none' }}>
            <Title level={4} style={{ borderBottom: '1px solid #000', paddingBottom: 8, marginTop: 24 }}>PHÂN TÍCH AI</Title>
            <Paragraph><strong>Tóm tắt:</strong> {document.summary || document.ai_results?.content_analysis?.summary_short || 'N/A'}</Paragraph>
            <Paragraph><strong>Điểm chính:</strong></Paragraph>
            <ul>
              {(document.ai_results?.content_analysis?.main_points || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
            </ul>
          </div>
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
              <div style={{ marginTop: 16, width: '100%', textAlign: 'center' }}>
                <Button size="small" icon={<CopyOutlined />} onClick={() => {
                  navigator.clipboard.writeText(verifyLink);
                  message.success('Đã sao chép Link xác thực');
                }}>
                  Copy Verification Link
                </Button>
              </div>
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
      <Modal
        title="Chia sẻ tài liệu"
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={shareForm} layout="vertical" onFinish={handleShareSubmit} style={{ marginTop: 16 }}>
          <Form.Item 
            name="shared_with" 
            label="Email người được chia sẻ"
            extra="Nhập các email cách nhau bằng dấu phẩy (,)"
          >
            <Input.TextArea rows={4} placeholder="nguyenvana@gmail.com, tranvanb@gmail.com" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={() => setIsShareModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={updatePrivacyMutation.isPending} style={{ backgroundColor: '#008080' }}>
              Lưu chia sẻ
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
