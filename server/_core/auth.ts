import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

/**
 * Create a Supabase client for server-side operations
 * Uses service role key for admin access
 */
export function createSupabaseServerClient() {
  return createClient(
    ENV.supabaseUrl,
    ENV.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Extract user ID from JWT token
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Get current user from Supabase Auth
 */
export async function getCurrentUser(token: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as any).role;
}

/**
 * Get user branch from database
 */
export async function getUserBranch(userId: string) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("users")
    .select("branch_id")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as any).branch_id;
}

/**
 * Sync Supabase Auth user to database
 */
export async function syncAuthUserToDatabase(
  userId: string,
  email: string,
  fullName?: string
) {
  const supabase = createSupabaseServerClient();

  try {
    // First check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingUser) {
      // User already exists, just update email/name if provided
      const { error } = await supabase
        .from("users")
        .update({
          email,
          full_name: fullName,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update user in database:", error);
        return false;
      }
    } else {
      // Create new user with raw query
      const { error } = await (supabase as any).rpc("create_user_from_auth", {
        p_user_id: userId,
        p_email: email,
        p_full_name: fullName,
      });

      if (error) {
        console.error("Failed to create user in database:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("Error syncing user:", err);
    return false;
  }
}
