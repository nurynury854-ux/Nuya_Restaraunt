import type { constants as enConstants } from "@/lib/i18n/dictionaries/en/constants";

export const constants: typeof enConstants = {
  diningMethod: {
    DINE_IN: "內用",
    PICKUP: "外帶自取",
    DELIVERY: "外送",
  },
  orderStatus: {
    PENDING: "處理中",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
  },
  paymentMethod: {
    CASH: "現金",
    TRANSFER: "銀行轉帳",
  },
};
