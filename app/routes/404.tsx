import { data } from "react-router";
import { ErrorView } from "~/components/error-boundary";

export const loader = async () => {
  return data(null, 404);
};

export default function Mo() {
  return <ErrorView error={Error("404: Not Found")} />;
}
