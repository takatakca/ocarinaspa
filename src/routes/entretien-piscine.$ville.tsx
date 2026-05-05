import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/entretien-piscine/$ville")({
  head: ({ params }) => cityServiceHead("entretien-piscine", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="entretien-piscine" villeSlug={ville} />;
  },
});
