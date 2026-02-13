import ResetPasswordForm from "@/components/auth/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialisation du mot de passe - Lab Price Comparator",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
