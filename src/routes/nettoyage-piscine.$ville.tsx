import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/nettoyage-piscine/$ville")({
  head: ({ params }) => cityServiceHead("nettoyage-piscine", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="nettoyage-piscine" villeSlug={ville} />;
  },
});
