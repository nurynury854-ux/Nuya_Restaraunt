import type { billing as enBilling } from "@/lib/i18n/dictionaries/en/billing";

export const billing: typeof enBilling = {
  nav: "方案與付款",
  heading: "方案與付款",
  subheading: "您的 {platform} 方案",

  status: {
    label: "狀態",
    trial: "免費試用中",
    trialEnded: "試用已結束",
    paid: "已付款",
    expired: "待付款",
  },

  state: {
    trial: "您的線上訂購網站正常運作中。免費試用將於 {days} 天後結束。",
    trialLastDay: "您的線上訂購網站正常運作中。免費試用將於今天結束。",
    trialEnded: "您的免費試用已結束，線上訂購網站目前已停用。我們收到您的款項後，網站會立即恢復上線。",
    paidThrough: "您的線上訂購網站正常運作中。已付款至 {date}。",
    paidNoEnd: "您的線上訂購網站正常運作中。",
    expired: "您的付款期間已於 {date} 結束，線上訂購網站目前已停用。付款後即可恢復。",
  },

  siteLive: "網站運作中",
  siteOffline: "網站已停用",

  adminStillOpen: "網站停用期間，您仍可編輯菜單與各項設定——所有資料都會保留。",

  howToPay: {
    heading: "付款方式",
    intro: "請以銀行轉帳付款，並在轉帳備註中填寫您的付款代碼與商家名稱，方便我們核對款項。",
    reference: "付款代碼",
    businessName: "商家名稱",
    copy: "複製",
    copied: "已複製",
    transferDetails: "轉帳資訊",
    noInstructions: "請與我們聯絡以取得轉帳帳戶資訊。",
    afterPaying: "我們確認收到款項後就會啟用您的帳號，您不需要在此進行其他操作。您可以隨時付款，試用期間也可以。",
  },

  banner: {
    trialEnding: "免費試用將於 {days} 天後結束。請以銀行轉帳付款以維持網站上線。",
    trialEndingToday: "免費試用將於今天結束。請以銀行轉帳付款以維持網站上線。",
    trialEnded: "您的免費試用已結束，在我們收到款項前，線上訂購網站將維持停用。",
    paidEnding: "您的付款期間將於 {days} 天後結束。請完成下一次付款以維持網站上線。",
    paidEndingToday: "您的付款期間將於今天結束。請完成下一次付款以維持網站上線。",
    expired: "您的付款期間已結束，在我們收到款項前，線上訂購網站將維持停用。",
    action: "查看付款方式",
  },
};
