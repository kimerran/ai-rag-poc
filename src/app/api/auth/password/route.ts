import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChangePasswordSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();
    const result = ChangePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Invalid input", details: result.error.errors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;
    const user = await prisma.user.findUniqueOrThrow({ where: { id: authUser.userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: authUser.userId }, data: { passwordHash } });
    return NextResponse.json({ data: { success: true } });
  } catch (error: unknown) {
    if (error instanceof Error && "status" in error) {
      const e = error as { status: number; code: string; message: string };
      return NextResponse.json({ error: e.code, message: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Server error" }, { status: 500 });
  }
}
