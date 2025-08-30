// src/app/page.tsx

// Import component "ranh giới" của chúng ta
import ClientOnlyLoader from "@/components/ui/ClientOnlyLoader";

// page.tsx vẫn là một Server Component, điều này hoàn toàn ổn.
export default function Home() {
  return (
    <main className="w-screen h-screen">
      {/* Render component loader, tất cả logic client sẽ nằm bên trong nó */}
      <ClientOnlyLoader />
    </main>
  );
}
