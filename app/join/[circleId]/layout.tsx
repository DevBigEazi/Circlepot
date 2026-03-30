import type { Metadata } from "next";
import { request } from "graphql-request";
import { GET_SINGLE_CIRCLE } from "@/app/graphql/savingsQueries";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || "";

interface RawCircleResponse {
  circles: Array<{
    circleId: string;
    circleName: string;
    circleDescription: string;
    contributionAmount: string;
    frequency: number;
    maxMembers: number;
    currentMembers: number;
    visibility: number;
    state: number;
    creator: { id: string };
  }>;
}

function getFrequencyLabel(freq: number): string {
  switch (freq) {
    case 0:
      return "daily";
    case 1:
      return "weekly";
    case 2:
      return "monthly";
    default:
      return "periodic";
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ circleId: string }>;
}): Promise<Metadata> {
  const { circleId } = await params;

  if (!SUBGRAPH_URL) {
    return {
      title: "Join Circle",
      description: "Join a savings circle on Circlepot.",
    };
  }

  try {
    const result = await request<RawCircleResponse>(
      SUBGRAPH_URL,
      GET_SINGLE_CIRCLE,
      { circleId },
    );

    const circle = result.circles?.[0];

    if (!circle) {
      return {
        title: "Circle Not Found",
        description:
          "This savings circle could not be found. It may have been closed or the link may be invalid.",
      };
    }

    const contribution = (Number(circle.contributionAmount) / 1e6).toFixed(2);
    const frequency = getFrequencyLabel(Number(circle.frequency));
    const visibility =
      Number(circle.visibility) === 1 ? "Public" : "Private";

    return {
      title: `Join ${circle.circleName}`,
      description: `Join "${circle.circleName}" on Circlepot — a ${visibility.toLowerCase()} savings circle. $${contribution} ${frequency} contribution with ${circle.currentMembers}/${circle.maxMembers} members.`,
      openGraph: {
        title: `Join ${circle.circleName} on Circlepot`,
        description: `$${contribution} ${frequency} · ${circle.currentMembers}/${circle.maxMembers} members · ${visibility} · Automated & secure`,
      },
      twitter: {
        card: "summary_large_image",
        title: `Join ${circle.circleName} on Circlepot`,
        description: `$${contribution} ${frequency} · ${circle.currentMembers}/${circle.maxMembers} members · Automated & secure`,
      },
    };
  } catch (error) {
    console.error("Error fetching circle metadata:", error);
    return {
      title: "Join Circle",
      description: "Join a savings circle on Circlepot.",
    };
  }
}

export default function JoinCircleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
