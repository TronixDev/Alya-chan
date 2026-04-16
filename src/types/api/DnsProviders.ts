/** DoH / resolver metadata used by `DNS_PROVIDERS` in utils. */
export type ProviderType = "json" | "dns";

export interface DNSProvider {
	name: string;
	info: string;
	doh: {
		endpoint: string;
		type: ProviderType;
	};
	dig: string;
}
