import { redirect } from "next/navigation";

export const metadata = {
  title: "Plataforma de Networking",
};

export default function Home() {
  redirect("/intentions");
}
