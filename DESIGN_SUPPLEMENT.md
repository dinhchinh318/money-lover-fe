# 📋 TÀI LIỆU BỔ SUNG THIẾT KẾ - Money Lover ver2

## 🎯 CÁC MODULE CÒN THIẾU VÀ CẦN BỔ SUNG

---

## 🔔 MODULE 11: NOTIFICATION SYSTEM {#module-11-notifications}

### Tổng quan API:
- ✅ GET /notification - Lấy tất cả thông báo
- ✅ GET /notification/unread - Lấy số lượng chưa đọc
- ✅ PATCH /notification/:id/read - Đánh dấu đã đọc
- ✅ PATCH /notification/read-all - Đánh dấu tất cả đã đọc
- ✅ DELETE /notification/:id - Xóa thông báo

### MÀN HÌNH 11.1: NOTIFICATION CENTER (Dropdown)
**Vị trí:** Icon Bell ở Header

**Components:**

**A. Notification Dropdown**
- Max height: 400px, scrollable
- Width: 360px
- Background: Trắng
- Border radius: 12px
- Shadow: Lớn

**B. Header Section**
- Tiêu đề: "Thông báo"
- Badge số lượng chưa đọc (màu đỏ)
- Nút "Đánh dấu tất cả đã đọc" (Secondary, nhỏ)

**C. Filter Tabs**
- 3 tabs: "Tất cả", "Chưa đọc", "Đã đọc"
- Active tab: Background primary nhạt

**D. Notification List**
- Mỗi notification = 1 item:
  - Icon loại (💰 Thu nhập, 💸 Chi tiêu, ⚠️ Cảnh báo, ✅ Thành công)
  - Tiêu đề (Bold, 14px)
  - Nội dung (12px, xám, truncate 2 dòng)
  - Thời gian (12px, xám nhạt, "2 phút trước")
  - Badge "Mới" nếu chưa đọc (màu đỏ)
  - Hover: Background #F9FAFB
  - Click: Đánh dấu đã đọc + Navigate đến trang liên quan

**E. Empty State**
- Icon Bell
- Text: "Chưa có thông báo nào"
- Màu xám nhạt

**F. Footer**
- Link "Xem tất cả" → Navigate /notifications

### MÀN HÌNH 11.2: NOTIFICATIONS PAGE
**Route:** /notifications

**Components:**

**A. Header Section**
- Tiêu đề: "Thông báo"
- Nút "Đánh dấu tất cả đã đọc" (Primary)

**B. Filter Bar**
- Tabs: "Tất cả", "Chưa đọc", "Đã đọc"
- Dropdown: "Loại thông báo" (Tất cả, Thu nhập, Chi tiêu, Cảnh báo, Thành công)
- Date range picker: "Từ ngày - Đến ngày"

**C. Notifications List**
- Grouped by Date (Hôm nay, Hôm qua, DD/MM/YYYY)
- Mỗi notification card:
  - Background trắng, border 1px #E5E7EB
  - Padding 16px
  - Icon loại lớn (48px)
  - Tiêu đề (Bold, 16px)
  - Nội dung đầy đủ
  - Thời gian chi tiết
  - Actions: Đánh dấu đã đọc, Xóa
  - Click: Navigate đến trang liên quan

**D. Pagination**
- Standard pagination component

**Flow xử lý:**
- Load page → Call API GET /notification
- Click notification → Đánh dấu đã đọc → Navigate
- Click "Đánh dấu tất cả đã đọc" → Call API → Reload

---

## 🔍 MODULE 12: SEARCH FUNCTIONALITY {#module-12-search}

### Tổng quan API:
- ✅ GET /search?q=...&type=... - Tìm kiếm toàn diện

### MÀN HÌNH 12.1: GLOBAL SEARCH (Header)
**Vị trí:** Search bar ở Header (giữa Logo và Navigation)

**Components:**

**A. Search Input**
- Width: 300px (desktop), full width (mobile)
- Placeholder: "Tìm kiếm giao dịch, ví, danh mục..."
- Icon: 🔍 (bên trái)
- Clear button: X (bên phải, khi có text)
- Keyboard shortcut: Ctrl+K / Cmd+K

**B. Search Dropdown (Khi typing)**
- Max height: 400px
- Background: Trắng
- Border radius: 12px
- Shadow: Lớn

**C. Quick Results**
- Section "Giao dịch" (Top 5)
- Section "Ví" (Top 3)
- Section "Danh mục" (Top 3)
- Mỗi item: Icon, Tên, Loại, Số tiền (nếu có)
- Highlight text khớp (màu primary)

