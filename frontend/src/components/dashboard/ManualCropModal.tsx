'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Radio, Space, Button, message, Typography, Alert } from 'antd';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { docService } from '@/services/api';

const { Text, Title } = Typography;

interface ManualCropModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  documentId: string;
  imageUrl: string;
}

export default function ManualCropModal({ 
  visible, 
  onCancel, 
  onSuccess, 
  documentId, 
  imageUrl 
}: ManualCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [type, setType] = useState<'seal' | 'signature'>('seal');
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (visible) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [visible]);

  const handleManualVerify = async () => {
    if (!completedCrop || !imgRef.current) {
      message.warning('Vui lòng khoanh vùng khu vực cần xác thực');
      return;
    }

    setLoading(true);
    try {
      // Tạo canvas để lấy dữ liệu ảnh vùng đã crop
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          image,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          completedCrop.width,
          completedCrop.height
        );
      }

      // Chuyển canvas thành Blob để gửi qua API
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Không thể tạo file ảnh từ vùng chọn');

      await docService.manualVerify(documentId, blob, type);

      message.success('Xác thực thủ công thành công!');
      onSuccess();
    } catch (error: any) {
      console.error('Manual verify error:', error);
      message.error(error.response?.data?.detail || 'Lỗi khi xác thực thủ công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Title level={4} style={{ margin: 0 }}>Xác thực thủ công (Human-in-the-loop)</Title>}
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="back" onClick={onCancel}>Hủy</Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading} 
          onClick={handleManualVerify}
          disabled={!completedCrop}
        >
          Xác nhận vùng chọn
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert 
          message="Hướng dẫn" 
          description="Hãy kéo chuột để khoanh vùng chính xác Con dấu hoặc Chữ ký bị AI bỏ sót trên ảnh gốc dưới đây." 
          type="info" 
          showIcon 
        />

        <Space direction="vertical">
          <Text strong>Loại thực thể xác thực:</Text>
          <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
            <Radio.Button value="seal">Con dấu (Stamp/Seal)</Radio.Button>
            <Radio.Button value="signature">Chữ ký (Signature)</Radio.Button>
          </Radio.Group>
        </Space>

        <div style={{ 
          border: '2px dashed #d9d9d9', 
          borderRadius: 8, 
          padding: 16, 
          background: '#fafafa',
          maxHeight: '600px',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img 
              ref={imgRef}
              src={imageUrl} 
              alt="Original Document" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </ReactCrop>
        </div>
      </Space>
    </Modal>
  );
}
