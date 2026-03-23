import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { MOCK_VENDORS } from "@/lib/mock-data";

export type InventoryVendor = {
  vendorId: string;
  vendorName: string;
  vendorDescription: string | null;
  requestTitle: string | null;
  requestDescription: string | null;
  requestorName: string | null;
  requestorEmail: string | null;
  requestId: string | null;
  department: string | null;
  category: string | null;
  subcategory: string | null;
  status: string | null;
};

export type RankedVendorMatch = {
  vendorId: string;
  vendorName: string;
  vendorDescription: string | null;
  requestTitle?: string | null;
  requestDescription?: string | null;
  requestorName: string | null;
  requestorEmail: string | null;
  confidence: "high" | "medium" | "low";
  whyItMatches: string;
};

type SearchResult = {
  query: string;
  bestMatch: RankedVendorMatch | null;
  alternateMatches: Array<{
    vendorName: string;
    reason: string;
  }>;
  lowConfidence: boolean;
};

const WORD_RE = /[a-z0-9]+/g;
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "am",
  "are",
  "be",
  "can",
  "do",
  "existing",
  "find",
  "for",
  "have",
  "i",
  "looking",
  "me",
  "need",
  "of",
  "or",
  "our",
  "please",
  "solution",
  "that",
  "the",
  "to",
  "tool",
  "vendor",
  "we",
  "with"
]);
const PHRASE_SYNONYMS: Record<string, string[]> = {
  "password manager": ["password vault", "credential manager", "credential vault", "secrets manager"],
  "identity verification": ["identity proofing", "id verification", "onboarding verification"],
  "cloud monitoring": ["observability", "infrastructure monitoring", "application monitoring"],
  "recruitment search": ["talent sourcing", "candidate sourcing", "recruiting search"]
};

type ScoredVendor = InventoryVendor & {
  lexicalScore: number;
  semanticScore: number;
  totalScore: number;
  matchedTerms: string[];
};

function tokenize(value: string) {
  return new Set(
    (value.toLowerCase().match(WORD_RE) ?? [])
      .filter(Boolean)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  );
}

function expandQuery(query: string) {
  const lowered = query.toLowerCase();
  const expanded = new Set(tokenize(query));

  for (const [phrase, synonyms] of Object.entries(PHRASE_SYNONYMS)) {
    if (lowered.includes(phrase)) {
      for (const synonym of synonyms) {
        for (const token of tokenize(synonym)) {
          expanded.add(token);
        }
      }
    }
  }

  return expanded;
}

function scoreVendor(query: string, vendor: InventoryVendor): ScoredVendor {
  const haystack = [
    vendor.vendorName,
    vendor.vendorDescription ?? "",
    vendor.requestTitle ?? "",
    vendor.requestDescription ?? "",
    vendor.category ?? "",
    vendor.subcategory ?? "",
    vendor.department ?? ""
  ]
    .join(" ")
    .toLowerCase();
  const queryTokens = tokenize(query);
  const expandedQueryTokens = expandQuery(query);
  const vendorTokens = tokenize(haystack);
  const directOverlap = [...queryTokens].filter((token) => vendorTokens.has(token));
  const semanticOverlap = [...expandedQueryTokens].filter((token) => vendorTokens.has(token));
  const phraseHit = haystack.includes(query.toLowerCase()) ? 1 : 0;
  const lexicalScore = directOverlap.length * 2 + phraseHit * 4;
  const semanticScore = semanticOverlap.length - directOverlap.length;
  const totalScore = lexicalScore + semanticScore;

  return {
    ...vendor,
    lexicalScore,
    semanticScore,
    totalScore,
    matchedTerms: [...new Set(semanticOverlap)]
  };
}

async function getInventory(): Promise<InventoryVendor[]> {
  let vendors: Awaited<ReturnType<typeof prisma.vendor.findMany>> = [];
  try {
    vendors = await prisma.vendor.findMany({
      orderBy: {
        vendorName: "asc"
      },
      take: 250
    });
  } catch {
    return MOCK_VENDORS;
  }

  if (vendors.length === 0) {
    return MOCK_VENDORS;
  }

  return vendors.map((vendor) => ({
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    vendorDescription: vendor.vendorDescription,
    requestTitle: vendor.requestTitle,
    requestDescription: vendor.requestDescription,
    requestorName: vendor.requestorName,
    requestorEmail: vendor.requestorEmail,
    requestId: vendor.requestId,
    department: vendor.department,
    category: vendor.category,
    subcategory: vendor.subcategory,
    status: vendor.status
  }));
}

