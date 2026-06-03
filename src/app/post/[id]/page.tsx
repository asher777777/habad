import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostPageClient } from "./PostPageClient";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

async function getPostData(id: string) {
  try {
    const docRef = adminDb.collection("posts").doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data?.published) {
        return { id: docSnap.id, ...data } as any;
      }
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching public post ${id}:`, (error as Error).message);
    return null;
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostData(resolvedParams.id);
  
  if (!post) return { title: "פוסט לא נמצא - בית חב\"ד" };
  
  return {
    title: `${post.title} | בית חב\"ד`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: [
        {
          url: post.imageUrl && !post.imageUrl.startsWith("linear-gradient") ? post.imageUrl : "/images/hero-fallback.jpg",
          width: 1200,
          height: 630,
        }
      ]
    }
  };
}

export default async function PublicPostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const post = await getPostData(resolvedParams.id);

  if (!post) {
    notFound();
  }

  return <PostPageClient initialData={post} id={resolvedParams.id} />;
}
