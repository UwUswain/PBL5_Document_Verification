import { WarningOutlined } from "@ant-design/icons";
import { docService } from "@/services/api";
import { theme } from 'antd';

interface AutoZoomCardProps {
  title: string;
  entity: any;
  notFoundText?: string;
}

export function AutoZoomCard({ title, entity, notFoundText = "KHÔNG TÌM THẤY" }: AutoZoomCardProps) {
  const { token } = theme.useToken();
  const cropUrl = entity?.crop_url ? (docService.getImageUrl(entity.crop_url) ?? undefined) : undefined;

  return (
    <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, background: token.colorBgContainer }}>
      <div style={{ padding: '8px 12px', background: token.colorBgLayout, borderBottom: `1px solid ${token.colorBorderSecondary}`, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
        <h5 style={{ margin: 0, fontSize: 11, fontWeight: 'bold', color: '#8c8c8c', textTransform: 'uppercase' }}>
          {title}
        </h5>
      </div>
      <div style={{ padding: 12 }}>
        {entity ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: 140, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgContainer, borderRadius: 4, border: `1px solid ${token.colorBorderSecondary}`, overflow: 'hidden' }}>
              {cropUrl ? (
                <img 
                  src={cropUrl} 
                  alt={title} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: 11, color: token.colorTextDescription }}>Đang trích xuất...</div>
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#1677ff', color: '#fff', fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 4 }}>
                AI DETECTED
              </span>
              <span style={{ fontSize: 11, color: token.colorTextDescription, fontFamily: 'monospace' }}>
                {Math.round(entity.confidence * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout, borderRadius: 4, border: `1px dashed ${token.colorBorder}` }}>
            <WarningOutlined style={{ fontSize: 24, color: token.colorTextDisabled }} />
            <div style={{ marginTop: 8, fontSize: 11, color: token.colorTextDisabled, fontWeight: 500, textTransform: 'uppercase' }}>
              {notFoundText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
