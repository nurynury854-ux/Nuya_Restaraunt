import { common } from "./common";
import { constants } from "./constants";
import { marketing } from "./marketing";
import { auth } from "./auth";
import { customer } from "./customer";
import { checkout } from "./checkout";
import { adminChrome } from "./adminChrome";
import { adminDashboard } from "./adminDashboard";
import { adminOrders } from "./adminOrders";
import { adminMenu } from "./adminMenu";
import { adminSettings } from "./adminSettings";
import { adminKitchen } from "./adminKitchen";
import { platformAdmin } from "./platformAdmin";
import { email } from "./email";

export const en = {
  common,
  constants,
  marketing,
  auth,
  customer,
  checkout,
  adminChrome,
  adminDashboard,
  adminOrders,
  adminMenu,
  adminSettings,
  adminKitchen,
  platformAdmin,
  email,
};

export type Dictionary = typeof en;
