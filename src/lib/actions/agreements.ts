"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAgreements(familyId: string) {
  return db.agreement.findMany({
    where: { familyId },
    include: {
      conflict: {
        include: {
          goalA: { include: { owner: true } },
          goalB: { include: { owner: true } },
          resolution: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateAgreementStatus(
  agreementId: string,
  status: "ACTIVE" | "EXPIRED" | "REVISED" | "CANCELLED"
) {
  const agreement = await db.agreement.update({
    where: { id: agreementId },
    data: { status },
  });

  revalidatePath("/agreements");
  return agreement;
}

export async function getAgreementStats(familyId: string) {
  const agreements = await db.agreement.findMany({
    where: { familyId },
  });

  const total = agreements.length;
  const active = agreements.filter((a) => a.status === "ACTIVE").length;
  const expired = agreements.filter((a) => a.status === "EXPIRED").length;
  const upcomingReviews = agreements.filter((a) => {
    if (!a.validUntil) return false;
    const daysUntil = Math.ceil(
      (new Date(a.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil > 0 && daysUntil <= 14;
  }).length;

  return { total, active, expired, upcomingReviews };
}
