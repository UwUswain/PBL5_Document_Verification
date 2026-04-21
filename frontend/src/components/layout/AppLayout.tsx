'use client';

import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { 
  AppstoreOutlined, 
  FileTextOutlined, 
  SearchOutlined, 
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { docService } from '@/services/api';
import React, { useEffect, useState } from 'react';
import { AIChatWidget } from '@/components/ui/AIChatWidget';
import { useLanguage } from '@/providers/LanguageProvider';

const { Header, Sider, Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { lang, setLang, t } = useLanguage();

  // Check auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('pbl5_token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [router]);

  const menuItems = [
    { key: '/dashboard', icon: <AppstoreOutlined />, label: t('dashboard') },
    { key: '/repository', icon: <FileTextOutlined />, label: t('repository') },
    { key: '/search', icon: <SearchOutlined />, label: t('search') },
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: t('logout'),
        onClick: () => docService.logout()
      }
    ]
  };

  const langMenu = {
    items: [
      { key: 'vi', label: 'Tiếng Việt', onClick: () => setLang('vi') },
      { key: 'en', label: 'English', onClick: () => setLang('en') }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0' }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18, color: '#1677ff' }}>
          {collapsed ? 'P5' : 'PBL5 DOCS'}
        </div>
        <Menu 
          theme="light" 
          mode="inline" 
          selectedKeys={[pathname]} 
          items={menuItems} 
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Dropdown menu={langMenu} placement="bottomRight">
            <Button type="text" icon={<GlobalOutlined />}>
              {lang === 'vi' ? 'VI' : 'EN'}
            </Button>
          </Dropdown>
          
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span style={{ fontWeight: 500 }}>Administrator</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 24px', padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
      <AIChatWidget />
    </Layout>
  );
}
