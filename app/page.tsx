import { DynamicWidget } from "@dynamic-labs/sdk-react-core";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <h1>Hello Circlepot</h1>
      <DynamicWidget />
    </div>
  );
}
