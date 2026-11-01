import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SignInClient from "./SignInClient";

/** Already signed in → panel (no login form). */
export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/home");
  }
  return <SignInClient />;
}
