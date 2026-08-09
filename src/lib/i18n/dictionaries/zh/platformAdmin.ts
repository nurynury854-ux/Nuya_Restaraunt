import type { platformAdmin as enPlatformAdmin } from "@/lib/i18n/dictionaries/en/platformAdmin";

export const platformAdmin: typeof enPlatformAdmin = {
  login: {
    title: "平台管理員",
    subtitle: "僅限平台擁有者存取",
    email: "電子郵件",
    password: "密碼",
    loginFailed: "登入失敗",
    logIn: "登入",
  },
  dashboard: {
    headerSuffix: "－平台管理後台",
    logOut: "登出",
  },
  table: {
    searchPlaceholder: "搜尋商家名稱或網址...",
    tenantsCount: "共 {total} 個租戶",
    loadError: "無法載入租戶列表，請再試一次。",
    toggleError: "無法更新此租戶，請再試一次。",
    deleteError: "無法刪除此租戶，請再試一次。",
    business: "商家",
    owner: "擁有者",
    locations: "分店數",
    orders: "訂單數",
    created: "建立時間",
    active: "啟用中",
    suspended: "已停權",
    deleteAria: "刪除 {name}",
    noTenants: "找不到任何租戶。",
    loading: "載入中...",
    pageOf: "第 {page} 頁，共 {totalPages} 頁",
    deleteModal: {
      title: "刪除 {name}？",
      description: "此操作將永久刪除此租戶的所有分店、菜單、時段、訂單與管理員帳號，且無法復原。",
      typeToConfirmPrefix: "請輸入「",
      typeToConfirmSuffix: "」以確認。",
      cancel: "取消",
      deletePermanently: "永久刪除",
    },
  },
};
