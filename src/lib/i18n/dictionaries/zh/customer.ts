import type { customer as enCustomer } from "@/lib/i18n/dictionaries/en/customer";

export const customer: typeof enCustomer = {
  branchSelect: {
    orderOnline: "線上點餐",
    chooseLocation: "選擇門市與您想要的取餐方式",
    trackExistingOrder: "查詢現有訂單",
    noLocations: "目前尚未設定任何門市，請稍後再回來查看。",
    howToOrder: "您想要如何取餐？",
  },
  quantityStepper: {
    decrease: "減少數量",
    increase: "增加數量",
  },
  menu: {
    change: "變更",
    closedTodayWithReason: "今日公休——{reason}",
    closedTodayGeneric: "此門市今日公休",
    noItemsAvailable: "目前沒有可供應的品項",
    add: "加入",
  },
  modifierSheet: {
    close: "關閉",
    selectExact: "請選擇 {count} 項",
    selectRange: "請選擇 {min}-{max} 項",
    selectUpTo: "最多可選 {max} 項",
    optional: "非必選",
    add: "加入",
  },
  cart: {
    yourCart: "您的購物車",
    empty: "購物車是空的——快去挑選餐點吧！",
    each: "／份",
    total: "總計",
    checkout: "結帳",
    checkoutWithCount: "結帳（{count} 件商品）",
    locationClosed: "門市公休中",
    removeItem: "移除品項",
    itemCount: "{count} 件商品",
  },
};
