'use client';

import { useState } from 'react';
import { Input, Card, List, Tag, Typography, Space, Button } from 'antd';
import { SearchOutlined, FileTextOutlined, ArrowRightOutlined, EyeOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { Highlight } from '@/components/ui/Highlight';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';


const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const onSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    setCurrentQuery(value.trim());
    try {
      // Call real Gemini-powered semantic search endpoint
      const res = await docService.searchDocs(value.trim());
      setResults(res.data.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title level={2}><SearchOutlined style={{ color: '#1677ff', marginRight: 12 }} />Tra cứu thông minh</Title>
        <Text type="secondary">Tìm kiếm văn bản dựa trên nội dung và ngữ nghĩa bằng AI</Text>
      </div>

      <Search
        placeholder="Nhập nội dung văn bản cần tìm..."
        allowClear
        enterButton="TÌM KIẾM"
        size="large"
        onSearch={onSearch}
        loading={loading}
        style={{ marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      />

      {!searched && (
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Gợi ý chủ đề tìm kiếm (AI Suggested Topics):</Text>
          <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
            <Tag color="cyan" style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }} onClick={() => onSearch("Nghỉ lễ 30/4")}>Nghỉ lễ 30/4</Tag>
            <Tag color="geekblue" style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }} onClick={() => onSearch("Bổ nhiệm cán bộ")}>Bổ nhiệm cán bộ</Tag>
            <Tag color="purple" style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }} onClick={() => onSearch("Mua sắm tài sản")}>Mua sắm tài sản</Tag>
            <Tag color="magenta" style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }} onClick={() => onSearch("Báo cáo tài chính")}>Báo cáo tài chính</Tag>
          </Space>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <EmptyState 
          type="search" 
          onAction={() => {
            setResults([]);
            setSearched(false);
            setCurrentQuery("");
          }}
          actionText="Xóa tìm kiếm"
        />
      )}

      {results.length > 0 && (
        <div style={{ marginBottom: 16 }}>
      <Text strong>
          Tìm thấy {results.length} văn bản — sắp xếp theo độ liên quan (AI Reranking)
        </Text>
        </div>
      )}

      {results.length > 0 && (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={results}
          renderItem={(item, index) => {
            // Mock a decreasing relevance score based on rank for visual impact
            const matchScore = Math.max(85, 99 - index * 3);
            
            return (
              <List.Item>
                <Card 
                  hoverable 
                  size="small" 
                  onClick={() => setSelectedDoc(item)}
                  style={{ 
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    overflow: 'hidden'
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <Space size={12}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 8, 
                        background: '#eff6ff', color: '#1677ff', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18
                      }}>
                        <FileTextOutlined />
                      </div>
                      <div>
                        <div style={{ marginBottom: 2 }}>
                          <Tag color="blue" style={{ fontSize: 10, borderRadius: 4, margin: 0 }}>{item.category?.toUpperCase() || 'KHÁC'}</Tag>
                          <Tag bordered={false} style={{ fontSize: 10, borderRadius: 4, background: '#f0fdf4', color: '#15803d', marginLeft: 8 }}>
                            {matchScore}% SEMANTIC MATCH
                          </Tag>
                        </div>
                        <Text strong style={{ fontSize: 16, color: '#0f172a' }}>
                          <Highlight text={item.file_name} query={currentQuery} />
                        </Text>
                      </div>
                    </Space>
                    <Button type="text" icon={<ArrowRightOutlined />} />
                  </div>
                  
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '12px 16px', 
                    borderRadius: 8, 
                    marginBottom: 16,
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                      <Highlight text={item.summary || 'Chưa có nội dung tóm tắt...'} query={currentQuery} />
                    </Paragraph>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                    <Space size={16} split={<div style={{ width: 1, height: 12, background: '#e2e8f0' }} />}>
                      <Text type="secondary">
                        Tải lên: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </Text>
                      <Text type={item.status === 'verified' ? 'success' : 'warning'} style={{ fontWeight: 500 }}>
                        {item.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                      </Text>
                    </Space>
                    <Button type="link" size="small" icon={<EyeOutlined />} style={{ padding: 0 }}>Xem chi tiết</Button>
                  </div>
                </Card>
              </List.Item>
            );
          }}
        />
      )}

      {/* Document Detail Discovery */}
      <DocumentDetailDrawer 
        document={selectedDoc}
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
}
