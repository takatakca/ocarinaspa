import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/hot-tub-maintenance/$ville")({
  head: ({ params }) => cityServiceHead("hot-tub-maintenance", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="hot-tub-maintenance" villeSlug={ville} />;
  },
});
