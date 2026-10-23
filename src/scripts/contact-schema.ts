import { z } from 'zod';

// お問い合わせフォームの入力ルール。画面に出す文言もここに置く。
// サーバ側の検証は Web3Forms 任せなので、ここは入力ミスを早く知らせるためのもの。
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'お名前を入力してください。')
    .max(100, 'お名前は100文字以内で入力してください。'),
  email: z
    .string()
    .trim()
    .min(1, 'メールアドレスを入力してください。')
    .pipe(z.email('メールアドレスの形式で入力してください。(例: name@example.com)'))
    .pipe(z.string().max(200, 'メールアドレスは200文字以内で入力してください。')),
  message: z
    .string()
    .trim()
    .min(10, 'ご用件は10文字以上で入力してください。')
    .max(4000, 'ご用件は4000文字以内で入力してください。'),
});

export type ContactField = keyof z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const contactFields = Object.keys(contactSchema.shape) as ContactField[];

export function validateContact(input: Record<string, unknown>) {
  const result = contactSchema.safeParse(input);
  if (result.success) return { ok: true as const, data: result.data };
  const errors: ContactErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as ContactField;
    errors[key] ??= issue.message;
  }
  return { ok: false as const, errors };
}

export function validateContactField(field: ContactField, value: string) {
  const result = contactSchema.shape[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
}
