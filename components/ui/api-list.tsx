"use client";

import { ApiAlert } from "@/components/api-alert";

interface ApiListProps {
  entityName: string;
  entityIdName: string;
}

export const ApiList: React.FC<ApiListProps> = ({
  entityName,
  entityIdName,
}) => {
  const baseUrl = `http://localhost:8080/event/api/v1`;

  return (
    <>
      <ApiAlert
        title="GET"
        variant="public"
        descrition={`${baseUrl}/${entityName}`}
      />
      <ApiAlert
        title="GET"
        variant="public"
        descrition={`${baseUrl}/${entityName}/${entityIdName}`}
      />
      <ApiAlert
        title="POST"
        variant="admin"
        descrition={`${baseUrl}/${entityName}/${entityIdName}`}
      />
      <ApiAlert
        title="PATCH"
        variant="admin"
        descrition={`${baseUrl}/${entityName}/${entityIdName}`}
      />
      <ApiAlert
        title="DELETE"
        variant="admin"
        descrition={`${baseUrl}/${entityName}/${entityIdName}`}
      />
    </>
  );
};
