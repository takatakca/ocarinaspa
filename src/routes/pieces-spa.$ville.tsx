import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/pieces-spa/$ville")({
  head: ({ params }) => cityServiceHead("pieces-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="pieces-spa" villeSlug={ville} />;
  },
});
