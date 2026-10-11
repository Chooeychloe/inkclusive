import { z } from 'zod/v4';

export const formSchema = z.object({
	term: z.string().min(1, 'Required'),
	alternatives: z.string().min(1, 'Required'),
	category: z.string().default('Other'),
	guidance: z.string().default(''),
	examples: z.string().default('')
});

export type FormSchema = typeof formSchema;
