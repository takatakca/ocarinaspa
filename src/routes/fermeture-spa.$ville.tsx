import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/fermeture-spa/$ville")({
  head: ({ params }) => cityServiceHead("fermeture-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="fermeture-spa" villeSlug={ville} />;
  },
});
