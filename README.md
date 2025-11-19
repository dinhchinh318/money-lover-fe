# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# ML-FE: Frontend

## I. Thiết lập môi trường

Để chạy được dự án Frontend, thực hiện các bước sau:

### 1. Cài đặt dependencies

Mở Terminal trong thư mục gốc của dự án và chạy:

```bash
npm install
````

### 2. Thiết lập biến môi trường

Tạo file **`.env.development`** ở thư mục gốc (ngang hàng với `package.json`):

```env
# URL backend
VITE_BACKEND_URL=http://localhost:5000
```

> Lưu ý: Không chia sẻ file `.env` chứa các khóa bí mật lên public repo.

### 3. Khởi động Frontend

```bash
npm run dev
```

Server FE sẽ chạy ở `http://localhost:<PORT>` (mặc định Vite thường là `5173`).

Nếu không khởi động được thì thường là bị lỗi cài file tailwind các thứ, tự giác mà cài, thường là cài bản tailwind3 nên tra stackoverflow để tránh bị trường hợp không init được mà thường này t làm rồi.

---

## II. Kiến trúc Frontend

Dự án tuân theo kiến trúc module hóa:

| Thư mục          | Vai trò                | Mô tả                                             |
| :--------------- | :--------------------- | :------------------------------------------------ |
| **`components`** | Giao diện & UI         | Chứa các component tái sử dụng toàn ứng dụng.     |
| **`pages`**      | Route & Layout         | Xử lý giao diện theo route, gọi service hoặc API. |
| **`services`**   | Logic kết nối backend  | Chứa các hàm gọi API, xử lý dữ liệu từ backend.   |
| **`components/context`**    | Quản lý state toàn cục | Ví dụ: `AppContext` để lưu trạng thái người dùng. |

---

## III. Quy ước viết code

### 1. Đặt tên

| Thành phần              | Quy tắc                   | Ví dụ                                |
| :---------------------- | :------------------------ | :----------------------------------- |
| **Hàm/Biến**            | camelCase                 | `loginAPI`, `fetchProducts`          |
| **Class/Model**         | PascalCase                | `UserService`, `ProductCard`         |
| **File**                | camelCase hoặc kebab-case | `authService.js`, `product-card.jsx` |
| **Hằng số (Constants)** | SCREAMING_SNAKE_CASE      | `ACCESS_TOKEN`, `API_URL`            |

### 2. API Naming

Ví dụ: `api.user.login()`, `api.product.getAll()`

> Nên tham khảo ES6 + async/await để hiểu cú pháp bất đồng bộ.

---

## IV. Quy tắc Git và quy trình làm việc

### 1. Branch

* **main/master**: Ổn định, không push trực tiếp.
* **develop**: Branch tích hợp chính. Merge các feature branch.
* **Feature Branch**: `feature/<ten-tinh-nang>`
  Ví dụ: `feature/auth-login`

### 2. Quy trình

1. **Cập nhật develop**:

```bash
git checkout develop
git pull origin develop
```

2. **Tạo branch mới**:

```bash
git checkout -b feature/<ten-tinh-nang>
```

3. **Commit code** theo quy tắc:

* `feat:` thêm tính năng
* `fix:` sửa lỗi
* `refactor:` tái cấu trúc
* `style:` thay đổi style/code format

Ví dụ: `feat: add login API call`

4. **Push & tạo Pull Request (PR)**:

```bash
git push origin feature/<ten-tinh-nang>
```

* Tạo PR từ branch của bạn sang `develop`.
* Gán Reviewer và chờ duyệt code.

### 3. Giải quyết xung đột (Conflict)

* Pull code mới nhất từ `develop`, giải quyết xung đột cục bộ, rồi push lại.
* Không merge lên `develop` nếu chưa xử lý conflict.

---

> **Tip:** Kiểm tra kỹ trước khi push, commit thường xuyên với thông tin rõ ràng, không push nhiều chức năng cùng lúc để tránh khó quản lý.

