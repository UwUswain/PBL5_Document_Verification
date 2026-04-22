'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, Card, Tag, Drawer, Typography, Row, Col, Button, Input } from 'antd';
import { 
  FileProtectOutlined, 
  ClockCircleOutlined, 
  EyeOutlined, 
  SearchOutlined, 
  RobotOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { docService } from '@/services/api';
import { useState, useMemo } from 'react';
import { AutoZoomCard } from '@/components/dashboard/AutoZoomCard';
import { SkeletonTable } from '@/components/ui/SkeletonTable';

const { Text } = Typography;

export default function RepositoryPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
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
    if (!selectedDoc || !selectedDoc.ai_results) return { signature: null, seal: null };
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
      });
    } catch (e) { console.error(e); }

    return {
      signature: entities.find(e => e.label === "chu_ky" || e.label === "Signature"),
      seal: entities.find(e => e.label === "con_dau" || e.label === "Seal"),
      metadata: selectedDoc.ai_results?.metadata || {}
    };
  }, [selectedDoc]);

  const [hoveredEntity, setHoveredEntity] = useState<any>(null);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });

  const handleCloseDrawer = () => {
    setSelectedDoc(null);
    setHoveredEntity(null);
  };

  const imageUrl = selectedDoc ? docService.getImageUrl(selectedDoc.file_path || selectedDoc.sha256_hash) : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const res = await docService.searchDocs(value);
      setSearchResults(res.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const displayDocs = searchResults || docs;

  return (
    <>
      <Card 
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><FileProtectOutlined /> <span>Kho tài liệu lưu trữ</span></div>}
        extra={
          <Input.Search 
            placeholder="Tìm kiếm thông minh (ví dụ: Quyết định Hải Phòng 2016...)" 
            onSearch={handleSearch}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setSearchResults(null);
            }}
            loading={isSearching}
            style={{ width: 450 }}
            enterButton={<Button type="primary" icon={<RobotOutlined />}>AI Search</Button>}
          />
        }
        bordered={false}
      >
        {isLoading || isSearching ? (
          <SkeletonTable rowCount={5} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={displayDocs} 
            rowKey="id" 
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: searchResults ? searchResults.length : totalDocs,
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
            {/* Cột trái: Document Viewer */}
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

                {/* Hover Validation Highlight */}
                {hoveredEntity && hoveredEntity.bbox && (
                  <div
                    style={{
                      position: 'absolute', pointerEvents: 'none',
                      border: '3px solid #1677ff', background: 'rgba(22, 119, 255, 0.2)',
                      left: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.x / 10}%` : `${(hoveredEntity.bbox.x / imgSize.width) * 100}%`,
                      top: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.y / 10}%` : `${(hoveredEntity.bbox.y / imgSize.height) * 100}%`,
                      width: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.width / 10}%` : `${(hoveredEntity.bbox.width / imgSize.width) * 100}%`,
                      height: hoveredEntity.is_ai_guessed ? `${hoveredEntity.bbox.height / 10}%` : `${(hoveredEntity.bbox.height / imgSize.height) * 100}%`,
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                      zIndex: 10
                    }}
                  >
                    <div style={{ position: 'absolute', top: -25, left: -3, background: '#1677ff', color: '#fff', padding: '2px 8px', fontSize: 12, fontWeight: 'bold', borderRadius: '4px 4px 4px 0' }}>
                      {hoveredEntity.label === "chu_ky" ? "Chữ ký" : "Con dấu"}
                    </div>
                  </div>
                )}
              </div>
            </Col>

            {/* Cột phải: Deep Semantic Extraction (Bento Style) */}
            <Col span={12} style={{ height: '100%', padding: '24px 32px', overflowY: 'auto', background: '#f8fafc' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 1. Phân loại & Insight Layer */}
                <Card bordered={false} bodyStyle={{ padding: 20 }} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>Phân loại văn bản</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a' }}>{selectedDoc.category?.toUpperCase() || 'KHÁC'}</div>
                    </div>
                    <Tag color="blue" style={{ borderRadius: 4, fontSize: 12, fontWeight: 600, padding: '4px 12px', margin: 0 }}>AI ANALYZED</Tag>
                  </div>
                  {aiData.metadata?.insight && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#e6f4ff', borderRadius: 8, border: '1px solid #91caff' }}>
                      <div style={{ fontSize: 12, color: '#0958d9', fontWeight: 700, marginBottom: 4 }}>
                        <RobotOutlined /> AI NHẬN ĐỊNH:
                      </div>
                      <div style={{ fontSize: 13, color: '#002c8c', fontStyle: 'italic' }}>
                        "{aiData.metadata.insight}"
                      </div>
                    </div>
                  )}
                </Card>

                {/* 2. Thông tin trích xuất */}
                <Card title={<span style={{ fontSize: 14, fontWeight: 700 }}><SearchOutlined /> THÔNG TIN TRÍCH XUẤT</span>} bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>SỐ HIỆU</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>{aiData.metadata?.document_number || 'N/A'}</div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>NGÀY BAN HÀNH</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>{aiData.metadata?.issued_date || 'N/A'}</div>
                    </Col>
                    <Col span={24}>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>CƠ QUAN BAN HÀNH</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>{aiData.metadata?.issuer || 'N/A'}</div>
                    </Col>
                  </Row>
                </Card>

                {/* 3. Tóm tắt thông minh & Điểm chính */}
                <Card bordered={false} bodyStyle={{ padding: 20 }} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ 
                    fontSize: 15, 
                    fontWeight: 800, 
                    marginBottom: 16, 
                    color: '#fff',
                    background: 'linear-gradient(90deg, #1677ff 0%, #4096ff 100%)',
                    padding: '8px 16px',
                    borderRadius: '8px 8px 2px 2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginLeft: -20,
                    marginRight: -20,
                    marginTop: -20
                  }}>
                    <RobotOutlined /> AI TRÍCH XUẤT NỘI DUNG
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#595959', marginBottom: 4 }}>TÓM TẮT THÔNG MINH (EXECUTIVE SUMMARY)</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: '#262626' }}>{selectedDoc.summary}</div>
                  </div>

                  {aiData.metadata?.main_points && aiData.metadata.main_points.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#595959', marginBottom: 8 }}>CÁC ĐIỂM CHÍNH (KEY POINTS)</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {aiData.metadata.main_points.map((point: string, idx: number) => (
                          <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 4 }} />
                            <span style={{ fontSize: 13, color: '#434343' }}>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiData.metadata?.keywords && aiData.metadata.keywords.length > 0 && (
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 8 }}>TỪ KHÓA NGỮ NGHĨA</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {aiData.metadata.keywords.map((kw: string, idx: number) => (
                          <Tag key={idx} style={{ borderRadius: 4, margin: 0, background: '#f5f5f5', border: 'none', fontSize: 11 }}>#{kw}</Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* 4. Phân tích xác thực */}
                <Card title={<span style={{ fontSize: 14, fontWeight: 700 }}>PHÂN TÍCH XÁC THỰC</span>} bordered={false} bodyStyle={{ padding: 20 }} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderLeft: '4px solid #52c41a' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div 
                        onMouseEnter={() => setHoveredEntity(aiData.signature)}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        <AutoZoomCard 
                          title="Chữ ký" 
                          entity={aiData.signature} 
                          imageSrc={imageUrl}
                        />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div 
                        onMouseEnter={() => setHoveredEntity(aiData.seal)}
                        onMouseLeave={() => setHoveredEntity(null)}
                      >
                        <AutoZoomCard 
                          title="Con dấu" 
                          entity={aiData.seal} 
                          imageSrc={imageUrl}
                          notFoundText="KHÔNG CÓ DẤU"
                        />
                      </div>
                    </Col>
                  </Row>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f6ffed', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#389e0d' }}>ĐỘ TIN CẬY XÁC THỰC (TRUST SCORE)</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#52c41a' }}>96%</span>
                  </div>
                </Card>

                <div style={{ height: 20 }}></div>
              </div>
            </Col>
          </Row>
        )}
      </Drawer>
    </>
  );
}
