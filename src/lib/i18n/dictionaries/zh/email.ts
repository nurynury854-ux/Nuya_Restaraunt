import type { email as enEmail } from "@/lib/i18n/dictionaries/en/email";

export const email: typeof enEmail = {
  verification: {
    subject: "請驗證您的電子郵件－{businessName}",
    heading: "驗證您的電子郵件",
    greeting: "您好，",
    body: "請點選下方按鈕以驗證您的 {businessName} 帳號電子郵件。",
    button: "驗證電子郵件",
    fallback: "或複製以下連結至瀏覽器開啟：",
    expiry: "此連結將於 24 小時後失效。",
  },
  passwordReset: {
    subject: "重設您的密碼",
    heading: "重設您的密碼",
    greeting: "您好，",
    body: "我們收到重設您 {businessName} 帳號密碼的請求。",
    button: "重設密碼",
    fallback: "或複製以下連結至瀏覽器開啟：",
    ignoreIfNotYou: "如果這不是您本人的操作，請忽略此郵件，您的密碼不會被變更。",
    expiry: "此連結將於 1 小時後失效。",
  },
};
