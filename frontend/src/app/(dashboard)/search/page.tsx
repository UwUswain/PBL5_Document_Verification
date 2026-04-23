'use client';

import { useState } from 'react';
import { Input, Card, List, Tag, Typography, Empty, Space } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { Highlight } from '@/components/ui/Highlight';


const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");

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
          renderItem={(item, index) => (
            <List.Item>
              <Card hoverable size="small" style={{ borderColor: '#e6f4ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Space>
                    <FileTextOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                    <Text strong style={{ fontSize: 16 }}>
                      <Highlight text={item.file_name} query={currentQuery} />
                    </Text>
                  </Space>
                  <Tag color="blue">{item.category?.toUpperCase() || 'KHÁC'}</Tag>
                </div>
                
                <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  <Highlight text={item.summary || 'Chưa có nội dung tóm tắt...'} query={currentQuery} />
                </Paragraph>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                  <Tag color="blue" style={{ fontWeight: 600 }}>Kết quả #{index + 1}</Tag>
                  <div>
                    <Text type="secondary" style={{ marginRight: 16 }}>
                      Ngày tạo: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text type={item.status === 'verified' ? 'success' : 'warning'} strong>
                      {item.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                    </Text>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
