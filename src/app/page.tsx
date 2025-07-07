import { AuthForm } from "@/components/auth/auth-form";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-primary lg:flex items-center justify-center p-12 text-primary-foreground">
        <div className="mx-auto grid w-full max-w-md gap-6 text-center">
            <h1 className="text-4xl font-bold">
                Efficient Water Billing Management
            </h1>
            <p className="text-lg text-primary-foreground/90">
                A unified portal for managing bulk and individual meter data, billing, and reporting for a sustainable future.
            </p>
            <div className="mt-4 rounded-lg overflow-hidden shadow-2xl">
                 <Image
                    src="https://placehold.co/600x400.png"
                    data-ai-hint="water infrastructure"
                    alt="Promotional Image of water infrastructure"
                    width={600}
                    height={400}
                    className="object-cover"
                />
            </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 bg-muted/40">
        <AuthForm />
      </div>
    </div>
  );
}
