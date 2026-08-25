import { z } from "zod";
import {
  DINING_METHODS,
  PAYMENT_METHODS,
  TIME_SLOT_METHODS,
  ORDER_STATUSES,
} from "@/lib/constants";
import { isValidTimezone } from "@/lib/timezone";

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isValidTimezone, "Not a recognized timezone");

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Please enter a valid phone number")
  .max(20, "Please enter a valid phone number")
  .regex(/^[0-9+\-\s()]+$/, "Phone number format is invalid");

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  modifierOptionIds: z.array(z.string().min(1)).max(50).optional(),
});

export const createOrderSchema = z
  .object({
    tenantSlug: z.string().min(1, "Missing store"),
    branchId: z.string().min(1, "Please select a location"),
    diningMethod: z.enum(DINING_METHODS),
    items: z
      .array(orderItemSchema)
      .min(1, "Your cart is empty")
      .max(100, "That's too many items for one order"),
    tableNumber: z.string().trim().max(20).optional(),
    timeSlotId: z.string().min(1).optional(),
    customerName: z.string().trim().min(1, "Please enter your name").max(60),
    customerPhone: phoneSchema,
    deliveryAddress: z.string().trim().max(160).optional(),
    notes: z.string().trim().max(300).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS),
  })
  .superRefine((data, ctx) => {
    if (data.diningMethod === "DINE_IN" && !data.tableNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["tableNumber"],
        message: "Please enter a table number",
      });
    }
    if (
      (data.diningMethod === "PICKUP" || data.diningMethod === "DELIVERY") &&
      !data.timeSlotId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["timeSlotId"],
        message: "Please select a time slot",
      });
    }
    if (data.diningMethod === "DELIVERY" && !data.deliveryAddress) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: "Please enter a delivery address",
      });
    }
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const orderLookupSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  orderNo: z.string().trim().min(1, "Please enter your order number").max(40),
  phone: phoneSchema,
});

export const branchCreateSchema = z.object({
  name: z.string().trim().min(1, "Please enter a location name").max(60),
  address: z.string().trim().min(1, "Please enter an address").max(160),
  phone: z.string().trim().min(1, "Please enter a phone number").max(30),
  hours: z.string().trim().min(1, "Please enter business hours").max(60),
});

export const branchUpdateSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  address: z.string().trim().min(1).max(160).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  hours: z.string().trim().min(1).max(60).optional(),
  isActive: z.boolean().optional(),
});

export const tenantSettingsUpdateSchema = z.object({
  businessName: z.string().trim().min(1, "Please enter a business name").max(80).optional(),
  logoUrl: z.string().trim().url().max(600).nullable().optional(),
  timezone: timezoneSchema.optional(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #C8722E")
    .nullable()
    .optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Please enter a category name").max(30),
  sortOrder: z.number().int().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const menuItemCreateSchema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  name: z.string().trim().min(1, "Please enter an item name").max(80),
  price: z.number().int().min(0, "Price can't be negative").max(1000000),
  description: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().url().max(600).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const menuItemUpdateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  price: z.number().int().min(0).max(1000000).optional(),
  description: z.string().trim().max(300).nullable().optional(),
  imageUrl: z.string().trim().url().max(600).nullable().optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const modifierGroupCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter a group name").max(40),
    minSelect: z.number().int().min(0).max(50).optional(),
    maxSelect: z.number().int().min(0).max(50).nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.minSelect === "number" &&
      typeof data.maxSelect === "number" &&
      data.maxSelect > 0 &&
      data.minSelect > data.maxSelect
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["minSelect"],
        message: "Minimum can't be greater than maximum",
      });
    }
  });

export const modifierGroupUpdateSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  minSelect: z.number().int().min(0).max(50).optional(),
  maxSelect: z.number().int().min(0).max(50).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const modifierOptionCreateSchema = z.object({
  name: z.string().trim().min(1, "Please enter an option name").max(40),
  priceDelta: z.number().int().min(-1000000).max(1000000).optional(),
  isAvailable: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const modifierOptionUpdateSchema = modifierOptionCreateSchema.partial();

export const branchClosureCreateSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a date"),
  reason: z.string().trim().max(120).optional(),
});

export const timeSlotCreateSchema = z.object({
  branchId: z.string().min(1, "Please select a location"),
  method: z.enum(TIME_SLOT_METHODS),
  label: z.string().trim().min(1, "Please enter a time slot label").max(30),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const timeSlotUpdateSchema = z.object({
  label: z.string().trim().min(1).max(30).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export const checkSlugSchema = z.object({
  slug: z.string().trim().min(1).max(40),
});

export const platformTenantUpdateSchema = z.object({
  isActive: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email").email("Enter a valid email"),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, "Missing verification token"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Missing reset token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  email: z.string().trim().min(1, "Please enter your email").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().trim().min(1, "Please enter your business name").max(80),
  slug: z
    .string()
    .trim()
    .min(3, "URL must be at least 3 characters")
    .max(40, "URL is too long"),
  branchName: z.string().trim().min(1, "Please enter a location name").max(60),
  timezone: timezoneSchema.optional(),
});
