import type { adminKitchen as enAdminKitchen } from "@/lib/i18n/dictionaries/en/adminKitchen";

export const adminKitchen: typeof enAdminKitchen = {
  display: {
    subtitle: "廚房顯示螢幕・{count} 筆處理中",
    exit: "離開",
    noPendingOrders: "目前沒有處理中的訂單",
    tableSuffix: "・桌號 {tableNumber}",
    markComplete: "標記為已完成",
  },
  print: {
    loginPrompt: "請先登入以查看此出餐單。",
    logIn: "登入",
    tableSuffix: "・桌號 {tableNumber}",
    deliverTo: "外送地址：{address}",
    notes: "備註：{notes}",
    printButton: "列印",
  },
};
