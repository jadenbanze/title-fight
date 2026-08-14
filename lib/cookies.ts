import { cookies } from "next/headers";

const VID = "tf_vid";
const YEAR = 60 * 60 * 24 * 365;

function randomId(): string {
  return crypto.randomUUID();
}

export async function getOrCreateVoterId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VID)?.value;
  if (existing) return existing;
  const id = randomId();
  jar.set(VID, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: YEAR,
    path: "/",
  });
  return id;
}
