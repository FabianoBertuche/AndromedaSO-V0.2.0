import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LOCALES = [
    { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
];

export function LocaleSwitcher() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const currentLocale = LOCALES.find((l) => l.code === i18n.language) || LOCALES[1];

    const handleChange = async (code: string) => {
        await i18n.changeLanguage(code);
        localStorage.setItem('i18nextLng', code);
        setIsOpen(false);

        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/v1/users/me/preferences', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ preferredLocale: code }),
                });
            }
        } catch {
            // Ignore API errors
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={i18n.t('locale.switch')}
            >
                <Globe className="w-4 h-4" />
                <span>{currentLocale.flag}</span>
                <span className="hidden sm:inline">{currentLocale.label}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {LOCALES.map((locale) => (
                        <button
                            key={locale.code}
                            onClick={() => handleChange(locale.code)}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                                locale.code === i18n.language ? 'bg-gray-50 font-medium' : ''
                            }`}
                        >
                            <span>{locale.flag}</span>
                            <span>{locale.label}</span>
                            {locale.code === i18n.language && (
                                <span className="ml-auto text-green-600">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}