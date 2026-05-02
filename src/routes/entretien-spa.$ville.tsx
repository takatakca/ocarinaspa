import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/entretien-spa/$ville")({
  head: ({ params }) => cityServiceHead("entretien-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="entretien-spa" villeSlug={ville} />;
  },
});
