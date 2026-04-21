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
    { role: 'assistant', content: 'Xin chào! Tôi có thể giúp gì cho bạn trong việc tìm kiếm và tóm tắt văn bản hôm nay?' }
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
    setIsLoading(true);

    try {
      const res = await docService.chat(userMsg);
      const botMsg = res.data?.reply || res.data?.message || 'Hệ thống AI đang bảo trì, vui lòng thử lại sau.';
      setMessages(prev => [...prev, { role: 'assistant', content: botMsg }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Đã có lỗi xảy ra khi kết nối với AI Server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {isOpen ? (
        <Card 
          bodyStyle={{ padding: 0 }}
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
            background: '#2563eb', // blue-600
            padding: '12px 16px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ fontSize: 20 }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>PBL5 AI Assistant</span>
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
                  icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                  style={{ background: msg.role === 'user' ? '#94a3b8' : '#2563eb', flexShrink: 0 }}
                  size="small"
                />
                <div style={{
                  background: msg.role === 'user' ? '#2563eb' : 'white',
                  color: msg.role === 'user' ? 'white' : '#334155',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  fontSize: 13,
                  maxWidth: '80%',
                  lineHeight: 1.5,
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Avatar icon={<RobotOutlined />} style={{ background: '#2563eb' }} size="small" />
                <div style={{ background: 'white', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <span className="animate-pulse text-slate-400 text-xs">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}
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
                loading={isLoading}
                style={{ background: '#2563eb' }}
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
          style={{ width: 60, height: 60, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)', background: '#2563eb' }}
        />
      )}
    </div>
  );
}
