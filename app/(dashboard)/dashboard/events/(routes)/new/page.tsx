import { EventForm } from "../../components/event-form";

const NewEventPage = async ({
  params,
}: {
  params: { productId: string; storeId: string };
}) => {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <EventForm />
      </div>
    </div>
  );
};

export default NewEventPage;
