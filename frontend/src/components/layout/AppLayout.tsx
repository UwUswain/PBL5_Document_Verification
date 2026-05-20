'use client';
import { Layout, Menu, Button, Dropdown, Avatar, ConfigProvider, theme, Popconfirm } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined,
  GlobalOutlined,
  BulbOutlined,
  BulbFilled,
  TeamOutlined
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import React, { useState, useEffect, useMemo } from 'react';
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

  const menuItems = useMemo(() => {
    const items: any[] = [
      {
        type: 'group',
        label: !collapsed && <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginLeft: 8 }}>MỤC LỤC</span>,
        children: [
          { key: '/dashboard', icon: <AppstoreOutlined />, label: t('dashboard') || 'Dashboard' },
          { key: '/repository', icon: <FileTextOutlined />, label: t('repository') || 'Repository' },
          { key: '/search', icon: <SearchOutlined />, label: t('search') || 'Search' },
        ]
      },
    ];

    if (user?.role === 'admin') {
      items.push({
        type: 'group',
        label: !collapsed && <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginLeft: 8 }}>ADMINISTRATION</span>,
        children: [
          { key: '/users', icon: <TeamOutlined />, label: 'User Management' },
        ]
      });
    }
    return items;
  }, [collapsed, user?.role, t]);

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: (
          <div onClick={(e) => e.stopPropagation()}>
            <Popconfirm
              title="Xác nhận thực hiện?"
              description="Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể hoàn tác."
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={logout}
            >
              <div style={{ width: '100%' }}>{t('logout') || 'Logout'}</div>
            </Popconfirm>
          </div>
        )
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
          width={240}
          style={{
            borderRight: isDarkMode ? '1px solid #303030' : '1px solid #e2e8f0',
            position: 'fixed',
            height: '100vh',
            left: 0,
            zIndex: 100,
            background: isDarkMode ? '#141414' : '#fff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 24px', fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.5px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4, fontSize: 16 }}>D</div>
            {!collapsed && <span>OCUMIND</span>}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            <Menu
              theme={isDarkMode ? "dark" : "light"}
              mode="inline"
              selectedKeys={[pathname]}
              items={menuItems}
              onClick={({ key }) => router.push(key)}
              style={{ borderRight: 'none' }}
            />
          </div>

          {!collapsed && (
            <div style={{
              padding: '16px',
              borderTop: isDarkMode ? '1px solid #303030' : '1px solid #f1f5f9',
              background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2563eb', flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isDarkMode ? '#f8fafc' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.full_name || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{user?.role?.toUpperCase() || 'MEMBER'}</div>
                </div>
              </div>
              <Popconfirm
                title="Xác nhận thực hiện?"
                description="Bạn có chắc chắn muốn thực hiện hành động này? Thao tác này không thể hoàn tác."
                okText="Xác nhận"
                cancelText="Hủy"
                onConfirm={logout}
              >
                <Button
                  type="text"
                  block
                  icon={<LogoutOutlined />}
                  style={{ textAlign: 'left', height: 36, borderRadius: 6, fontSize: 13, color: '#ef4444' }}
                >
                  Sign out
                </Button>
              </Popconfirm>
            </div>
          )}
        </Sider>
        <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s', background: isDarkMode ? '#0a0a0a' : '#f8fafc' }}>
          <Header style={{
            padding: '0 24px',
            background: isDarkMode ? '#141414' : '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            borderBottom: isDarkMode ? '1px solid #303030' : '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            height: 56,
            lineHeight: '56px'
          }}>
            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>
              {/* Breadcrumb or context could go here */}
            </div>

            <Button
              type="text"
              icon={isDarkMode ? <BulbFilled style={{ color: '#faad14' }} /> : <BulbOutlined />}
              onClick={toggleTheme}
            />

            <Dropdown menu={langMenu} placement="bottomRight">
              <Button type="text" icon={<GlobalOutlined />} style={{ fontSize: 12, fontWeight: 600 }}>
                {lang === 'vi' ? 'VI' : 'EN'}
              </Button>
            </Dropdown>

            {collapsed && (
              <Dropdown menu={userMenu} placement="bottomRight">
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2563eb', cursor: 'pointer' }} size="small" />
              </Dropdown>
            )}
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

