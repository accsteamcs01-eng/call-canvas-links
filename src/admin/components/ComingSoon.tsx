import { Sparkles } from "lucide-react";
import { EmptyState } from "./EmptyState";

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return <EmptyState icon={Sparkles} title={`${title} em breve`} text={text} />;
}