**D. Footer**
- Link "Xem tất cả kết quả cho '[query]'" → Navigate /search?q=...

### MÀN HÌNH 12.2: SEARCH RESULTS PAGE
**Route:** /search?q=...

**Components:**

**A. Header Section**
- Search input lớn (giữ nguyên query)
- Số lượng kết quả: "Tìm thấy X kết quả cho '[query]'"

**B. Filter Tabs**
- 4 tabs: "Tất cả", "Giao dịch", "Ví", "Danh mục"
- Active tab: Background primary

**C. Results Sections**

**Section 1: Giao dịch**
- List giao dịch với filter
- Mỗi item: Icon, Tên, Số tiền, Ngày
- Highlight text khớp

**Section 2: Ví**
- Grid ví cards
- Highlight text khớp

**Section 3: Danh mục**
- Grid category cards
- Highlight text khớp

**D. Empty State**
- Icon Search
- Text: "Không tìm thấy kết quả nào"
- Suggestion: "Thử tìm kiếm với từ khóa khác"

**Flow xử lý:**
- Type query → Debounce 300ms → Call API
- Show dropdown với quick results
- Click item → Navigate đến trang chi tiết
- Click "Xem tất cả" → Navigate /search với filter

---

## 📤 MODULE 13: EXPORT/IMPORT DATA {#module-13-export-import}

### Tổng quan API:
- ✅ GET /export/transactions?format=... - Xuất giao dịch
- ✅ POST /import/transactions - Nhập giao dịch
- ✅ GET /export/reports?format=... - Xuất báo cáo

### MÀN HÌNH 13.1: EXPORT DATA
**Route:** /settings/export

**Components:**

**A. Header Section**
- Tiêu đề: "Xuất dữ liệu"
- Mô tả: "Tải xuống dữ liệu của bạn dưới dạng file"

**B. Export Options Cards**

**Card 1: Giao dịch**
- Icon: 📊
- Title: "Xuất Giao dịch"
- Description: "Tải xuống tất cả giao dịch của bạn"
- Options:
  - Format: Radio (Excel, CSV, PDF)
  - Date range: Date range picker
  - Loại: Checkboxes (Thu nhập, Chi tiêu, Chuyển tiền...)
  - Ví: Multi-select dropdown
- Button: "Xuất ngay" (Primary)

**Card 2: Báo cáo**
- Icon: 📈
- Title: "Xuất Báo cáo"
- Description: "Tải xuống báo cáo tài chính"
- Options:
  - Format: Radio (PDF, Excel)
  - Loại báo cáo: Radio (Theo thời gian, Theo danh mục, Theo ví)
  - Kỳ: Radio (Tháng này, Quý này, Năm này, Tùy chỉnh)
- Button: "Xuất ngay" (Primary)

**Card 3: Toàn bộ dữ liệu**
- Icon: 💾
- Title: "Sao lưu toàn bộ"
- Description: "Tải xuống tất cả dữ liệu (JSON)"
- Warning: "File này chứa tất cả thông tin của bạn"
- Button: "Tải xuống" (Primary)

**C. Export History**
- Table: Ngày xuất, Loại, Format, Kích thước, Actions (Tải lại, Xóa)

**Flow xử lý:**
- Chọn options → Click "Xuất" → Show loading
- Call API → Download file
- Lưu vào export history

### MÀN HÌNH 13.2: IMPORT DATA
**Route:** /settings/import

**Components:**

**A. Header Section**
- Tiêu đề: "Nhập dữ liệu"
- Mô tả: "Tải lên file để nhập dữ liệu vào hệ thống"

**B. Import Options**

**Option 1: Nhập từ file sao lưu**
- Upload zone: Drag & drop hoặc click để chọn
- Accept: .json
- Preview: Hiển thị thông tin file (Số giao dịch, Ví, Danh mục...)
- Options:
  - Checkbox: "Ghi đè dữ liệu hiện có"
  - Checkbox: "Chỉ nhập giao dịch mới"
- Button: "Nhập dữ liệu" (Primary)

**Option 2: Nhập từ Excel/CSV**
- Upload zone: Accept .xlsx, .csv
- Template download: Link "Tải mẫu file"
- Preview table: Hiển thị 10 dòng đầu
- Column mapping: Map columns từ file với fields hệ thống
- Validation: Hiển thị lỗi nếu có
- Button: "Nhập dữ liệu" (Primary)

