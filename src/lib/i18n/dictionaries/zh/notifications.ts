import type { notifications as enNotifications } from "@/lib/i18n/dictionaries/en/notifications";

export const notifications: typeof enNotifications = {
  nav: "通知設定",
  heading: "顧客通知",
  subheading: "訂單完成時自動發簡訊通知顧客",

  sms: {
    heading: "簡訊通知（三竹簡訊 Mitake）",
    intro:
      "連接您自己的三竹簡訊帳號，當訂單被標記為「已完成」時自動發送簡訊給顧客。這是公版模板，所以每個商家都要串接自己的帳號——訊息會用您自己的帳號發送，不是共用的平台帳號。",
    howTo: "還沒有帳號嗎？到 mitake.com.tw 申請，申請好後回來這裡貼上您的帳號密碼即可。",
    status: {
      configured: "簡訊通知已開啟，目前使用帳號「{username}」。",
      notConfigured: "簡訊通知目前是關閉的。",
    },
    username: "三竹簡訊帳號",
    password: "三竹簡訊密碼",
    passwordHint: "會加密儲存，儲存後不會再顯示。",
    save: "儲存",
    saveError: "無法儲存簡訊設定",
    disconnect: "關閉簡訊通知",
    disconnectConfirm: "確定要關閉此商家的簡訊通知嗎？",
    test: {
      heading: "發送測試訊息",
      hint: "可以在真正有顧客訂單之前，先確認您的帳號設定正確。",
      phone: "您的手機號碼",
      phonePlaceholder: "例如：0912345678",
      send: "發送測試",
      sent: "測試訊息已發送，請查看您的手機。",
      error: "測試訊息發送失敗",
      needsSetup: "請先儲存您的帳號與密碼。",
    },
  },
};
