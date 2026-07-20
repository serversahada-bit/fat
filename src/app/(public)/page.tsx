import { redirect } from "next/navigation";
import { getHomeRoute, getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  if (session?.user) {
    redirect(getHomeRoute(session));
  }

  redirect("/login");
}
