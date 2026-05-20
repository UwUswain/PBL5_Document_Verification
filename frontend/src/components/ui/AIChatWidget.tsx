'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Avatar } from 'antd';
import { MessageOutlined, CloseOutlined, SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { docService } from '@/services/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Chào bạn, quyết định cung cấp thông tin này bạn xin ở Sở tư pháp lâu không ạ?' },
    { role: 'user', content: 'Chào bạn, tầm 2-3 ngày làm việc là có kết quả nhé.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {isOpen ? (
        <Card 
          styles={{ body: { padding: 0 } }}
          style={{ 
            width: 350, 
            height: 500, 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ 
            background: '#008080', // Teal
            padding: '12px 16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="animate-pulse" style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>💬 Hộp thư trực tuyến</span>
                <span style={{ fontSize: 10, opacity: 0.9 }}>(Connected via WebSockets)</span>
              </div>
            </div>
            <Button 
              type="text" 
              icon={<CloseOutlined style={{ color: 'white' }} />} 
              onClick={() => setIsOpen(false)}
              style={{ padding: 4, height: 'auto' }}
            />
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                gap: 8, 
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ background: msg.role === 'user' ? '#008080' : '#94a3b8', flexShrink: 0 }}
                  size="small"
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{msg.role === 'user' ? 'Bạn' : 'User_Ẩn_Danh_99'}</span>
                  <div style={{
                    background: msg.role === 'user' ? '#008080' : 'white',
                    color: msg.role === 'user' ? 'white' : '#334155',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    fontSize: 13,
                    maxWidth: 220,
                    lineHeight: 1.5,
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 12, borderTop: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input 
                placeholder="Hỏi AI về văn bản..." 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                disabled={isLoading}
                bordered={false}
                style={{ background: '#f1f5f9', borderRadius: 4 }}
              />
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                style={{ background: '#008080' }}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Button 
          type="primary" 
          shape="circle" 
          size="large"
          icon={<MessageOutlined style={{ fontSize: 24 }} />} 
          onClick={() => setIsOpen(true)}
          style={{ width: 60, height: 60, boxShadow: '0 4px 12px rgba(0, 128, 128, 0.4)', background: '#008080' }}
        />
      )}
    </div>
  );
}
