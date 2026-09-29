import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { MenuBrowser } from "@/components/customer/MenuBrowser";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = (await getTenantBySlug(tenantSlug))!;

  const categories = await prisma.menuCategory.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: {
          modifierGroups: {
            orderBy: { sortOrder: "asc" },
            include: {
              options: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });

  const nonEmptyCategories = categories.filter((c) => c.items.length > 0);

  return <MenuBrowser tenantSlug={tenantSlug} categories={nonEmptyCategories} />;
}
