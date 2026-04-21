'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Drawer, Typography, Row, Col, Button } from 'antd';
import { FileProtectOutlined, ClockCircleOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
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

  const handleCloseDrawer = () => {
    setSelectedDoc(null);
    setIsZoomMode(false);
    setZoomLevel(1);
  };

  const imageUrl = selectedDoc ? docService.getImageUrl(selectedDoc.file_path || selectedDoc.sha256_hash) : null;
  const qrUrl = selectedDoc ? docService.getImageUrl(selectedDoc.qr_path) : null;

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
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{selectedDoc?.file_name}</span> <Tag color={selectedDoc?.status === 'verified' ? 'success' : 'warning'}>{selectedDoc?.status?.toUpperCase()}</Tag></div>}
        width="80vw"
        onClose={handleCloseDrawer}
        open={!!selectedDoc}
        bodyStyle={{ background: '#f5f5f5', padding: 24 }}
      >
        {selectedDoc && (
          <Row gutter={24}>
            {/* Cột trái: Trích xuất và Smart Zoom */}
            <Col span={14}>
              <Card 
                title="Đối soát AI Detection" 
                bordered={false} 
                extra={
                  <Button 
                    type={isZoomMode ? "primary" : "default"} 
                    icon={<SearchOutlined />} 
                    onClick={() => {
                      setIsZoomMode(!isZoomMode);
                      if (isZoomMode) setZoomLevel(1);
                    }}
                  >
                    {isZoomMode ? "ĐANG SOI CHI TIẾT (CUỘN CHUỘT)" : "BẬT CHẾ ĐỘ SOI CHI TIẾT"}
                  </Button>
                }
              >
                <div
                  style={{
                    position: 'relative', overflow: 'hidden', background: '#f0f0f0', borderRadius: 8,
                    cursor: isZoomMode ? 'crosshair' : 'default', border: '1px solid #d9d9d9', marginBottom: 16
                  }}
                  onMouseMove={(e) => {
                    if (!isZoomMode) return;
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    setMousePos({ x: ((e.clientX - left) / width) * 100, y: ((e.clientY - top) / height) * 100 });
                  }}
                  onWheel={(e) => {
                    if (!isZoomMode) return;
                    setZoomLevel(prev => Math.min(Math.max(1, prev + (e.deltaY < 0 ? 0.2 : -0.2)), 5));
                  }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Scan"
                      style={{
                        width: '100%', height: 'auto', display: 'block',
                        transition: 'transform 0.1s ease-out',
                        transform: `scale(${zoomLevel})`,
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                      }}
                    />
                  )}
                  {/* Bounding Boxes */}
                  {!isZoomMode && aiData.all.map((e, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute', pointerEvents: 'none',
                        border: '2px solid #ff4d4f', background: 'rgba(255, 77, 79, 0.1)',
                        left: `${e.bbox.x}%`, top: `${e.bbox.y}%`,
                        width: `${e.bbox.width}%`, height: `${e.bbox.height}%`,
                      }}
                    >
                      <span style={{ position: 'absolute', top: -18, left: -2, background: '#ff4d4f', color: '#fff', fontSize: 10, padding: '0 4px', fontWeight: 'bold' }}>
                        {e.label === "chu_ky" ? "Chữ ký" : "Con dấu"}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Row gutter={16}>
                  <Col span={12}><AutoZoomCard title="Trích xuất Chữ ký" entity={aiData.signature} imageSrc={imageUrl || null} notFoundText="KHÔNG CÓ CHỮ KÝ" /></Col>
                  <Col span={12}><AutoZoomCard title="Trích xuất Con dấu" entity={aiData.seal} imageSrc={imageUrl || null} notFoundText="KHÔNG CÓ CON DẤU" /></Col>
                </Row>
              </Card>
            </Col>

            {/* Cột phải: Thông tin & AI Summary */}
            <Col span={10}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Card title="Tóm tắt nội dung bằng AI" bordered={false} headStyle={{ color: '#1677ff' }}>
                  <Text italic style={{ fontSize: 14, lineHeight: 1.6 }}>{aiData.summary}</Text>
                  
                  <div style={{ marginTop: 24 }}>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Từ khóa trích xuất</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {aiData.keywords.map((kw: string, i: number) => (
                        <Tag key={i} color="blue">{kw.replace(/[.,]/g, '')}</Tag>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card title="Mã QR Chứng thực" bordered={false} style={{ textAlign: 'center' }}>
                  {qrUrl ? (
                    <div>
                      <img src={qrUrl} alt="QR" style={{ width: 140, height: 140, padding: 8, border: '1px solid #f0f0f0', borderRadius: 8 }} />
                      <div style={{ marginTop: 8 }}><Text type="secondary" style={{ fontSize: 11 }}>LDHL Verified System</Text></div>
                    </div>
                  ) : (
                    <Text type="secondary">Chưa cấp mã QR</Text>
                  )}
                </Card>

                <Card bordered={false}>
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>Mã băm SHA-256</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>{selectedDoc.sha256_hash}</Text>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        )}
      </Drawer>
    </>
  );
}
