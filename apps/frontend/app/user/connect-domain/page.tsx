import { redirect } from "next/navigation";

export default function ConnectDomainPage() {
  redirect("/user/domains?view=connect");
}
