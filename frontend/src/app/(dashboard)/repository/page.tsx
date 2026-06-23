'use client';
import { useState } from 'react';
import { 
  Table, Card, Input, Button, Tag, Space, 
  Typography, message, Popconfirm, Tooltip, theme, Row, Col, Empty, Tabs, Modal, Form, Select, Breadcrumb
} from 'antd';
import { 
  SearchOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  FolderAddOutlined,
  EditOutlined,
  SwapOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docService } from '@/services/api';
import { SkeletonTable } from '@/components/ui/SkeletonTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DocumentDetailDrawer } from '@/components/dashboard/DocumentDetailDrawer';

const { Title, Text } = Typography;

export default function RepositoryPage() {
  const { token } = theme.useToken();
  const isDarkMode = token.colorBgContainer === '#141414';
  const queryClient = useQueryClient();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Folders logic
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  
  // Modals
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderForm] = Form.useForm();
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedDocToMove, setSelectedDocToMove] = useState<string | null>(null);
  const [moveForm] = Form.useForm();

  // Fetch Docs
  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['docs', currentPage, pageSize, currentFolderId, activeTab],
    queryFn: () => docService.getDocs(
      pageSize, 
      (currentPage - 1) * pageSize, 
      currentFolderId || undefined, 
      activeTab === 'all' ? undefined : activeTab
    ).then(res => res.data),
    refetchInterval: (query: any) => {
      const items = query.state.data?.items || [];
      const hasPending = items.some((doc: any) => !['COMPLETED', 'FAILED'].includes(doc.status?.toUpperCase()));
      return hasPending ? 5000 : false;
    }
  });

  // Fetch Folders for Move Modal
  const { data: foldersData } = useQuery({
    queryKey: ['folders'],
    queryFn: () => docService.getDocs(100, 0, undefined, 'FOLDER').then(res => res.data.items),
  });

  const docs = resData?.items || [];
  const totalDocs = resData?.meta?.total || 0;

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
      message.success('Xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: () => message.error('Không thể xóa')
  });
  
  const createFolderMutation = useMutation({
    mutationFn: (name: string) => docService.createFolder(name),
    onSuccess: () => {
      message.success('Tạo thư mục thành công');
      setIsFolderModalOpen(false);
      folderForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });
  
  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => docService.renameFolder(id, name),
    onSuccess: () => {
      message.success('Đổi tên thư mục thành công');
      setIsFolderModalOpen(false);
      folderForm.resetFields();
      setEditingFolderId(null);
      queryClient.invalidateQueries({ queryKey: ['docs'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    }
  });
  
  const moveDocMutation = useMutation({
    mutationFn: ({ id, folderId }: { id: string, folderId: string | null }) => docService.moveDocument(id, folderId),
    onSuccess: () => {
      message.success('Di chuyển thành công');
      setIsMoveModalOpen(false);
      moveForm.resetFields();
      setSelectedDocToMove(null);
      queryClient.invalidateQueries({ queryKey: ['docs'] });
    }
  });

  const handleFolderSubmit = () => {
    folderForm.validateFields().then(values => {
      if (editingFolderId) {
        renameFolderMutation.mutate({ id: editingFolderId, name: values.name });
      } else {
        createFolderMutation.mutate(values.name);
      }
    });
  };

  const columns = [
    {
      title: 'Tên / Tiêu đề',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: true,
      render: (text: string, record: any) => {
        if (record.category === 'FOLDER') {
          return (
            <div 
              style={{ fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#1677ff' }}
              onClick={() => {
                setCurrentFolderId(record.id);
                setCurrentFolderName(record.file_name);
                setCurrentPage(1);
              }}
            >
              <FolderOutlined style={{ fontSize: 18 }} /> {text}
            </div>
          );
        }
        return <span style={{ fontWeight: 500 }}>{text}</span>;
      }
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        if (cat === 'FOLDER') return <Tag color="default">Thư mục</Tag>;
        return <Tag color="blue" style={{ borderRadius: 4 }}>{cat?.toUpperCase() || 'KHÁC'}</Tag>;
      }
    },
    {
      title: 'Thẩm định',
      key: 'verification',
      render: (_: any, record: any) => {
        if (record.category === 'FOLDER') return null;
        const vStatus = record.verification_status;
        if (vStatus === 'VERIFIED') return <Tag icon={<CheckCircleOutlined />} color="success">Hợp lệ</Tag>;
        if (vStatus === 'SUSPICIOUS') return <Tag icon={<ClockCircleOutlined />} color="warning">Nghi vấn</Tag>;
        return <Tag color="default">Chờ xử lý</Tag>;
      }
    },
    {
      title: 'Hệ thống',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => {
        if (record.category === 'FOLDER') return null;
        const color = status === 'COMPLETED' ? 'blue' : status === 'FAILED' ? 'error' : 'processing';
        return <Tag bordered={false} color={color}>{status?.toUpperCase() || 'PENDING'}</Tag>;
      }
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => {
        const isFolder = record.category === 'FOLDER';
        return (
          <Space size="middle">
            {!isFolder && (
              <Tooltip title="Xem chi tiết">
                <Button type="primary" shape="circle" icon={<EyeOutlined />} onClick={() => setSelectedDoc(record)} />
              </Tooltip>
            )}
            
            {isFolder ? (
              <Tooltip title="Đổi tên">
                <Button 
                  shape="circle" 
                  icon={<EditOutlined />} 
                  onClick={() => {
                    setEditingFolderId(record.id);
                    folderForm.setFieldsValue({ name: record.file_name });
                    setIsFolderModalOpen(true);
                  }} 
                />
              </Tooltip>
            ) : (
              <Tooltip title="Di chuyển">
                <Button 
                  shape="circle" 
                  icon={<SwapOutlined />} 
                  onClick={() => {
                    setSelectedDocToMove(record.id);
                    moveForm.setFieldsValue({ folderId: record.ai_results?.folder_id || null });
                    setIsMoveModalOpen(true);
                  }} 
                />
              </Tooltip>
            )}
            
            <Popconfirm
              title="Xác nhận thực hiện?"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button danger shape="circle" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const tabItems = [
    { key: 'all', label: 'All' },
    { key: 'Certificates', label: 'Certificates' },
    { key: 'Diplomas', label: 'Diplomas' },
    { key: 'Contracts', label: 'Contracts' },
    { key: 'Personal Documents', label: 'Personal Documents' },
    { key: 'Other', label: 'Other' }
  ];

  let displayDocs = searchResults || docs;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0, color: token.colorText }}>Không gian của tôi (My Space)</Title>
        <Space>
          <Button 
            icon={<FolderAddOutlined />} 
            onClick={() => {
              setEditingFolderId(null);
              folderForm.resetFields();
              setIsFolderModalOpen(true);
            }}
          >
            Tạo thư mục
          </Button>
          <Input.Search 
            placeholder="Tìm kiếm thông minh..." 
            onSearch={handleSearch}
            allowClear
            onChange={(e) => { if (!e.target.value) setSearchResults(null); }}
            style={{ width: 300 }}
          />
          <Button type="primary" icon={<UploadOutlined />}>Tải lên</Button>
        </Space>
      </div>

      <Card bordered={false}>
        {currentFolderId ? (
          <div style={{ marginBottom: 16 }}>
            <Breadcrumb
              items={[
                { 
                  title: <a onClick={() => { setCurrentFolderId(null); setCurrentFolderName(null); setCurrentPage(1); }}><HomeOutlined /> Root</a> 
                },
                { title: <><FolderOutlined /> {currentFolderName}</> }
              ]}
              style={{ fontSize: 16, marginBottom: 16, fontWeight: 500 }}
            />
          </div>
        ) : (
          <Tabs items={tabItems} activeKey={activeTab} onChange={(k) => { setActiveTab(k); setCurrentPage(1); }} style={{ marginBottom: 16 }} />
        )}
        
        {isLoading ? (
          <SkeletonTable columns={5} rowCount={8} />
        ) : (
          <Table 
            columns={columns} 
            dataSource={displayDocs} 
            rowKey="id" 
            locale={{ emptyText: <Empty description="Chưa có dữ liệu" /> }}
            pagination={{ 
              current: currentPage, pageSize: pageSize, total: totalDocs, showSizeChanger: true,
              onChange: (page, size) => { setCurrentPage(page); setPageSize(size); }
            }}
          />
        )}
      </Card>

      <DocumentDetailDrawer 
        document={selectedDoc} open={!!selectedDoc} onClose={() => setSelectedDoc(null)}
        onUpdate={() => refetch()}
      />

      <Modal
        title={editingFolderId ? "Đổi tên thư mục" : "Tạo thư mục mới"}
        open={isFolderModalOpen}
        onOk={handleFolderSubmit}
        onCancel={() => setIsFolderModalOpen(false)}
        confirmLoading={createFolderMutation.isPending || renameFolderMutation.isPending}
      >
        <Form form={folderForm} layout="vertical">
          <Form.Item name="name" label="Tên thư mục" rules={[{ required: true, message: 'Vui lòng nhập tên thư mục' }]}>
            <Input placeholder="Nhập tên..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Di chuyển tài liệu"
        open={isMoveModalOpen}
        onOk={() => {
          moveForm.validateFields().then(values => {
            if (selectedDocToMove) {
              moveDocMutation.mutate({ id: selectedDocToMove, folderId: values.folderId });
            }
          });
        }}
        onCancel={() => setIsMoveModalOpen(false)}
        confirmLoading={moveDocMutation.isPending}
      >
        <Form form={moveForm} layout="vertical">
          <Form.Item name="folderId" label="Chọn thư mục đích">
            <Select placeholder="Root (Không gian chính)" allowClear>
              <Select.Option value={null}>-- Về không gian chính (Root) --</Select.Option>
              {foldersData?.map((folder: any) => (
                <Select.Option key={folder.id} value={folder.id}>
                  <FolderOutlined style={{ marginRight: 8 }} /> {folder.file_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
