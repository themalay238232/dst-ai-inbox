# DST Group Website

Website doanh nghiệp đa trang cho DST Group. Dự án giữ nhận diện vàng cam và xanh xám đậm từ logo gốc, dùng React 19, Vinext và Vite để xuất bản trên GitHub Pages.

## Yêu cầu môi trường

- Node.js 22 trở lên
- npm 10 trở lên

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

Mở URL do Vinext in ra trong terminal. Để kiểm tra bản tĩnh dành cho GitHub Pages, chạy `npm run build:github-pages` và phục vụ thư mục `outputs/gh-pages-dist` bằng static server.

## Kiểm tra và build

```bash
npm run lint
npm run typecheck
npm run build
npm run build:github-pages
npm test
```

- `npm run build`: build ứng dụng Vinext và phần Worker liên quan.
- `npm run build:github-pages`: tạo static routes, `404.html` fallback, `sitemap.xml`, `robots.txt` và `.nojekyll` trong `outputs/gh-pages-dist`.
- `npm test`: chạy typecheck, build và kiểm tra HTML tĩnh cho GitHub Pages.

## Dữ liệu doanh nghiệp

Thông tin công khai được quản lý tập trung tại `data/companyConfig.ts`. Trường để trống sẽ không được render trên website, phù hợp với các dữ liệu chưa được doanh nghiệp phê duyệt công bố.

- `data/companyConfig.ts`: tên doanh nghiệp, liên hệ, địa chỉ, giờ làm việc, mạng xã hội, pháp lý và bản đồ.
- `data/company.ts`: dữ liệu được phép hiển thị ở phần giới thiệu, số liệu, khách hàng và đánh giá.
- `data/projects.ts`: dự án công khai. Chỉ dự án có cả `isVisible: true` và `isVerified: true` mới xuất hiện trên giao diện.
- `data/team.ts`: đội ngũ. Chỉ thành viên có `isVisible: true` mới xuất hiện.
- `data/careers.ts`: vị trí tuyển dụng. Chỉ vị trí có `isVisible: true` mới xuất hiện.
- `data/services.ts`: mô tả dịch vụ, phạm vi, đầu ra, quy trình và FAQ.
- `data/articles.ts`: bài viết, có thể thay bằng CMS hoặc API về sau.

Khi thêm dữ liệu khách hàng, dự án, số liệu hoặc testimonial, chỉ nhập thông tin đã có quyền công bố và đặt đúng cờ xác thực. Không thêm tên khách hàng, số liệu hoặc ảnh minh họa không có nguồn rõ ràng.

## Cấu hình form liên hệ

Form kiểm tra họ tên, số điện thoại Việt Nam, email, nội dung, đồng ý chính sách bảo mật, chống spam cơ bản và giới hạn gửi lặp lại. Form không giả lập gửi thành công.

1. Sao chép `.env.example` thành `.env.local`.
2. URL Google Apps Script hiện được cấu hình công khai trong `data/companyConfig.ts`. Có thể ghi đè khi build bằng biến môi trường:

```bash
VITE_DST_FORM_ENDPOINT=https://your-domain.example/api/contact
```

3. Google Apps Script cần nhận `POST` dạng `application/x-www-form-urlencoded` qua `e.parameter`, kiểm tra dữ liệu phía server và trả JSON `{ "ok": true }` khi đã tiếp nhận thành công. URL `/exec` là public endpoint, không phải secret; không đặt token, mật khẩu hộp thư hoặc API key trong frontend.

Khi chưa có endpoint, sau khi validate thành công website sẽ hướng người dùng sang kênh liên hệ trực tiếp đã cấu hình, thay vì thông báo gửi thành công không có thật. Không đặt token, mật khẩu hộp thư, webhook riêng tư hoặc secret trong `.env` phía frontend hay GitHub.

## AI Chat

AI Chat dùng URL proxy/Cloudflare Worker tại `window.__DST_CHAT_CONFIG__.apiUrl` trong `gh-pages-static/index.html`. API key không nằm trong frontend. Widget có fallback theo dữ liệu dịch vụ, giới hạn lịch sử localStorage, nút xóa lịch sử, thông báo bảo mật và các nút liên hệ trực tiếp.

Worker hiện có ở `ai-chat-worker/src/index.ts`. Chỉ cấu hình secret hoặc binding AI ở môi trường Worker/Cloudflare, không commit vào repository.

## Theo dõi chuyển đổi

`app/lib/tracking.ts` phát sự kiện trình duyệt `dst:conversion` cho các hành động như CTA tư vấn, gọi điện, Zalo, form, mở/gửi chat và xem dự án. Helper chỉ gọi `window.gtag` khi trang đã có cấu hình analytics bên ngoài; không chứa mã GA4 trong source.

Ví dụ lắng nghe sự kiện từ một script analytics đã được doanh nghiệp phê duyệt:

```ts
window.addEventListener("dst:conversion", (event) => {
  // Chuyển event sang hệ thống analytics đã cấu hình bên ngoài.
});
```

## GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` chạy khi push vào nhánh `main`:

1. `npm ci`
2. lint và TypeScript check
3. `npm run build:github-pages`
4. upload `outputs/gh-pages-dist`
5. deploy bằng GitHub Pages Actions chính thức

Trong repository settings, chọn **Pages > Source > GitHub Actions**. URL dự kiến:

`https://theluc205.github.io/websiteDST-ai-chat/`

Vite sử dụng base path `/websiteDST-ai-chat/`. Các route có metadata được tạo HTML tĩnh; route không tồn tại quay về SPA qua `404.html`, nên tải lại trực tiếp URL như `/websiteDST-ai-chat/dich-vu/marketing` vẫn hoạt động.
