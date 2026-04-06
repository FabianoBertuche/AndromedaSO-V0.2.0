export interface Pricing {
    inputPer1M?: number;
    outputPer1M?: number;
    currency?: "USD" | "BRL" | string;
    source?: "official" | "manual" | "estimated" | "unknown";
}
