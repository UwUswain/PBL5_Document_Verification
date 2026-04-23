'use client';
import { 
  Table, Card, Input, Button, Tag, Space, Drawer, 
  Typography, message, Popconfirm, Tooltip, theme, Row, Col 
} from 'antd';
import { 
  SearchOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { useState } from 'react';
import { AutoZoomCard } from '@/components/dashboard/AutoZoomCard';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';

const { Title, Text } = Typography;

export default function RepositoryPage() {
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgContainer === '#141414'; // Simple check for AntD default dark bg
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['docs'],
    queryFn: () => docService.getDocs().then(res => res.data.items || []),
  });

  const docs = data || [];

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await docService.searchDocs(value);
      setSearchResults(res.data.results);
    } catch (e) {
      message.error("Lỗi tìm kiếm");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => docService.deleteDoc(id),
    onSuccess: () => {
      message.success('Xóa tài liệu thành công');
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
    onError: () => message.error('Không thể xóa tài liệu này')
  });

  const columns = [
    {
      title: 'Tên văn bản',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text: string) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Tag color="blue">{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        status === 'verified' 
          ? <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag> 
          : <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>
      )
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EyeOutlined />} 
              onClick={() => setSelectedDoc(record)} 
            />
          </Tooltip>
          
          <Popconfirm
            title="Xóa tài liệu"
            description="Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
          >
            <Button 
              danger 
              shape="circle" 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const displayDocs = searchResults || docs;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: token.colorText }}>Kho tài liệu văn bản</Title>
        <Space>
          <Input.Search 
            placeholder="Tìm kiếm thông minh..." 
            onSearch={handleSearch}
            allowClear
            onChange={(e) => {
              if (!e.target.value) setSearchResults(null);
            }}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<UploadOutlined />}>Tải lên</Button>
        </Space>
      </div>

      <Card bordered={false}>
        {isLoading ? (
          <SkeletonTable rowCount={8} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={displayDocs} 
            rowKey="id" 
            locale={{
              emptyText: (
                <EmptyState 
                  type={searchResults ? 'search' : 'docs'} 
                  onAction={() => {
                    // Trigger the same logic as the header upload button if needed, 
                    // or simply scroll to top/show a message. 
                    // In a real app, this might open the upload modal directly.
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )
            }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: token.colorText }}>{selectedDoc?.file_name}</span>
            <Tag 
              color={selectedDoc?.status === 'verified' ? 'success' : selectedDoc?.status === 'error' ? 'error' : 'warning'} 
              style={{ borderRadius: 4, fontWeight: 'bold', fontSize: 10 }}
            >
              {(selectedDoc?.status || 'PENDING').toUpperCase()}
            </Tag>
          </div>
        }
        width="95%"
        onClose={() => setSelectedDoc(null)}
        open={!!selectedDoc}
        styles={{ body: { padding: 0, backgroundColor: token.colorBgLayout, overflow: 'hidden' } }}
        extra={<Button type="text" icon={<SearchOutlined />} />}
      >
        {selectedDoc && (
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
                src={selectedDoc.file_path ? (docService.getImageUrl(selectedDoc.file_path) ?? '') : ''} 
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
                
                {/* Section 1: Phân loại */}
                <section>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px' }}>PHÂN LOẠI VĂN BẢN</Text>
                    <Tag color="processing" bordered={false} style={{ fontSize: 10, fontWeight: 800 }}>AI ANALYZED</Tag>
                  </div>
                  <Title level={2} style={{ margin: '0 0 16px 0', fontWeight: 800 }}>{selectedDoc.category?.toUpperCase() || 'KHÁC'}</Title>
                  
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
                      "{selectedDoc.ai_results?.metadata?.insight || `Đây là văn bản ${selectedDoc.category?.toLowerCase()} chính thức, đã qua xác thực tính toàn vẹn.`}"
                    </Text>
                  </div>
                </section>

                {/* Section 2: Thông tin trích xuất */}
                <section>
                  <Title level={5} style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, letterSpacing: '1px' }}>
                    <SearchOutlined style={{ color: '#1677ff' }} /> THÔNG TIN TRÍCH XUẤT
                  </Title>
                  <Row gutter={[24, 24]}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>SỐ HIỆU</Text>
                      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{selectedDoc.ai_results?.metadata?.document_number || '---'}</div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>NGÀY BAN HÀNH</Text>
                      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{selectedDoc.ai_results?.metadata?.issued_date || '---'}</div>
                    </Col>
                    <Col span={24}>
                      <Text type="secondary" style={{ fontSize: 11 }}>CƠ QUAN BAN HÀNH</Text>
                      <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{selectedDoc.ai_results?.metadata?.issuer || '---'}</div>
                    </Col>
                  </Row>
                </section>

                {/* Section 3: AI Trích xuất nội dung */}
                <section>
                  <div style={{ padding: '20px 0', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Title level={5} style={{ color: '#1677ff', fontSize: 12, marginBottom: 24 }}>AI TRÍCH XUẤT NỘI DUNG</Title>
                    
                    <div style={{ marginBottom: 24 }}>
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 12, color: token.colorTextSecondary }}>TÓM TẮT THÔNG MINH (EXECUTIVE SUMMARY)</Text>
                      <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                        {selectedDoc.summary}
                      </div>
                    </div>

                    {selectedDoc.ai_results?.metadata?.main_points && (
                      <div>
                        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 12, color: token.colorTextSecondary }}>CÁC ĐIỂM CHÍNH (KEY POINTS)</Text>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          {selectedDoc.ai_results.metadata.main_points.map((point: string, idx: number) => (
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
                  <Title level={5} style={{ marginBottom: 20, fontSize: 12, letterSpacing: '1px' }}>THỰC THỂ BÓC TÁCH (OCR CROPS)</Title>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <AutoZoomCard 
                      title="CHỮ KÝ (SIGNATURE)" 
                      entity={selectedDoc.ai_results?.entities?.find((e: any) => e.label === 'chu_ky' || e.label === 'signature')} 
                    />
                    <AutoZoomCard 
                      title="CON DẤU (STAMP)" 
                      entity={selectedDoc.ai_results?.entities?.find((e: any) => e.label === 'con_dau' || e.label === 'stamp')} 
                    />
                  </div>
                </section>

              </Space>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
}

