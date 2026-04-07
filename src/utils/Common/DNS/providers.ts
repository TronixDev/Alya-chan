import type { DNSProvider, ProviderType } from "#alya/types";

export type { DNSProvider, ProviderType };

export const DNS_PROVIDERS: DNSProvider[] = [
	{
		name: "1.1.1.1 (Cloudflare)",
		info: "https://developers.cloudflare.com/1.1.1.1/",
		doh: {
			endpoint: "https://cloudflare-dns.com/dns-query",
			type: "json",
		},
		dig: "1.1.1.1",
	},
	{
		name: "1.1.1.2 (Cloudflare Malware Blocking)",
		info: "https://developers.cloudflare.com/1.1.1.1/setup/#1111-for-families",
		doh: {
			endpoint: "https://1.1.1.2/dns-query",
			type: "json",
		},
		dig: "1.1.1.2",
	},
	{
		name: "1.1.1.3 (Cloudflare Malware + Adult Content Blocking)",
		info: "https://developers.cloudflare.com/1.1.1.1/setup/#1111-for-families",
		doh: {
			endpoint: "https://1.1.1.3/dns-query",
			type: "json",
		},
		dig: "1.1.1.3",
	},
	{
		name: "8.8.8.8 (Google)",
		info: "https://developers.google.com/speed/public-dns",
		doh: {
			endpoint: "https://dns.google/resolve",
			type: "json",
		},
		dig: "8.8.8.8",
	},
	{
		name: "9.9.9.9 (Quad9)",
		info: "https://www.quad9.net/",
		doh: {
			endpoint: "https://dns.quad9.net/dns-query",
			type: "dns",
		},
		dig: "9.9.9.9",
	},
];

export const VALID_TYPES = [
	"A",
	"AAAA",
	"CAA",
	"CERT",
	"CNAME",
	"MX",
	"NS",
	"SPF",
	"SRV",
	"TXT",
	"DNSKEY",
	"DS",
	"LOC",
	"URI",
	"HTTPS",
	"NAPTR",
	"PTR",
	"SMIMEA",
	"SOA",
	"SSHFP",
	"SVCB",
	"TLSA",
	"HINFO",
	"CDS",
	"CDNSKEY",
	"AFSDB",
	"APL",
	"CSYNC",
	"DHCID",
	"DLV",
	"DNAME",
	"EUI48",
	"EUI64",
	"HIP",
	"IPSECKEY",
	"KEY",
	"KX",
	"NSEC",
	"NSEC3",
	"NSEC3PARAM",
	"OPENPGPKEY",
	"RP",
	"TA",
	"TKEY",
	"ZONEMD",
];
