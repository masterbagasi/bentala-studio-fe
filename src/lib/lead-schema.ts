import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const leadSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  brand_name: z.string().trim().min(1, "Nama brand wajib diisi"),
  whatsapp_number: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .refine((v) => isValidPhoneNumber(v), {
      message: "Format nomor WA tidak valid (contoh: +6281234567890)",
    }),
  project_type: z.string().trim().min(1, "Pilih jenis kebutuhan"),
  notes: z.string().max(500, "Maksimal 500 karakter").optional(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

export type LeadPayload = LeadFormData & {
  submitted_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  user_agent?: string;
};
