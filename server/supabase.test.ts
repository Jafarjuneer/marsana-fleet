import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase Connection", () => {
  it("should connect to Supabase with valid credentials", async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(supabaseAnonKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

    // Test basic connection by fetching auth status
    const { data, error } = await supabase.auth.getSession();

    // Connection is valid if we can call the API without network errors
    // (session being null is expected for unauthenticated requests)
    expect(error).toBeNull();
  });

  it("should have service role key available for backend operations", () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(serviceRoleKey).toBeDefined();
    // Service role key is a JWT token
    expect(serviceRoleKey).toMatch(/^[a-zA-Z0-9_.-]+$/);
  });
});
