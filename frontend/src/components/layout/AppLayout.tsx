'use client';
import { Layout, Menu, Button, Dropdown, Avatar, ConfigProvider, theme } from 'antd';
import { 
  AppstoreOutlined, 
  FileTextOutlined, 
  SearchOutlined, 
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import React, { useState, useEffect } from 'react';
import { AIChatWidget } from '@/components/ui/AIChatWidget';
import { useLanguage } from '@/providers/LanguageProvider';

const { Header, Sider, Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const menuItems = [
    { key: '/dashboard', icon: <AppstoreOutlined />, label: t('dashboard') || 'Dashboard' },
    { key: '/repository', icon: <FileTextOutlined />, label: t('repository') || 'Repository' },
    { key: '/search', icon: <SearchOutlined />, label: t('search') || 'Search' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/users',
      icon: <UserOutlined />,
      label: 'Quản lý người dùng'
    });
  }

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: t('logout') || 'Logout',
        onClick: logout
      }
    ]
  };

  const langMenu = {
    items: [
      { key: 'vi', label: 'Tiếng Việt', onClick: () => setLang('vi') },
      { key: 'en', label: 'English', onClick: () => setLang('en') }
    ]
  };

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: isDarkMode ? '#000' : '#f5f5f5', color: isDarkMode ? '#fff' : '#000' }}>Đang khởi tạo hệ thống...</div>;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={(value) => setCollapsed(value)}
          theme={isDarkMode ? "dark" : "light"}
          style={{ 
            borderRight: isDarkMode ? 'none' : '1px solid #f0f0f0', 
            position: 'fixed', 
            height: '100vh', 
            left: 0, 
            zIndex: 100,
            boxShadow: isDarkMode ? '4px 0 10px rgba(0,0,0,0.5)' : 'none'
          }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, color: '#1677ff' }}>
            {collapsed ? 'P5' : 'DOCUMIND'}
          </div>
          <Menu 
            theme={isDarkMode ? "dark" : "light"}
            mode="inline" 
            selectedKeys={[pathname]} 
            items={menuItems} 
            onClick={({ key }) => router.push(key)}
          />
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s', background: isDarkMode ? '#0a0a0a' : '#f5f7fa' }}>
          <Header style={{ 
            padding: '0 24px', 
            background: isDarkMode ? '#141414' : '#fff', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            gap: 16, 
            borderBottom: isDarkMode ? '1px solid #303030' : '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 99
          }}>
            <Button 
              type="text" 
              icon={isDarkMode ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />} 
              onClick={toggleTheme}
            />

            <Dropdown menu={langMenu} placement="bottomRight">
              <Button type="text" icon={<GlobalOutlined />}>
                {lang === 'vi' ? 'VI' : 'EN'}
              </Button>
            </Dropdown>
            
            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <span style={{ fontWeight: 500 }}>{user?.full_name || user?.email || 'User'}</span>
              </div>
            </Dropdown>
          </Header>
          <Content style={{ margin: '24px', padding: 0, minHeight: 280 }}>
            {children}
          </Content>
        </Layout>
        <AIChatWidget />
      </Layout>
    </ConfigProvider>
  );
}

