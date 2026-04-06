export interface LocaleRegistry {
    id: string;
    code: string;
    name: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
}

export interface LocalizedMessage {
    id: string;
    key: string;
    locale: string;
    value: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserPreferences {
    id: string;
    userId: string;
    preferredLocale: string;
    fallbackLocale: string;
    theme: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface LocaleRepository {
    list(): Promise<LocaleRegistry[]>;
    getByCode(code: string): Promise<LocaleRegistry | null>;
    create(data: { code: string; name: string; isDefault?: boolean }): Promise<LocaleRegistry>;
}

export interface MessageRepository {
    findByKeyAndLocale(key: string, locale: string): Promise<LocalizedString | null>;
    findByCategory(locale: string, category: string): Promise<LocalizedString[]>;
    findByLocale(locale: string): Promise<LocalizedString[]>;
    create(data: { key: string; locale: string; value: string; category: string }): Promise<LocalizedString>;
    createMany(messages: Array<{ key: string; locale: string; value: string; category: string }>): Promise<number>;
}

export interface PreferencesRepository {
    getByUserId(userId: string): Promise<UserPreferences | null>;
    upsert(userId: string, data: { preferredLocale?: string; fallbackLocale?: string; theme?: string }): Promise<UserPreferences>;
}

export interface LocalizedString {
    key: string;
    locale: string;
    value: string;
    category: string;
}