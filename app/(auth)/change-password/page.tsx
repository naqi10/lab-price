import ChangePasswordForm from "@/components/auth/change-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changer le mot de passe - Lab Price Comparator",
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
