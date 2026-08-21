import { cn } from "@/lib/utils";

interface AboutSectionProps {
  className?: string;
}

export const AboutSection = ({ className }: AboutSectionProps) => (
  <section className={cn("px-4 py-10", className)}>
    <h2 className="mb-4 text-2xl font-bold">About Me</h2>
    <p className="text-muted-foreground">
      I specialize in React, Next.js, and TypeScript. With years of experience building scalable applications, I love
      turning ideas into reality.
    </p>
  </section>
);
