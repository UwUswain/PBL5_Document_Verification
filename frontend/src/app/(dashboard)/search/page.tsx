'use client';

import { useState } from 'react';
import { Input, Card, List, Tag, Typography, Empty, Space } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';
import moment from 'moment';

const { Search } = Input;
const { Title, Text, Paragraph } = Typography;

export default function SearchPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const onSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      // Vì API searchAI có thể chưa sẵn sàng, ta fetch all và filter ở client (Tương tự code Vite cũ)
      const res = await docService.getDocs();
      const items = res.data.items || [];
      const filtered = items.filter((d: any) => 
        d.file_name.toLowerCase().includes(value.toLowerCase()) || 
        (d.summary || "").toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      console.error(error);
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
        style={{ marginBottom: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      />

      {searched && !loading && results.length === 0 && (
        <Empty description="Không tìm thấy văn bản phù hợp" />
      )}

      {results.length > 0 && (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={results}
          renderItem={(item) => (
            <List.Item>
              <Card hoverable size="small" style={{ borderColor: '#e6f4ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Space>
                    <FileTextOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                    <Text strong style={{ fontSize: 16 }}>{item.file_name}</Text>
                  </Space>
                  <Tag color="blue">{item.category?.toUpperCase() || 'KHÁC'}</Tag>
                </div>
                
                <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {item.summary || 'Chưa có nội dung tóm tắt...'}
                </Paragraph>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <Text type="secondary">Ngày tạo: {moment(item.created_at).format('DD/MM/YYYY')}</Text>
                  <Text type={item.status === 'verified' ? 'success' : 'warning'} strong>
                    {item.status === 'verified' ? 'Đã xác thực' : 'Đang xử lý'}
                  </Text>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