**C. Import Progress**
- Progress bar: % hoàn thành
- Status: "Đang nhập... X/Y giao dịch"
- Cancel button

**D. Import Results**
- Summary: Tổng số, Thành công, Lỗi
- Table lỗi: Dòng, Lý do lỗi
- Button: "Tải xuống báo cáo lỗi" (Secondary)

**Flow xử lý:**
- Upload file → Validate → Preview
- Map columns (nếu CSV/Excel)
- Click "Nhập" → Show progress → Call API
- Show results → Reload data

---

## ⚙️ MODULE 14: SETTINGS & PREFERENCES {#module-14-settings}

### Tổng quan API:
- ✅ GET /settings - Lấy cài đặt
- ✅ PUT /settings - Cập nhật cài đặt

### MÀN HÌNH 14.1: SETTINGS PAGE
**Route:** /settings

**Layout:** Tabs navigation

**Tab 1: Tài khoản**
- Avatar upload với preview
- Form: Họ tên, Email (readonly), Số điện thoại, Địa chỉ
- Button: "Lưu thay đổi" (Primary)

**Tab 2: Bảo mật**
- Section "Đổi mật khẩu":
  - Mật khẩu hiện tại (password)
  - Mật khẩu mới (password)
  - Xác nhận mật khẩu mới (password)
  - Button: "Đổi mật khẩu" (Primary)
- Section "Xác thực 2 lớp":
  - Toggle: Bật/Tắt 2FA
  - QR code (khi bật)
  - Backup codes

**Tab 3: Tùy chỉnh**
- Section "Ngôn ngữ":
  - Radio: Tiếng Việt, English
- Section "Theme":
  - Radio: Sáng, Tối, Tự động
- Section "Định dạng tiền tệ":
  - Dropdown: VND, USD, EUR...
  - Input: Format hiển thị
- Section "Ngày tháng":
  - Radio: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- Button: "Lưu cài đặt" (Primary)

**Tab 4: Thông báo**
- Section "Email":
  - Checkbox: "Nhận email thông báo"
  - Checkbox: "Nhận email báo cáo hàng tuần"
  - Checkbox: "Nhận email cảnh báo ngân sách"
- Section "Push":
  - Toggle: "Bật thông báo đẩy"
  - Checkboxes: Các loại thông báo
- Button: "Lưu cài đặt" (Primary)

**Tab 5: Dữ liệu**
- Section "Xuất dữ liệu":
  - Link: "Xuất giao dịch" → /settings/export
  - Link: "Sao lưu toàn bộ" → /settings/export
- Section "Nhập dữ liệu":
  - Link: "Nhập từ file" → /settings/import
- Section "Xóa dữ liệu":
  - Warning: "Hành động này không thể hoàn tác"
  - Button: "Xóa tất cả giao dịch" (Danger)
  - Button: "Xóa tài khoản" (Danger, với confirm modal)

**Tab 6: Giới thiệu**
- Version: "Money Lover ver2 v1.0.0"
- Links: "Điều khoản sử dụng", "Chính sách bảo mật", "Hỗ trợ"
- Button: "Kiểm tra cập nhật"

---

## 👤 MODULE 15: PROFILE MANAGEMENT {#module-15-profile}

### MÀN HÌNH 15.1: PROFILE PAGE
**Route:** /profile

**Components:**

**A. Profile Header Card**
- Avatar lớn (120px) với upload overlay
- Tên người dùng (24px, Bold)
- Email (16px, xám)
- Badge: "Thành viên từ [tháng/năm]"
- Button: "Chỉnh sửa hồ sơ" (Secondary)

**B. Stats Cards (3 cards ngang)**
- Card 1: Tổng giao dịch
- Card 2: Số ví đang dùng
- Card 3: Ngân sách đang theo dõi

**C. Tabs Section**

**Tab 1: Thông tin cá nhân**
- Form: Họ tên, Email (readonly), Số điện thoại, Địa chỉ, Ngày sinh, Giới tính, Mô tả
- Button: "Lưu thay đổi" (Primary)

**Tab 2: Hoạt động gần đây**
- Timeline: Các hoạt động (Tạo giao dịch, Thêm ví, Tạo ngân sách...)
- Mỗi item: Icon, Mô tả, Thời gian

**Tab 3: Thành tích**
- Badges grid:
  - "Người mới" (Khi đăng ký)
  - "Tiết kiệm giỏi" (Tiết kiệm 1 triệu)
  - "Quản lý tốt" (10 ngân sách)
  - "Chuyên nghiệp" (100 giao dịch)
