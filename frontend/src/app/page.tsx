'use client';

import { Button, ConfigProvider } from 'antd';
import { 
  ArrowRightOutlined, 
  CheckCircleFilled, 
  ZoomInOutlined, 
  FileTextOutlined, 
  SafetyCertificateOutlined, 
  ThunderboltOutlined, 
  LockOutlined, 
  BarChartOutlined 
} from '@ant-design/icons';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#008080', // Teal
          borderRadius: 8,
          fontFamily: 'Inter, sans-serif',
        },
      }}
    >
      <div className="w-full bg-slate-50 min-h-screen font-sans">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur z-50 border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                D
              </div>
              <span className="text-xl font-bold text-slate-900 hidden sm:inline tracking-tight">DocuMind AI</span>
            </div>
            
            <div className="flex items-center gap-8 hidden md:flex">
              <a href="#features" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">
                Features
              </a>
              <a href="#workflow" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">
                How it works
              </a>
              <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors">
                Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button type="text" className="hidden sm:inline-flex font-semibold text-slate-600">
                  Đăng nhập
                </Button>
              </Link>
              <Button type="primary" className="font-semibold shadow-sm">
                Bắt đầu dùng thử
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
              <span className="inline-block w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-slate-600">
                Được tin dùng bởi các doanh nghiệp hàng đầu
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Xử lý tài liệu bằng AI
                <span className="text-teal-600 block mt-2">chính xác và hiệu quả</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mt-6">
                Tự động trích xuất dữ liệu, phát hiện chữ ký, xác minh con dấu và tự động hoá quy trình văn bản với độ chính xác cấp doanh nghiệp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button type="primary" size="large" className="h-12 px-8 text-base font-semibold shadow-md flex items-center gap-2">
                Trải nghiệm ngay
                <ArrowRightOutlined />
              </Button>
              <Button size="large" className="h-12 px-8 text-base font-semibold text-slate-700">
                Đặt lịch Demo
              </Button>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-20 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-slate-50 relative">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="flex flex-col items-center gap-4 text-slate-400 z-10">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  <ZoomInOutlined className="text-4xl text-teal-600" />
                </div>
                <p className="text-sm font-medium">Bản xem trước giao diện Demo</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted Metrics */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <p className="text-center text-sm font-bold tracking-widest text-slate-400 mb-10 uppercase">
              Đối tác tin cậy
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['BKDN', 'FPT Software', 'Viettel', 'VNPT'].map((company) => (
                <div key={company} className="h-12 flex items-center justify-center text-slate-800 text-2xl font-bold">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Workflow Visualization */}
        <section id="workflow" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                Xử lý tài liệu trong vài giây
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Từ lúc tải lên đến khi có kết quả. AI của chúng tôi xử lý sự phức tạp để bạn tập trung vào quyết định kinh doanh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {[
                { step: '1', title: 'Tải lên', desc: 'Hỗ trợ tải trực tiếp các định dạng PDF và Hình ảnh.' },
                { step: '2', title: 'Trích xuất', desc: 'Nhận diện OCR và trích xuất dữ liệu bằng AI mạnh mẽ.' },
                { step: '3', title: 'Xác minh', desc: 'Kiểm tra tính hợp lệ của chữ ký và con dấu.' },
                { step: '4', title: 'Hoàn tất', desc: 'Phân loại văn bản và lưu trữ vào cơ sở dữ liệu.' },
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-xl transition-all duration-300 h-full">
                    <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold text-xl mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:flex absolute top-1/2 -right-6 w-12 h-12 items-center justify-center text-slate-300 z-10 bg-white rounded-full">
                      <ArrowRightOutlined className="text-xl" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                Tính năng cấp doanh nghiệp
              </h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                Mọi thứ bạn cần để tự động hoá quy trình văn bản một cách an toàn và chính xác.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: ZoomInOutlined,
                  title: 'OCR Tiên tiến',
                  desc: 'Trích xuất văn bản từ hình ảnh và PDF với độ chính xác cao nhờ các model AI hiện đại.',
                },
                {
                  icon: SafetyCertificateOutlined,
                  title: 'Phát hiện Chữ ký',
                  desc: 'Tự động nhận dạng và phân tích vị trí chữ ký trong các văn bản pháp lý.',
                },
                {
                  icon: FileTextOutlined,
                  title: 'Trích xuất Dữ liệu',
                  desc: 'Hiểu ngữ nghĩa và phân loại văn bản (Công văn, Quyết định, Thông báo) tự động.',
                },
                {
                  icon: LockOutlined,
                  title: 'Bảo mật Tuyệt đối',
                  desc: 'Kiểm soát truy cập theo phân quyền (Role-based) và quản lý tài liệu theo chủ sở hữu.',
                },
                {
                  icon: ThunderboltOutlined,
                  title: 'Xác minh Con dấu',
                  desc: 'Phát hiện con dấu đỏ và đối chiếu để phát hiện các dấu hiệu giả mạo.',
                },
                {
                  icon: BarChartOutlined,
                  title: 'Thống kê Trực quan',
                  desc: 'Theo dõi tiến trình xử lý và chất lượng văn bản qua Dashboard thời gian thực.',
                },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="w-14 h-14 bg-teal-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                      <Icon className="text-2xl text-teal-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="preview" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
                  Quản lý tập trung, <br/><span className="text-teal-600">giao diện trực quan</span>
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  Theo dõi toàn bộ tiến trình xử lý văn bản trên một giao diện duy nhất. Trạng thái cập nhật theo thời gian thực (FSM), bộ lọc thông minh và các công cụ kiểm duyệt dễ sử dụng.
                </p>
                <div className="space-y-5">
                  {[
                    'Theo dõi trạng thái xử lý theo thời gian thực',
                    'Tìm kiếm ngữ nghĩa (Semantic Search)',
                    'Quy trình xác minh nhiều bước',
                    'Giao diện Dark/Light tuỳ chỉnh',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <CheckCircleFilled className="text-xl text-teal-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/dashboard" className="inline-block mt-4">
                  <Button type="primary" size="large" className="h-12 px-8 text-base font-semibold shadow-md flex items-center gap-2">
                    Xem Dashboard Demo
                    <ArrowRightOutlined />
                  </Button>
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl p-2 rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-square bg-white rounded-xl flex items-center justify-center border border-slate-100 relative overflow-hidden">
                   <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  <div className="flex flex-col items-center gap-4 text-slate-400 z-10">
                    <div className="w-24 h-24 bg-teal-50 rounded-2xl flex items-center justify-center shadow-sm border border-teal-100">
                      <FileTextOutlined className="text-5xl text-teal-600" />
                    </div>
                    <p className="text-base font-medium">Giao diện Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-teal-900 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { number: '1M+', label: 'Văn bản xử lý mỗi tháng' },
                { number: '99.8%', label: 'Độ chính xác trung bình' },
                { number: '24/7', label: 'Sẵn sàng hoạt động' },
              ].map((stat, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="text-5xl sm:text-6xl font-extrabold text-teal-400">{stat.number}</div>
                  <p className="text-teal-100 text-lg font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Sẵn sàng thay đổi cách bạn quản lý văn bản?
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Bắt đầu quá trình số hoá và tự động hoá ngay hôm nay với DocuMind AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button type="primary" size="large" className="h-14 px-10 text-lg font-semibold shadow-lg">
                Bắt đầu miễn phí
              </Button>
              <Button size="large" className="h-14 px-10 text-lg font-semibold text-slate-700">
                Liên hệ đội ngũ
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
              <div className="col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    D
                  </div>
                  <span className="text-xl font-bold text-slate-900">DocuMind AI</span>
                </div>
                <p className="text-slate-500 mb-6 max-w-sm">
                  Giải pháp quản lý và trích xuất dữ liệu văn bản thông minh dành cho doanh nghiệp hiện đại.
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Sản phẩm</h4>
                <ul className="space-y-4">
                  {['Tính năng', 'Bảng giá', 'Bảo mật', 'Tài liệu'].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Công ty</h4>
                <ul className="space-y-4">
                  {['Về chúng tôi', 'Blog', 'Tuyển dụng', 'Liên hệ'].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Pháp lý</h4>
                <ul className="space-y-4">
                  {['Chính sách', 'Điều khoản', 'Bảo mật', 'GDPR'].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-teal-600 font-medium transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 font-medium">
                &copy; 2026 DocuMind AI. Developed for PBL5 BKDN.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-slate-400 hover:text-teal-600 transition-colors">Twitter</a>
                <a href="#" className="text-slate-400 hover:text-teal-600 transition-colors">LinkedIn</a>
                <a href="#" className="text-slate-400 hover:text-teal-600 transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ConfigProvider>
  );
}
