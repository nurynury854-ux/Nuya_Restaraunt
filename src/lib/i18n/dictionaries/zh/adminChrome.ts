import type { adminChrome as enAdminChrome } from "@/lib/i18n/dictionaries/en/adminChrome";

export const adminChrome: typeof enAdminChrome = {
  topBar: {
    logOut: "登出",
  },
  nav: {
    dashboard: "儀表板",
    pending: "處理中",
    completed: "已完成",
    history: "歷史紀錄",
    menu: "菜單",
    timeSlots: "時段設定",
    locations: "分店",
    locationSettings: "分店設定",
  },
  notifier: {
    soundOn: "新訂單提示音：開啟",
    soundOff: "新訂單提示音：關閉",
    newOrder: "新訂單！{orderNo}",
  },
  branchSelect: {
    chooseLocation: "請選擇要管理的分店",
    siteSettings: "網站設定",
    active: "營業中",
    disabled: "已停用",
    manage: "管理",
    addLocation: "新增分店",
  },
  emailVerifyBanner: {
    message: "請驗證您的電子郵件地址（{email}）。",
    resend: "重新寄送郵件",
    sending: "寄送中...",
    sent: "驗證郵件已寄出，請至信箱查收。",
    error: "郵件寄送失敗，請再試一次。",
  },
};
