import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const CreateConversationSchema = z.object({
  title: z.string().optional(),
});

export const ChatSchema = z.object({
  conversationId: z.string().cuid(),
  query: z.string().min(1).max(4000),
  documentIds: z.array(z.string().cuid()).optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const DocumentStatusFilterSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "READY", "FAILED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
