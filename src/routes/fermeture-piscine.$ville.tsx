import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/fermeture-piscine/$ville")({
  head: ({ params }) => cityServiceHead("fermeture-piscine", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="fermeture-piscine" villeSlug={ville} />;
  },
});