- Progress bars cho các mục tiêu

**Tab 4: Liên kết tài khoản**
- Social accounts: Google, Facebook (nếu có)
- Button: "Liên kết Google" / "Liên kết Facebook"

---

## 🛡️ MODULE 16: ERROR HANDLING & ERROR BOUNDARIES {#module-16-error-handling}

### Component: ErrorBoundary
**Vị trí:** Wrap toàn bộ App

**Components:**

**A. Error Fallback UI**
- Icon: ⚠️ (lớn, màu đỏ)
- Title: "Đã xảy ra lỗi!"
- Message: "Ứng dụng gặp sự cố không mong muốn"
- Details: (Chỉ trong development)
- Actions:
  - Button: "Làm mới trang" (Primary)
  - Button: "Quay về trang chủ" (Secondary)
  - Button: "Báo lỗi" (Secondary) → Mở modal báo lỗi

**B. Error Reporting Modal**
- Form: Mô tả lỗi, Các bước tái hiện
- Button: "Gửi báo cáo" (Primary)

### Error States cho từng Component:

**1. API Error**
- Toast notification: "Có lỗi xảy ra: [message]"
- Retry button trong toast
- Fallback UI trong component

**2. Network Error**
- Toast: "Không có kết nối mạng"
- Offline indicator ở Header
- Retry button

**3. 404 Error**
- Page: "Không tìm thấy trang"
- Illustration
- Link: "Quay về trang chủ"

**4. 403 Error**
- Page: "Bạn không có quyền truy cập"
- Link: "Quay về trang chủ"

**5. 500 Error**
- Toast: "Lỗi máy chủ"
- Retry button

---

## 📱 MODULE 17: MOBILE-SPECIFIC FEATURES {#module-17-mobile}

### MÀN HÌNH 17.1: BOTTOM NAVIGATION (Mobile)
**Vị trí:** Fixed bottom, chỉ hiển thị trên mobile (< 768px)

**Components:**
- 5 tabs: Home, Transactions, Wallets, Reports, Profile
- Active tab: Màu primary, icon filled
- Badge số lượng (nếu có) trên icon

### MÀN HÌNH 17.2: SWIPE GESTURES
**Features:**
- Swipe left trên transaction → Hiện actions (Sửa, Xóa)
- Swipe right trên transaction → Đánh dấu đã đọc (nếu notification)
- Pull to refresh: Kéo xuống để reload

### MÀN HÌNH 17.3: MOBILE OPTIMIZATIONS
**Features:**
- Touch-friendly buttons (min 44x44px)
- Larger text trên mobile
- Simplified filters (Accordion thay vì nhiều dropdowns)
- Bottom sheets cho modals
- Haptic feedback khi actions

---

## ♿ MODULE 18: ACCESSIBILITY {#module-18-accessibility}

### Features:

**1. Keyboard Navigation**
- Tab order hợp lý
- Focus indicators rõ ràng
- Keyboard shortcuts:
  - Ctrl+K: Search
  - Ctrl+N: New transaction
  - Esc: Close modal
  - Arrow keys: Navigate lists

**2. Screen Reader Support**
- ARIA labels cho tất cả interactive elements
- Alt text cho images
- Role attributes
- Live regions cho dynamic content

**3. Color Contrast**
- Đảm bảo WCAG AA (4.5:1 cho text)
- Không chỉ dựa vào màu sắc để truyền đạt thông tin

**4. Focus Management**
- Focus trap trong modals
- Return focus sau khi đóng modal
- Skip to content link

---

## ⚡ MODULE 19: PERFORMANCE OPTIMIZATION {#module-19-performance}

### Features:

**1. Code Splitting**
- Lazy load routes
- Dynamic imports cho heavy components
- Chunk optimization

**2. Image Optimization**
- Lazy loading images
- WebP format với fallback
- Responsive images (srcset)

**3. Caching Strategy**
- Service Worker cho offline
- Cache API responses
- Local storage cho user preferences

**4. Virtual Scrolling**
- Cho long lists (transactions, notifications)
- Chỉ render visible items

**5. Debouncing & Throttling**
- Search input: Debounce 300ms
- Scroll events: Throttle
- Resize events: Throttle

**6. Memoization**
- React.memo cho components
- useMemo cho expensive calculations
- useCallback cho event handlers

---

## 🎨 MODULE 20: THEME SYSTEM {#module-20-theme}

