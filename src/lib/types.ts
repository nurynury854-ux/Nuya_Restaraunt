export interface SerializedTenant {
  id: string;
  slug: string;
  businessName: string;
  logoUrl: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  backgroundStyle: string;
  backgroundImageDesktopUrl: string | null;
  backgroundImageMobileUrl: string | null;
  backgroundOverlayOpacity: number;
  headingFont: string;
  cornerStyle: string;
  tagline: string | null;
  timezone: string;
  isActive: boolean;
}

export interface SerializedOrderItemModifier {
  id: string;
  groupNameSnapshot: string;
  nameSnapshot: string;
  priceDeltaSnapshot: number;
}

export interface SerializedOrderItem {
  id: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
  modifiers: SerializedOrderItemModifier[];
}

export interface SerializedBranch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  bannerImageUrl: string | null;
  isActive: boolean;
}

export interface SerializedBranchClosure {
  id: string;
  branchId: string;
  date: string;
  reason: string | null;
}

export interface SerializedTimeSlot {
  id: string;
  branchId: string;
  label: string;
  method: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SerializedModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
  sortOrder: number;
}

export interface SerializedModifierGroup {
  id: string;
  menuItemId: string;
  name: string;
  minSelect: number;
  maxSelect: number | null;
  sortOrder: number;
  options: SerializedModifierOption[];
}

export interface SerializedMenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  modifierGroups: SerializedModifierGroup[];
}

export interface SerializedMenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  items: SerializedMenuItem[];
}

export interface SerializedOrder {
  id: string;
  orderNo: string;
  branchId: string;
  branch: SerializedBranch;
  diningMethod: string;
  status: string;
  tableNumber: string | null;
  timeSlotId: string | null;
  timeSlot: SerializedTimeSlot | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: SerializedOrderItem[];
}