function buildPrompt(query: string, candidates: InventoryVendor[]) {
  return `
You are ranking vendors for an internal procurement discovery tool.
Return strict JSON with keys:
- best_match_vendor_name
- best_match_vendor_id
- why_it_matches
- confidence
- no_strong_match
- alternate_matches (array of objects with vendor_name and reason)

Important rules:
- If none of the candidates directly fit the requested capability, set no_strong_match to true.
- Do not force a match when the evidence is weak.
- Prefer exact capability alignment over broad business-process overlap.

User request:
${query}

Candidate vendors:
${JSON.stringify(candidates, null, 2)}
`;
}

async function rankWithOpenAI(query: string, candidates: InventoryVendor[]) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Rank the best vendor match and return only JSON."
      },
      {
        role: "user",
        content: buildPrompt(query, candidates)
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return null;
  }

  return JSON.parse(content) as {
    best_match_vendor_name: string;
    best_match_vendor_id: string;
    why_it_matches: string;
    confidence: "high" | "medium" | "low";
    no_strong_match?: boolean;
    alternate_matches?: Array<{ vendor_name: string; reason: string }>;
  };
}

function rankHeuristically(query: string, candidates: ScoredVendor[]): SearchResult {
  const top = candidates[0];
  if (!top) {
    return {
      query,
      bestMatch: null,
      alternateMatches: [],
      lowConfidence: true
    };
  }

  const runnerUp = candidates.slice(1, 3);
  const confidence: "high" | "medium" | "low" =
    top.totalScore >= 6 ? "high" : top.totalScore >= 3 ? "medium" : "low";

  if (top.lexicalScore === 0 && top.semanticScore < 2) {
    return {
      query,
      bestMatch: null,
      alternateMatches: [],
      lowConfidence: true
    };
  }

  return {
    query,
    bestMatch: {
      vendorId: top.vendorId,
      vendorName: top.vendorName,
      vendorDescription: top.vendorDescription,
      requestTitle: top.requestTitle,
      requestDescription: top.requestDescription,
      requestorName: top.requestorName,
      requestorEmail: top.requestorEmail,
      confidence,
      whyItMatches:
        confidence === "low"
          ? `This vendor shares some related terms (${top.matchedTerms.join(", ")}), but the evidence is weak and should be reviewed manually.`
          : `The request aligns with ${top.vendorName} based on matching capability terms: ${top.matchedTerms.join(", ")}.`
    },
    alternateMatches: runnerUp.map((vendor) => ({
      vendorName: vendor.vendorName,
      reason: vendor.vendorDescription ?? "Related vendor with partial keyword overlap."
    })),
    lowConfidence: confidence === "low"
  };
}

export async function searchVendors(query: string): Promise<SearchResult> {
  const inventory = await getInventory();
  const queryTerms = [...expandQuery(query)].slice(0, 8);
  const filteredCandidates = inventory.filter((vendor) => {
    const haystack = [
      vendor.vendorName,
      vendor.vendorDescription ?? "",
      vendor.requestTitle ?? "",
      vendor.requestDescription ?? "",
      vendor.category ?? "",
      vendor.subcategory ?? "",
      vendor.department ?? ""
    ]
      .join(" ")
      .toLowerCase();
    return queryTerms.some((term) => haystack.includes(term));
  });
  const scoredCandidates = (filteredCandidates.length > 0 ? filteredCandidates : inventory)
    .map((vendor) => scoreVendor(query, vendor))
    .filter((vendor) => vendor.totalScore > 0)
    .sort((left, right) => right.totalScore - left.totalScore)
    .slice(0, 5);

  if (scoredCandidates.length === 0) {
    return {
      query,
      bestMatch: null,
      alternateMatches: [],
      lowConfidence: true
    };
  }

  const ranked = await rankWithOpenAI(query, scoredCandidates);
  if (!ranked) {
    return rankHeuristically(query, scoredCandidates);
  }

  if (ranked.no_strong_match) {
    return {
      query,
      bestMatch: null,
      alternateMatches: (ranked.alternate_matches ?? []).slice(0, 3).map((match) => ({
        vendorName: match.vendor_name,
        reason: match.reason
      })),
      lowConfidence: true
    };
  }

  const selected = scoredCandidates.find((vendor) => vendor.vendorId === ranked.best_match_vendor_id)
    ?? scoredCandidates.find((vendor) => vendor.vendorName === ranked.best_match_vendor_name)
    ?? null;

  return {
    query,
    bestMatch: selected
      ? {
          vendorId: selected.vendorId,
          vendorName: selected.vendorName,
          vendorDescription: selected.vendorDescription,
          requestorName: selected.requestorName,
          requestorEmail: selected.requestorEmail,
          confidence: ranked.confidence,
          whyItMatches: ranked.why_it_matches
        }
      : null,
    alternateMatches: (ranked.alternate_matches ?? []).slice(0, 3).map((match) => ({
      vendorName: match.vendor_name,
      reason: match.reason
    })),
    lowConfidence: ranked.confidence === "low"
  };
}
