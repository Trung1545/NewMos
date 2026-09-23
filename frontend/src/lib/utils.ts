import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hàm tiện ích kết hợp clsx và tailwind-merge để gộp CSS classes linh hoạt,
 * tự động loại bỏ xung đột Tailwind class khi ghi đè thuộc tính style.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng số tiền sang chuẩn Việt Nam Đồng (VND): ví dụ 2.500.000 ₫
 */
export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
}

