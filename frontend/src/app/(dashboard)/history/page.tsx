'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Typography, Table, Tag, Input, ConfigProvider, Card, DatePicker, Select, Space, Steps, Empty 
} from 'antd';
import { 
  SearchOutlined, 
  FilePdfOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { docService } from '@/services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function DocumentHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: resData, isLoading } = useQuery({
    queryKey: ['docs_history', currentPage, pageSize],
    queryFn: () => docService.getDocs(pageSize, (currentPage - 1) * pageSize).then(res => res.data),
    refetchInterval: (query: any) => {
      const items = query.state.data?.items || [];
      const hasPending = items.some((doc: any) => !['COMPLETED', 'FAILED'].includes(doc.status?.toUpperCase()));
      return hasPending ? 5000 : false;
    }
  });

  const docs = resData?.items || [];
  const totalDocs = resData?.meta?.total || 0;

  // Local Filtering
  const filteredDocs = useMemo(() => {
    return docs.filter((doc: any) => {
      // 1. Lọc theo tên file
      if (searchQuery && !doc.file_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 2. Lọc theo trạng thái
      if (statusFilter !== 'ALL') {
        const status = doc.status?.toUpperCase();
        const verStatus = doc.verification_status?.toUpperCase();
        
        if (statusFilter === 'PROCESSING' && ['COMPLETED', 'FAILED'].includes(status)) return false;
        if (statusFilter === 'COMPLETED' && status !== 'COMPLETED') return false;
        if (statusFilter === 'FAILED' && status !== 'FAILED') return false;
        if (statusFilter === 'VERIFIED' && verStatus !== 'VERIFIED') return false;
        if (statusFilter === 'SUSPICIOUS' && verStatus !== 'SUSPICIOUS') return false;
      }

      // 3. Lọc theo ngày
      if (dateRange && dateRange[0] && dateRange[1]) {
        const docDate = dayjs(doc.created_at);
        if (docDate.isBefore(dateRange[0], 'day') || docDate.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [docs, searchQuery, statusFilter, dateRange]);

  const columns = [
    {
      title: 'TÊN VĂN BẢN',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {text.toLowerCase().endsWith('.pdf') ? <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} /> : <FileImageOutlined style={{ color: '#008080', fontSize: 16 }} />}
          </div>
          <div>
            <Text strong style={{ color: '#0f172a', display: 'block', fontSize: 14 }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{record.id.split('-')[0]}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'CREATED TIME',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return <Text style={{ color: '#64748b' }}>{d.toLocaleDateString('vi-VN')} {d.getHours()}:{d.getMinutes().toString().padStart(2, '0')}</Text>;
      }
    },
    {
      title: 'UPDATED TIME',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (date: string) => {
        if (!date) return <Text type="secondary">—</Text>;
        const d = new Date(date);
        return <Text style={{ color: '#64748b' }}>{d.toLocaleDateString('vi-VN')} {d.getHours()}:{d.getMinutes().toString().padStart(2, '0')}</Text>;
      }
    },
    {
      title: 'CURRENT STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string, record: any) => {
        const upperStatus = status?.toUpperCase();
        const verStatus = record.verification_status?.toUpperCase();
        
        if (upperStatus === 'COMPLETED') {
          if (verStatus === 'VERIFIED') return <Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>;
          if (verStatus === 'SUSPICIOUS') return <Tag icon={<WarningOutlined />} color="warning">Suspicious</Tag>;
          return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
        }
        
        if (upperStatus === 'FAILED') return <Tag icon={<CloseCircleOutlined />} color="error">Failed</Tag>;
        
        return <Tag icon={<SyncOutlined spin />} color="processing">{status}</Tag>;
      }
    }
  ];

  // Logic vẽ Processing Timeline từ Document state
  const expandedRowRender = (record: any) => {
    const status = record.status?.toUpperCase() || 'RECEIVED';
    const verStatus = record.verification_status?.toUpperCase();
    const createdAt = record.created_at ? new Date(record.created_at).toLocaleString('vi-VN') : 'N/A';
    const updatedAt = record.updated_at ? new Date(record.updated_at).toLocaleString('vi-VN') : 'N/A';

    let currentStep = 0;
    let finalStatus: 'wait' | 'process' | 'finish' | 'error' = 'wait';

    // MAPPING STATUS TO PIPELINE
    // 0: Uploaded -> 1: OCR Extraction -> 2: AI Analysis -> 3: Verification Result
    if (status === 'RECEIVED') {
      currentStep = 0;
      finalStatus = 'finish';
    } else if (status === 'PROCESSING') {
      currentStep = 1;
      finalStatus = 'process';
    } else if (status === 'OCR_DONE') {
      currentStep = 2; // OCR done, AI Analysis is next
      finalStatus = 'process';
    } else if (status === 'ENRICHING') {
      currentStep = 2; // ENRICHING = AI Analysis
      finalStatus = 'process';
    } else if (status === 'COMPLETED') {
      currentStep = 3;
      finalStatus = 'finish';
    } else if (status === 'FAILED') {
      // If it failed, we just mark the last step as error
      currentStep = 3;
      finalStatus = 'error';
    }

    const items = [
      {
        title: 'Document Uploaded',
        description: <Text type="secondary" style={{ fontSize: 12 }}>Bắt đầu: {createdAt}</Text>,
        icon: <FilePdfOutlined />
      },
      {
        title: 'OCR Extraction',
        description: <Text type="secondary" style={{ fontSize: 12 }}>{currentStep > 1 ? 'Hoàn thành trích xuất văn bản' : (currentStep === 1 ? 'Đang trích xuất văn bản...' : 'Chờ xử lý')}</Text>,
      },
      {
        title: 'AI Analysis',
        description: <Text type="secondary" style={{ fontSize: 12 }}>{currentStep > 2 ? 'Hoàn thành phân tích Semantic' : (currentStep === 2 ? 'Đang chạy mô hình AI...' : 'Chờ xử lý')}</Text>,
      },
      {
        title: 'Verification Result',
        description: <Text type="secondary" style={{ fontSize: 12 }}>
          {status === 'COMPLETED' ? 
            (verStatus === 'VERIFIED' ? `Đã xác thực hợp lệ lúc ${updatedAt}` : 
             verStatus === 'SUSPICIOUS' ? `Phát hiện nghi vấn lúc ${updatedAt}` : `Cập nhật lúc ${updatedAt}`) : 
           status === 'FAILED' ? `Thất bại lúc ${updatedAt}` : 'Chờ kết quả'}
        </Text>,
      }
    ];

    return (
      <div style={{ padding: '24px 48px', backgroundColor: '#f8fafc', borderRadius: 8, margin: '12px 24px', border: '1px solid #e2e8f0' }}>
        <Title level={5} style={{ marginBottom: 24, color: '#0f172a' }}>Tiến trình xử lý tài liệu</Title>
        <Steps
          current={currentStep}
          status={finalStatus}
          items={items}
          size="small"
        />
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#008080',
          colorBgContainer: '#ffffff',
          colorText: '#1e293b',
          fontFamily: 'Inter, sans-serif',
          borderRadius: 8,
        },
        components: {
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#64748b',
            rowHoverBg: '#f1f5f9',
            headerSplitColor: 'transparent',
            cellPaddingBlock: 16,
            borderColor: '#e2e8f0'
          }
        }
      }}
    >
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 40 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Document Processing History</Title>
              <Text type="secondary" style={{ fontSize: 14 }}>Theo dõi tiến trình và lịch sử xử lý tài liệu của bạn</Text>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px' }}>
          <Card 
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}
          >
            {/* Filter Section */}
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Input.Search 
                placeholder="Tìm theo tên văn bản..." 
                allowClear 
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 300 }}
              />
              
              <Select 
                value={statusFilter} 
                onChange={setStatusFilter} 
                style={{ width: 180 }}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="PROCESSING">Đang xử lý</Option>
                <Option value="COMPLETED">Đã hoàn thành</Option>
                <Option value="VERIFIED">Đã xác thực (Verified)</Option>
                <Option value="SUSPICIOUS">Nghi vấn (Suspicious)</Option>
                <Option value="FAILED">Thất bại (Failed)</Option>
              </Select>

              <RangePicker 
                onChange={(dates) => setDateRange(dates as any)} 
                format="DD/MM/YYYY"
              />
            </div>

            {/* Data Table */}
            <Table 
              columns={columns} 
              dataSource={filteredDocs} 
              rowKey="id" 
              loading={isLoading}
              expandable={{
                expandedRowRender,
                expandRowByClick: true,
                rowExpandable: () => true,
              }}
              pagination={{
                position: ['bottomRight'],
                current: currentPage,
                pageSize: pageSize,
                total: totalDocs,
                showSizeChanger: true,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                style: { padding: '16px 24px', margin: 0 }
              }}
              locale={{ 
                emptyText: <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                  description={
                    statusFilter === 'SUSPICIOUS' ? "Không có tài liệu nào bị cảnh báo" :
                    statusFilter === 'FAILED' ? "Tuyệt vời, không có lỗi xử lý nào" :
                    statusFilter === 'PROCESSING' ? "Không có tài liệu nào đang xử lý" :
                    statusFilter === 'VERIFIED' ? "Chưa có tài liệu nào được xác thực" :
                    "Chưa có lịch sử xử lý tài liệu"
                  } 
                /> 
              }}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}
