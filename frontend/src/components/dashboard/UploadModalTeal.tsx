import React from 'react';
import { Modal, Upload, Typography, Button, ConfigProvider } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Text } = Typography;
const { Dragger } = Upload;

interface UploadModalTealProps {
  open: boolean;
  onCancel: () => void;
  customRequest: UploadProps['customRequest'];
  isUploading: boolean;
}

export const UploadModalTeal: React.FC<UploadModalTealProps> = ({ 
  open, 
  onCancel, 
  customRequest,
  isUploading
}) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#008080', // Teal
          borderRadius: 8,
        },
      }}
    >
      <Modal
        title={
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            Upload files
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={600}
        centered
        closable={!isUploading}
        maskClosable={!isUploading}
        styles={{
          mask: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(15, 23, 42, 0.4)', // Darker translucent mask to make the light modal pop
          },
          body: {
            padding: 24,
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <div style={{ marginTop: 24 }}>
          <Dragger
            customRequest={customRequest}
            showUploadList={false}
            accept="image/*,.pdf"
            disabled={isUploading}
            style={{
              padding: '40px 20px',
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: 12,
              transition: 'all 0.3s'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#e6f2f2', color: '#008080', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24
              }}>
                <UploadOutlined />
              </div>
              <div>
                <Text strong style={{ fontSize: 16, color: '#334155', display: 'block', marginBottom: 8 }}>
                  Drag and drop files here
                </Text>
                <Button 
                  type="primary" 
                  size="large" 
                  loading={isUploading}
                  style={{ borderRadius: 8, fontWeight: 600, padding: '0 32px' }}
                >
                  Choose files
                </Button>
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Support PDF and Images (JPG, PNG)
              </Text>
            </div>
          </Dragger>
        </div>
      </Modal>
    </ConfigProvider>
  );
};
