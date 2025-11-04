import type { Platform } from "@/lib/warframe/api";
import { getPlatformFromUrl } from "@/lib/warframe/platform";
import { fetchWorldState } from "@/server/warframe/worldstate";
import { createFileRoute } from "@tanstack/react-router";
import { resolveNodeLabel, resolveFactionLabel } from "@/lib/helpers/helpers";
import { resolveItemName } from "@/server/warframe/items";
import { resolveLocalizedText } from "@/lib/helpers/dict";

async function resolveAlertData(alerts: any[]): Promise<any[]> {
  const resolvedAlerts = await Promise.all(
    alerts.map(async (alert: any) => {
      try {
        // Resolve mission description
        const description =
          alert.MissionInfo?.description || alert.description || "";
        const resolvedDescription = description.startsWith("/Lotus/Language/")
          ? await resolveLocalizedText(description)
          : description;

        // Resolve node/location
        const nodeLabel = alert.Node ? await resolveNodeLabel(alert.Node) : "";

        // Resolve faction
        const faction = alert.MissionInfo?.faction
          ? await resolveFactionLabel(alert.MissionInfo.faction)
          : "";

        // Resolve rewards
        const resolvedRewards: string[] = [];

        if (alert.MissionInfo?.missionReward?.items) {
          for (const itemPath of alert.MissionInfo.missionReward.items) {
            try {
              const itemName = await resolveItemName(itemPath);
              resolvedRewards.push(itemName);
            } catch (error) {
              console.error(
                `Error resolving alert reward item ${itemPath}:`,
                error
              );
              resolvedRewards.push(itemPath.split("/").pop() || itemPath);
            }
          }
        }

        return {
          ...alert,
          resolvedDescription,
          resolvedNodeLabel: nodeLabel,
          resolvedFaction: faction,
          resolvedRewards: [...new Set(resolvedRewards)], // Remove duplicates
        };
      } catch (error) {
        console.error("Error resolving alert data:", error);
        return alert;
      }
    })
  );

  return resolvedAlerts;
}

export const Route = createFileRoute("/api/warframe/alerts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const platform = getPlatformFromUrl(request.url);
          const data = await fetchWorldState(platform);
          const alerts = data.Alerts || [];

          // Resolve all alert data server-side
          const resolvedAlerts = await resolveAlertData(alerts);

          return Response.json(resolvedAlerts);
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || "Failed to fetch alerts" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
