import type { AuthUser, LoginBody, RegisterBody } from "./types";
import { validateLoginBody, validateRegisterBody } from "./validators";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createRouteClient } from "@/lib/supabase/route";
import { getSiteUrl } from "@/lib/site-url";

export async function registerUser(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const validationError = validateRegisterBody(body);

    if (validationError) {
      return apiError(validationError);
    }

    const supabase = await createRouteClient();
    const email = body.email.trim().toLowerCase();
    const siteUrl = getSiteUrl(request);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: body.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: {
          full_name: body.fullName.trim(),
          phone: body.phone?.trim() ?? null,
        },
      },
    });

    if (error) {
      return apiError(error.message);
    }

    if (!data.user) {
      return apiError("Registration failed. Please try again.");
    }

    if (data.user.identities?.length === 0) {
      return apiError("An account with this email already exists.");
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      fullName: body.fullName.trim(),
      isAdmin: false,
    };

    return apiSuccess({
      user,
      message: data.session
        ? "Account created successfully."
        : "Account created. Please check your email to confirm your account.",
    });
  } catch {
    return apiError("Invalid request body.", 400);
  }
}

export async function loginUser(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const validationError = validateLoginBody(body);

    if (validationError) {
      return apiError(validationError);
    }

    const supabase = await createRouteClient();
    const email = body.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: body.password,
    });

    if (error) {
      return apiError("Invalid email or password.", 401);
    }

    if (!data.user) {
      return apiError("Login failed. Please try again.", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, is_admin")
      .eq("id", data.user.id)
      .single();

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? email,
      fullName:
        profile?.full_name ??
        (data.user.user_metadata?.full_name as string | undefined) ??
        null,
      isAdmin: profile?.is_admin ?? false,
    };

    return apiSuccess({ user, message: "Logged in successfully." });
  } catch {
    return apiError("Invalid request body.", 400);
  }
}

export async function logoutUser() {
  const supabase = await createRouteClient();
  await supabase.auth.signOut();
  return apiSuccess({ message: "Logged out successfully." });
}

export async function getCurrentUser() {
  const supabase = await createRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return apiError("Not authenticated.", 401);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_admin")
    .eq("id", user.id)
    .single();

  const authUser: AuthUser = {
    id: user.id,
    email: user.email ?? "",
    fullName:
      profile?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      null,
    isAdmin: profile?.is_admin ?? false,
  };

  return apiSuccess({ user: authUser });
}
