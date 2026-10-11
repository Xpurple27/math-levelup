import { createClient } from "@supabase/supabase-js";
import { adminIdentity, adminError, assertOrigin } from "@/features/content/auth";
import { StorageError } from "@/lib/store-errors";

export const runtime = "nodejs";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new StorageError("Database practice belum dikonfigurasi.", 500);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireAdmin() {
  const identity = await adminIdentity();
  if (identity.role !== "ADMIN") throw new StorageError("Akses admin ditolak.", 403);
  return identity;
}

async function packagePayload() {
  const client = db();
  const [packagesResult, subtopicsResult, sectionsResult, questionsResult] = await Promise.all([
    client
      .from("practice_packages")
      .select("id,section_id,subtopic_id,code,slug,title,description,access,status,estimated_minutes,sort_order,published_at,practice_package_questions(id,question_version_id,sort_order)")
      .order("sort_order")
      .order("title"),
    client
      .from("subtopics")
      .select("id,name,topic_id,topics(id,name,domain_id,domains(id,name))")
      .eq("status", "ACTIVE")
      .order("name"),
    client
      .from("exam_sections")
      .select("id,code,name,exam_id,exams(code,name)")
      .eq("status", "ACTIVE")
      .order("sort_order"),
    client
      .from("levelup_question_bank")
      .select("id,code,version_id,status,stem_md,difficulty,section_id,section,subtopic_id,subtopic,topic,domain")
      .eq("status", "PUBLISHED")
      .order("code")
      .limit(1000),
  ]);
  const error = packagesResult.error || subtopicsResult.error || sectionsResult.error || questionsResult.error;
  if (error) throw error;
  return {
    packages: packagesResult.data || [],
    subtopics: subtopicsResult.data || [],
    sections: (sectionsResult.data || []).filter((row) => ["PK", "PM", "PU"].includes(row.code)),
    questions: questionsResult.data || [],
  };
}

export async function GET() {
  try {
    await requireAdmin();
    return Response.json({ data: await packagePayload() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return adminError(error);
  }
}

type Body = { action?: string; payload?: Record<string, unknown> };

export async function POST(request: Request) {
  try {
    await requireAdmin();
    assertOrigin(request);
    const body = (await request.json()) as Body;
    const action = body.action || "";
    const payload = body.payload || {};
    const client = db();

    if (action === "create_package") {
      const title = String(payload.title || "").trim();
      const sectionId = String(payload.section_id || "");
      const subtopicId = String(payload.subtopic_id || "");
      if (!title || !sectionId || !subtopicId)
        throw new StorageError("Judul, bagian UTBK, dan subtopik wajib diisi.", 400);
      const slugBase = String(payload.slug || title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const suffix = Date.now().toString(36);
      const code = String(payload.code || `PP-${suffix.toUpperCase()}`);
      const slug = `${slugBase}-${suffix}`;
      const { data, error } = await client
        .from("practice_packages")
        .insert({
          section_id: sectionId,
          subtopic_id: subtopicId,
          code,
          slug,
          title,
          description: String(payload.description || ""),
          access: String(payload.access || "FREE"),
          estimated_minutes: Number(payload.estimated_minutes || 15),
          sort_order: Number(payload.sort_order || 0),
          status: "DRAFT",
        })
        .select()
        .single();
      if (error) throw error;
      return Response.json({ data });
    }

    if (action === "update_package") {
      const id = String(payload.id || "");
      if (!id) throw new StorageError("Paket tidak valid.", 400);
      const { data, error } = await client
        .from("practice_packages")
        .update({
          title: String(payload.title || "").trim(),
          description: String(payload.description || ""),
          access: String(payload.access || "FREE"),
          estimated_minutes: Number(payload.estimated_minutes || 15),
          section_id: String(payload.section_id || ""),
          subtopic_id: String(payload.subtopic_id || ""),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .neq("status", "ARCHIVED")
        .select()
        .single();
      if (error) throw error;
      return Response.json({ data });
    }

    if (action === "save_questions") {
      const packageId = String(payload.package_id || "");
      const versionIds = Array.isArray(payload.question_version_ids)
        ? payload.question_version_ids.map(String)
        : [];
      if (!packageId) throw new StorageError("Paket tidak valid.", 400);
      if (versionIds.length > 10) throw new StorageError("Maksimal 10 soal per paket latihan.", 400);
      if (new Set(versionIds).size !== versionIds.length)
        throw new StorageError("Soal duplikat tidak boleh ada dalam satu paket.", 400);

      const { data: pack, error: packError } = await client
        .from("practice_packages")
        .select("id,section_id,subtopic_id,status")
        .eq("id", packageId)
        .single();
      if (packError) throw packError;
      if (pack.status === "ARCHIVED") throw new StorageError("Paket sudah diarsipkan.", 400);

      if (versionIds.length) {
        const { data: versions, error: versionsError } = await client
          .from("question_versions")
          .select("id,section_id,subtopic_id,status")
          .in("id", versionIds);
        if (versionsError) throw versionsError;
        if ((versions || []).length !== versionIds.length)
          throw new StorageError("Sebagian soal tidak ditemukan.", 400);
        const invalid = (versions || []).find(
          (row) => row.status !== "PUBLISHED" || row.section_id !== pack.section_id || row.subtopic_id !== pack.subtopic_id,
        );
        if (invalid)
          throw new StorageError("Semua soal paket harus PUBLISHED dan sesuai bagian serta subtopik paket.", 400);
      }

      const { error: deleteError } = await client
        .from("practice_package_questions")
        .delete()
        .eq("practice_package_id", packageId);
      if (deleteError) throw deleteError;
      if (versionIds.length) {
        const { error: insertError } = await client.from("practice_package_questions").insert(
          versionIds.map((questionVersionId, index) => ({
            practice_package_id: packageId,
            question_version_id: questionVersionId,
            sort_order: (index + 1) * 10,
          })),
        );
        if (insertError) throw insertError;
      }
      return Response.json({ data: { count: versionIds.length } });
    }

    if (action === "publish_package") {
      const id = String(payload.id || "");
      if (!id) throw new StorageError("Paket tidak valid.", 400);
      const { count, error: countError } = await client
        .from("practice_package_questions")
        .select("id", { count: "exact", head: true })
        .eq("practice_package_id", id);
      if (countError) throw countError;
      if ((count || 0) < 5 || (count || 0) > 10)
        throw new StorageError("Paket latihan harus berisi 5–10 soal sebelum dipublish.", 400);
      const { data, error } = await client
        .from("practice_packages")
        .update({ status: "PUBLISHED", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return Response.json({ data });
    }

    if (action === "unpublish_package") {
      const id = String(payload.id || "");
      const { data, error } = await client
        .from("practice_packages")
        .update({ status: "DRAFT", published_at: null, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return Response.json({ data });
    }

    throw new StorageError("Action practice package tidak valid.", 400);
  } catch (error) {
    return adminError(error);
  }
}
