import { getDB } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  id: number;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  created_at: string;
}

async function getUserProfile(id: number): Promise<UserProfile | null> {
  try {
    const db = getDB();
    const user = await db
      .prepare(
        `SELECT u.id, u.name, u.bio, u.created_at, m.path as avatar_path
         FROM users u
         LEFT JOIN media m ON u.avatar_media_id = m.id
         WHERE u.id = ? AND u.is_active = 1`
      )
      .bind(id)
      .first<UserProfile>();
    return user || null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserProfile(parseInt(id, 10));

  if (!user) {
    return { title: "User Not Found" };
  }

  return {
    title: `${user.name} | Peabod`,
    description: user.bio || `${user.name}'s profile on Peabod`,
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserProfile(parseInt(id, 10));

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-6 mb-8">
        {user.avatar_path ? (
          <Image
            src={`/api/media/${user.avatar_path}`}
            alt={user.name}
            width={96}
            height={96}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <span
              className="text-3xl font-medium"
              style={{ color: "var(--accent-foreground)" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {user.name}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Member since {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {user.bio && (
        <div className="prose" style={{ color: "var(--foreground)" }}>
          <p>{user.bio}</p>
        </div>
      )}
    </div>
  );
}
