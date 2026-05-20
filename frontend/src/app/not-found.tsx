'use client';

import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn truy cập không tồn tại hoặc đã bị di dời."
        extra={
          <Button 
            type="primary" 
            onClick={() => router.push('/dashboard')}
            style={{ backgroundColor: '#008080', borderColor: '#008080' }}
          >
            Về Trang Chủ
          </Button>
        }
      />
    </div>
  );
}
