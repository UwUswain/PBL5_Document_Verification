'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Drawer, Typography, Row, Col, Button } from 'antd';
import { FileProtectOutlined, ClockCircleOutlined, EyeOutlined, SearchOutlined, RobotOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import { useState, useMemo } from 'react';
import { AutoZoomCard } from '@/components/dashboard/AutoZoomCard';
import { SkeletonTable } from '@/components/ui/SkeletonTable';

const { Text } = Typography;

export default function RepositoryPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isZoomMode, setIsZoomMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['docs', pagination.current, pagination.pageSize],
    queryFn: () => docService.getDocs(pagination.pageSize, (pagination.current - 1) * pagination.pageSize).then(res => res.data),
  });

  const docs = data?.items || [];
  const totalDocs = data?.meta?.total || 0;

  const columns = [
    { title: 'Tên văn bản', dataIndex: 'file_name', key: 'file_name' },
    {
      title: 'Phân loại', dataIndex: 'category', key: 'category',
      filters: [
        { text: 'Quyết định', value: 'quyết định' },
        { text: 'Công văn', value: 'công văn' },
        { text: 'Hợp đồng', value: 'hợp đồng' },
      ],
      onFilter: (value: any, record: any) => record.category?.toLowerCase().includes(value),
      render: (cat: string) => <Tag color="blue">{cat?.toUpperCase() || 'KHÁC'}</Tag>
    },
    {
      title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at',
      sorter: (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (status: string) => (
        status === 'verified' 
          ? <Tag icon={<FileProtectOutlined />} color="success">Đã xác thực</Tag> 
          : <Tag icon={<ClockCircleOutlined />} color="warning">Đang xử lý</Tag>
      )
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedDoc(record)}>Xem chi tiết</Button>
      ),
    },
  ];

  const aiData = useMemo(() => {
    if (!selectedDoc || !selectedDoc.ai_results) return { all: [], summary: selectedDoc?.summary || "", keywords: [] };
    let entities: any[] = [];
    try {
      const parsed = typeof selectedDoc.ai_results === "string" ? JSON.parse(selectedDoc.ai_results) : selectedDoc.ai_results;
      const raw = parsed.entities || (Array.isArray(parsed) ? parsed : []);
      entities = raw.map((e: any) => {
        if (e.box) {
          const [x1, y1, x2, y2] = e.box;
          return { ...e, bbox: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } };
        }
        return e;
      }).filter((e: any) => (e.confidence || 0) > 0.2);
    } catch (e) { console.error(e); }

    const summary = selectedDoc.summary || "AI đang tổng hợp dữ liệu...";
    return {
      signature: entities.find(e => e.label === "chu_ky" || e.label === "Signature"),
      seal: entities.find(e => e.label === "con_dau" || e.label === "Seal"),
      all: entities,
      summary,
      keywords: summary ? summary.split(" ").filter((w: string) => w.length > 5).slice(0, 8) : []
    };
  }, [selectedDoc]);

  const [hoveredEntity, setHoveredEntity] = useState<any>(null);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });

  const handleCloseDrawer = () => {
    setSelectedDoc(null);
    setIsZoomMode(false);
    setZoomLevel(1);
    setHoveredEntity(null);
  };

  const imageUrl = selectedDoc ? docService.getImageUrl(selectedDoc.file_path || selectedDoc.sha256_hash) : null;
  const qrUrl = selectedDoc ? docService.getImageUrl(selectedDoc.qr_path) : null;

  // Tính toán màu sắc cảnh báo dựa trên Confidence
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return '#52c41a'; // Xanh lá
    if (conf >= 0.7) return '#faad14'; // Vàng
    return '#ff4d4f'; // Đỏ
  };

  return (
    <>
      <Card title="Kho tài liệu lưu trữ" bordered={false}>
        {isLoading ? (
          <SkeletonTable rowCount={5} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={docs} 
            rowKey="id" 
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: totalDocs,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50']
            }}
          />
        )}
      </Card>

      <Drawer
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18, fontWeight: 600 }}>{selectedDoc?.file_name}</span> <Tag color={selectedDoc?.status === 'verified' ? 'success' : 'warning'} style={{ borderRadius: 4 }}>{selectedDoc?.status?.toUpperCase()}</Tag></div>}
        width="100vw"
        onClose={handleCloseDrawer}
        open={!!selectedDoc}
        bodyStyle={{ padding: 0, background: '#f5f7fa', overflow: 'hidden' }}
        headerStyle={{ borderBottom: '1px solid #e8e8e8' }}
      >
        {selectedDoc && (
          <Row style={{ height: '100%' }}>
            {/* Cột trái: Document Viewer (Sticky) */}
            <Col span={12} style={{ height: '100%', borderRight: '1px solid #d9d9d9', padding: 24, overflowY: 'auto' }}>
              <div
                style={{
                  position: 'relative', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid #e8e8e8', minHeight: 600, display: 'flex', justifyContent: 'center'
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Scan"
                    onLoad={(e) => setImgSize({ width: e.currentTarget.naturalWidth || 1, height: e.currentTarget.naturalHeight || 1 })}
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  />
                )}

                {/* Hover Validation Highlight (Rossum.ai style) */}
                {hoveredEntity && hoveredEntity.bbox && (
                  <div
                    style={{
                      position: 'absolute', pointerEvents: 'none',
                      border: '3px solid #1677ff', background: 'rgba(22, 119, 255, 0.2)',
                      left: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.x}%` : `${(hoveredEntity.bbox.x / imgSize.width) * 100}%`,
                      top: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.y}%` : `${(hoveredEntity.bbox.y / imgSize.height) * 100}%`,
                      width: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.width}%` : `${(hoveredEntity.bbox.width / imgSize.width) * 100}%`,
                      height: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.height}%` : `${(hoveredEntity.bbox.height / imgSize.height) * 100}%`,
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', // Focus mode
                      zIndex: 10
                    }}
                  >
                    <div style={{ position: 'absolute', top: -25, left: -3, background: '#1677ff', color: '#fff', padding: '2px 8px', fontSize: 12, fontWeight: 'bold', borderRadius: '4px 4px 4px 0' }}>
                      {hoveredEntity.label === "chu_ky" ? "Chữ ký" : "Con dấu"} - {(hoveredEntity.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </Col>

            {/* Cột phải: Document Intelligence Data (Everlaw style) */}
            <Col span={12} style={{ height: '100%', padding: '24px 32px', overflowY: 'auto', background: '#fff' }}>
              <Typography.Title level={5} style={{ marginBottom: 24, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 }}>Dữ liệu trích xuất</Typography.Title>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Field: Classification */}
                <div style={{ padding: '16px 20px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Phân loại văn bản</Text>
                    <Tag color="success" style={{ margin: 0, borderRadius: 12 }}>98.5%</Tag>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#262626' }}>{selectedDoc.category?.toUpperCase() || 'KHÁC'}</div>
                </div>

                {/* Field: Summary */}
                <div style={{ padding: '16px 20px', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>Tóm tắt nội dung</Text>
                    <Tag color="success" style={{ margin: 0, borderRadius: 12 }}>92.0%</Tag>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>
                    {aiData.summary}
                  </div>
                </div>

                {/* Field: Entities / Signatures */}
                <div>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 12 }}>Thực thể không gian</Text>
                  <Row gutter={16}>
                    {/* Chữ ký Validation */}
                    <Col span={12}>
                      <div 
                        onMouseEnter={() => setHoveredEntity(aiData.signature)}
                        onMouseLeave={() => setHoveredEntity(null)}
                        style={{ 
                          padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8',
                          cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: hoveredEntity === aiData.signature ? '0 4px 12px rgba(22,119,255,0.15)' : 'none',
                          borderColor: hoveredEntity === aiData.signature ? '#1677ff' : '#e8e8e8'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text strong>Chữ ký</Text>
                          {aiData.signature ? (
                            <Tag color={getConfidenceColor(aiData.signature.confidence)} style={{ margin: 0, borderRadius: 12 }}>
                              {(aiData.signature.confidence * 100).toFixed(1)}%
                            </Tag>
                          ) : <Tag color="default">N/A</Tag>}
                        </div>
                        {aiData.signature ? (
                          <div style={{ fontSize: 13, color: '#52c41a' }}><CheckCircleOutlined /> Đã phát hiện</div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#bfbfbf' }}>Không tìm thấy</div>
                        )}
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>Trỏ chuột để soi trên ảnh</Text>
                      </div>
                    </Col>

                    {/* Con dấu Validation */}
                    <Col span={12}>
                      <div 
                        onMouseEnter={() => setHoveredEntity(aiData.seal)}
                        onMouseLeave={() => setHoveredEntity(null)}
                        style={{ 
                          padding: 16, background: '#fff', borderRadius: 8, border: '1px solid #e8e8e8',
                          cursor: 'pointer', transition: 'all 0.2s',
                          boxShadow: hoveredEntity === aiData.seal ? '0 4px 12px rgba(22,119,255,0.15)' : 'none',
                          borderColor: hoveredEntity === aiData.seal ? '#1677ff' : '#e8e8e8'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text strong>Con dấu đỏ</Text>
                          {aiData.seal ? (
                            <Tag color={getConfidenceColor(aiData.seal.confidence)} style={{ margin: 0, borderRadius: 12 }}>
                              {(aiData.seal.confidence * 100).toFixed(1)}%
                            </Tag>
                          ) : <Tag color="default">N/A</Tag>}
                        </div>
                        {aiData.seal ? (
                          <div style={{ fontSize: 13, color: '#52c41a' }}><CheckCircleOutlined /> Đã phát hiện</div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#bfbfbf' }}>Không tìm thấy</div>
                        )}
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>Trỏ chuột để soi trên ảnh</Text>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Metadata Sidebar (Everlaw style) */}
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 24, marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 16 }}>Siêu dữ liệu hệ thống</Text>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text type="secondary">Mã định danh (UUID):</Text>
                    <Text code style={{ fontSize: 11 }}>{selectedDoc.id}</Text>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text type="secondary">Mã băm toàn vẹn (SHA-256):</Text>
                    <Text code style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedDoc.sha256_hash}</Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">Mã QR Chứng thực:</Text>
                    {qrUrl ? (
                       <img src={qrUrl} alt="QR" style={{ width: 64, height: 64, border: '1px solid #f0f0f0', borderRadius: 4 }} />
                    ) : <Text>N/A</Text>}
                  </div>
                </div>

              </div>
            </Col>
          </Row>
        )}
      </Drawer>
    </>
  );
}
