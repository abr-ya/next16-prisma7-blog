"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useState } from "react";
import { toast } from "sonner";

import { createHike, type PublicTripCreationCapability } from "@/app/_data/hikes";
import { HikeFormDialog } from "@/components/dialogs/trips";
import { type HikeFormValues } from "@/components/forms/trips";
import { Button } from "@/components/index";
import { tripsNamespace } from "@/app/i18n/settings";
import type { HikeStatus, HikeType } from "@/generated/prisma/enums";

type PublicTripAddControlProps = {
  capability: PublicTripCreationCapability;
};

/**
 * Always-visible `Add Trip` entry point on the public `/trips` page.
 *
 * The control's enabled/disabled state and adjacent feedback come from a
 * server-derived `PublicTripCreationCapability`. The server is the final
 * authority on trust/quota — the client never reads either directly.
 */
export const PublicTripAddControl = ({ capability }: PublicTripAddControlProps) => {
  const { t } = useT(tripsNamespace);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const eligible = capability.eligible;
  const reason = capability.eligible ? null : capability.reason;

  const handleSubmit = async (values: HikeFormValues) => {
    const created = await createHike({
      ...values,
      type: values.type as HikeType,
      status: values.status as HikeStatus,
    });

    if (created.status === "PUBLISHED") {
      toast.success(t("addTripSuccessPublished"));
      router.push(`/trips/${created.slug}`);
    } else {
      toast.success(t("addTripSuccessDraft"));
      router.push("/admin/trips");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!eligible && reason === "anonymous" ? (
        <p className="text-xs text-muted-foreground">
          {t("addTripAnonymous")} (
          <Link href="/sign-in" className="underline">
            {t("addTripSignIn")}
          </Link>
          )
        </p>
      ) : null}
      {!eligible && reason === "insufficient-trust" ? (
        <p className="text-xs text-muted-foreground">{t("addTripInsufficientTrust")}</p>
      ) : null}
      {!eligible && reason === "verified-trip-quota-reached" ? (
        <p className="text-xs text-muted-foreground">{t("addTripQuotaReached")}</p>
      ) : null}
      <Button type="button" size="sm" disabled={!eligible} onClick={() => setDialogOpen(true)}>
        {t("addTrip")}
      </Button>
      <HikeFormDialog hike={null} open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleSubmit} />
    </div>
  );
};
