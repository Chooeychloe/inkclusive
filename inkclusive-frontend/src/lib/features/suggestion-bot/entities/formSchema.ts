export type TformSchema = {
	name: string;
	pronoun: string;
};

const validPronouns = new Set(['male', 'female', 'gender_fair']);

export function getSavedPronounPreferenceMap(): Record<string, string> {
	if (typeof localStorage === 'undefined') return {};
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem('preferences') || '[]');
		if (!Array.isArray(parsed)) return {};

		const seenNames = new Set<string>();
		return parsed.reduce<Record<string, string>>((result, item: unknown) => {
			if (!item || typeof item !== 'object') return result;
			const preference = item as Partial<TformSchema>;
			const name = typeof preference.name === 'string' ? preference.name.trim() : '';
			const pronoun = preference.pronoun;
			const normalizedName = name.toLocaleLowerCase();
			if (name && !seenNames.has(normalizedName) && typeof pronoun === 'string' && validPronouns.has(pronoun)) {
				seenNames.add(normalizedName);
				result[name] = pronoun;
			}
			return result;
		}, {});
	} catch {
		return {};
	}
}
