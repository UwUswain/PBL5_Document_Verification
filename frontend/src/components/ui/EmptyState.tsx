'use client';

import { Empty, Button, Typography } from 'antd';
import { UploadOutlined, FileSearchOutlined } from '@ant-design/icons';
import React from 'react';

const { Text } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionText?: string;
  actionIcon?: React.ReactNode;
  icon?: React.ReactNode;
  type?: 'docs' | 'search' | 'default';
  transparent?: boolean;
}

export function EmptyState({ 
  title, 
  description, 
  onAction, 
  actionText = "Tải lên ngay", 
  actionIcon,
  icon,
  type = 'docs',
  transparent = false
}: EmptyStateProps) {
  
  const defaultIcon = type === 'search' ? <FileSearchOutlined style={{ fontSize: 64, color: '#bfbfbf' }} /> : undefined;
  const defaultTitle = type === 'search' ? "Không tìm thấy kết quả" : "Kho tài liệu trống";
  const defaultDesc = type === 'search' 
    ? "Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại nội dung văn bản." 
    : "Có vẻ như bạn chưa tải lên văn bản nào. Hãy bắt đầu bằng cách tải lên tài liệu đầu tiên!";

  return (
    <div style={{ 
      padding: '60px 0', 
      textAlign: 'center', 
      background: transparent ? 'transparent' : '#fff', 
      borderRadius: 8 
    }}>
      <Empty
        image={icon || defaultIcon || Empty.PRESENTED_IMAGE_SIMPLE}
        imageStyle={{ height: 120 }}
        description={
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#262626', marginBottom: 8 }}>
              {title || defaultTitle}
            </div>
            <Text type="secondary" style={{ maxWidth: 400, display: 'inline-block' }}>
              {description || defaultDesc}
            </Text>
          </div>
        }
      >
        {onAction && (
          <Button 
            type="primary" 
            icon={actionIcon || (type === 'docs' ? <UploadOutlined /> : undefined)} 
            size="large" 
            onClick={onAction}
            style={{ marginTop: 16, borderRadius: 6, height: 40, padding: '0 24px' }}
          >
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
