/**
 * Khoang gia THAM KHAO CUA THI TRUONG cho booking KOL/KOC tai Viet Nam.
 *
 * QUAN TRONG — day KHONG phai bao gia cua DST Group:
 * - So lieu lay tu cac trang bao gia cong khai cua ben thu ba (xem `sources`), khong
 *   phai bang gia noi bo cua DST.
 * - Bot buoc phai noi ro "khoang tham khao cua thi truong" moi lan dua so, va khong
 *   duoc dung no thay cho bao gia.
 * - Khi DST co bang gia chinh thuc, dat `isOfficialDstPricing = true` va thay du lieu
 *   ben duoi; phan con lai cua he thong khong phai sua gi.
 */

export type PriceTier = {
  tier: string;
  audience: string;
  range: string;
};

/** Chua duoc DST duyet lam bao gia chinh thuc. Doi co ban gia that thi bat co nay. */
export const isOfficialDstPricing = false;

/** Cap nhat lan cuoi khi tra cuu nguon cong khai. */
export const pricingCheckedAt = "2026-08-05";

export const bookingPriceReference: PriceTier[] = [
  { tier: "Nano KOL", audience: "1.000 - 10.000 follower", range: "1 - 5 triệu đồng" },
  { tier: "Micro KOL", audience: "10.000 - 50.000 follower", range: "5 - 10 triệu đồng" },
  { tier: "Mid-tier KOL", audience: "50.000 - 100.000 follower", range: "10 - 20 triệu đồng" },
  { tier: "Macro KOL", audience: "100.000 - 500.000 follower", range: "20 - 50 triệu đồng" },
  { tier: "Mega KOL", audience: "trên 500.000 follower", range: "từ 50 triệu đồng" },
  { tier: "Người nổi tiếng, nghệ sĩ", audience: "diễn viên, ca sĩ, hoa hậu", range: "30 - 280 triệu đồng" },
  { tier: "Vận động viên nổi tiếng", audience: "cầu thủ, VĐV quốc gia", range: "60 - 90 triệu đồng" },
];

/** Nhung thu lam gia thay doi. Day la kien thuc chung cua nganh, khong phai so lieu DST. */
export const pricingFactors = [
  "Lượng người theo dõi thật và mức độ tương tác, không chỉ số follower",
  "Nền tảng triển khai (TikTok, Facebook, Instagram, YouTube)",
  "Ngành hàng và giá trị sản phẩm",
  "Khối lượng công việc: số bài, thời lượng video, có livestream hay không",
  "Thời gian chiến dịch và quyền sử dụng hình ảnh sau chiến dịch",
  "Chi phí phát sinh: sản xuất, đi lại, lưu trú, phí quản lý",
];

export const pricingSources = [
  "blog.vn.revu.net/gia-book-kol",
  "achau.vn/thue-kols",
  "marketingai.vn",
];
