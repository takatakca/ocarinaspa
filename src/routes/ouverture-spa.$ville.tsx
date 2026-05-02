import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/ouverture-spa/$ville")({
  head: ({ params }) => cityServiceHead("ouverture-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="ouverture-spa" villeSlug={ville} />;
  },
});