### MÀN HÌNH 20.1: THEME SWITCHER
**Vị trí:** Settings page hoặc Header

**Components:**

**A. Theme Options**
- Radio buttons:
  - 🌞 Sáng (Light)
  - 🌙 Tối (Dark)
  - 🔄 Tự động (Auto - theo system)

**B. Color Customization (Premium)**
- Primary color picker
- Preview: Xem trước màu trên UI
- Reset button

**C. Theme Preview**
- Live preview của các components
- Apply button

**Flow xử lý:**
- Chọn theme → Apply ngay lập tức
- Lưu vào localStorage
- Persist qua sessions

---

## 📊 MODULE 21: DASHBOARD WIDGETS {#module-21-widgets}

### MÀN HÌNH 21.1: CUSTOMIZABLE DASHBOARD
**Route:** /dashboard

**Components:**

**A. Widget Grid**
- Drag & drop để sắp xếp
- Resize widgets
- Add/Remove widgets

**B. Available Widgets**
- Quick Stats (4 cards)
- Recent Transactions
- Spending Chart
- Budget Overview
- Category Breakdown
- Income vs Expense
- Monthly Trend
- Top Categories
- Wallet Balances
- Upcoming Bills

**C. Widget Settings**
- Click icon ⚙️ trên widget → Mở settings
- Customize: Date range, Filters, Display options

**Flow xử lý:**
- Drag widget → Update layout → Save
- Resize widget → Update size → Save
- Add widget → Show modal → Select widget → Add
- Remove widget → Confirm → Remove

---

## 🔐 MODULE 22: SECURITY FEATURES {#module-22-security}

### Features:

**1. Session Management**
- Auto logout sau 30 phút không hoạt động
- Warning modal trước khi logout (5 phút)
- Extend session button

**2. Activity Log**
- Route: /settings/activity
- Table: Thời gian, Hoạt động, IP, Device
- Filter: Date range, Loại hoạt động

**3. Device Management**
- Route: /settings/devices
- List: Tất cả devices đã đăng nhập
- Actions: Logout device, Rename device
- Current device: Highlight

**4. Password Strength**
- Indicator khi đổi mật khẩu
- Requirements: Min 8 chars, uppercase, lowercase, number, special char

---

## 📈 MODULE 23: ADVANCED ANALYTICS {#module-23-advanced-analytics}

### MÀN HÌNH 23.1: CUSTOM REPORTS BUILDER
**Route:** /reports/builder

**Components:**

**A. Report Builder**
- Drag & drop chart types
- Select data sources
- Apply filters
- Customize appearance

**B. Chart Types**
- Line Chart
- Bar Chart
- Pie Chart
- Area Chart
- Scatter Plot
- Heatmap

**C. Save & Share**
- Save report với tên
- Share link (nếu public)
- Export report

---

## 🎯 TỔNG KẾT CÁC MODULE CẦN IMPLEMENT

### Priority 1 (Core Features):
1. ✅ Module 3: Transaction Management
2. ✅ Module 4: Wallet Management
3. ⚠️ Module 5: Category Management (Cần implement)
4. ⚠️ Module 6: Budget Management (Cần implement)
5. ⚠️ Module 10: Saving Goals (Cần implement)
6. ⚠️ Module 9: Recurring Bills (Cần implement)

### Priority 2 (Important Features):
7. ⚠️ Module 11: Notification System (Cần implement)
8. ⚠️ Module 12: Search Functionality (Cần implement)
9. ⚠️ Module 14: Settings Page (Cần implement)
10. ⚠️ Module 15: Profile Management (Cần implement)

### Priority 3 (Enhancement Features):
11. ⚠️ Module 13: Export/Import Data (Cần implement)
12. ⚠️ Module 16: Error Handling (Cần implement)
13. ⚠️ Module 17: Mobile Features (Cần implement)
14. ⚠️ Module 18: Accessibility (Cần implement)
15. ⚠️ Module 19: Performance (Cần implement)
16. ⚠️ Module 20: Theme System (Cần implement)
17. ⚠️ Module 21: Dashboard Widgets (Cần implement)
18. ⚠️ Module 22: Security Features (Cần implement)
19. ⚠️ Module 23: Advanced Analytics (Cần implement)

---

## 📝 NOTES

- Tất cả các module đều sử dụng Design System đã định nghĩa
- Responsive design cho tất cả màn hình
- Loading states và empty states cho mọi component
- Error handling và validation đầy đủ
- Accessibility theo WCAG 2.1 AA
- Performance optimization với code splitting và lazy loading

