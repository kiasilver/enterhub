import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LandingHome from "./LandingHome";

/** Logged-in visitors skip marketing and go straight to their panel. */
export default async function Page() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/home");
  }
  return <LandingHome />;
}
