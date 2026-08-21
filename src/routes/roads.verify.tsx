import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, Info } from "lucide-react";
import { RoadIncident } from "@/lib/roadData";
import { addIncident } from "@/lib/roadStore";
import { ScenarioId, buildIncident } from "@/lib/roadVerification";
import {
  ResultPanel,
  UploadPanel,
  UploadedFile,
  VerificationPipeline,
} from "@/components/road/RoadAnalysis";

export const Route = createFileRoute("/roads/verify")({
  head: () => ({
    meta: [
      { title: "AI Verification Engine — FloodShield AI" },
      {
        name: "description",
        content:
          "Step-by-step road damage verification: object detection, geometry, surface deformation, temporal consistency and false-positive rejection.",
      },
      { property: "og:title", content: "AI Verification Engine — FloodShield AI" },
      {
        property: "og:description",
        content: "A road-damage candidate must pass multiple checks before it is treated as a verified pothole.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppLayout>
      <VerifyScreen />
    </AppLayout>
  ),
});

type Phase = "upload" | "verifying" | "result";

function VerifyScreen() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [scenario, setScenario] = useState<ScenarioId>("pothole");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [incident, setIncident] = useState<RoadIncident | null>(null);

  return (
    <div className="px-5 pt-2 pb-6 space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/roads" className="h-9 w-9 rounded-xl glass flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">AI Verification Engine</h1>
          <p className="text-[11px] text-muted-foreground leading-snug">
            A candidate must pass multiple checks before it is treated as a verified pothole.
          </p>
        </div>
      </header>

      <div className="glass rounded-xl p-2.5 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-muted-foreground">
          Prototype verification — stages are rule-based simulations, not the output of a trained computer-vision
          model.{" "}
          <Link to="/roads/architecture" className="text-primary underline underline-offset-2">
            Prototype vs production
          </Link>
        </p>
      </div>

      {phase === "upload" && (
        <UploadPanel
          file={file}
          setFile={setFile}
          scenario={scenario}
          setScenario={setScenario}
          onStart={() => setPhase("verifying")}
        />
      )}

      {phase === "verifying" && file && (
        <VerificationPipeline
          scenario={scenario}
          isVideo={file.isVideo}
          onDone={() => {
            const built = buildIncident(scenario, { name: file.name, isVideo: file.isVideo });
            setIncident(built);
            addIncident(built);
            setPhase("result");
          }}
        />
      )}

      {phase === "result" && incident && (
        <ResultPanel
          incident={incident}
          scenario={scenario}
          onRestart={() => {
            setFile(null);
            setIncident(null);
            setPhase("upload");
          }}
        />
      )}
    </div>
  );
}
