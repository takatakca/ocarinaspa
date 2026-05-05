import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/ouverture-piscine/$ville")({
  head: ({ params }) => cityServiceHead("ouverture-piscine", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="ouverture-piscine" villeSlug={ville} />;
  },
});
