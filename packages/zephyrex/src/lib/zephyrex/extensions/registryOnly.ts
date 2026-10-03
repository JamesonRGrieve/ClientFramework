// SPDX-License-Identifier: AGPL-3.0-or-later
// Server extensions with no client code yet: the registry carries each one's name and description,
// and a @zephyrex/<extension> package extends its entry (imported from `zephyrex/extensions`) when
// its pages land.
import type { ZephyrexClientExtension } from '../types';
import { createExtension } from './createExtension';

const entry = (name: string, displayName: string, description: string): ZephyrexClientExtension =>
  createExtension(name, { displayName, description });

// AI, ported from AGInfrastructure: these have routes, and their pages come with the port.
export const aiAgentsExtension = entry('ai_agents', 'AI Agents', 'Agents, their abilities, memories, projects and activity');
export const aiChainsExtension = entry('ai_chains', 'AI Chains', 'Chains of AI steps for automating multi-step tasks');
export const aiMemoriesExtension = entry(
  'ai_memories',
  'AI Memories',
  'Long-term memory: storage, retrieval and consolidation',
);
export const aiPromptsExtension = entry('ai_prompts', 'AI Prompts', 'Prompt templates and their arguments');
export const aiTasksExtension = entry('ai_tasks', 'AI Tasks', 'Scheduled and automated AI tasks');
export const aiTuningExtension = entry('ai_tuning', 'AI Tuning', 'Model fine-tuning and training runs');
export const conversationsExtension = entry(
  'conversations',
  'Conversations',
  'Direct and group conversations, threaded messages, feedback and artifacts',
);
export const ecommerceExtension = entry('ecommerce', 'E-commerce', 'Marketplaces such as Amazon, Walmart and Shopify');
export const healthExtension = entry('health', 'Health', 'Health tracking and fitness data');
// Social: @zephyrex/social extends this with the pages for what was published.
export const socialExtension = entry(
  'social',
  'Social Media',
  'Posting to X, Facebook, Instagram, Threads, TikTok and Postiz, and the record of what was published',
);

// Money: payment's pricing table waits for the federated checkout; billing is internal cost
// accounting with no client surface.
export const paymentExtension = entry('payment', 'Payments', 'Payments through Stripe, Square, PayPal, Helcim or Moneris');
export const billingExtension = entry('billing', 'Billing', 'Cost models, daily cost summaries and per-tenant cost audit');

// Identity protocols, each a consumer (sign in through another system) or a provider (this server
// as one). Their client pages wait for the server's routes.
const consumer = (name: string, displayName: string, description: string): ZephyrexClientExtension =>
  entry(`${name}_consumer`, `${displayName} sign-in`, description);
const provider = (name: string, displayName: string, description: string): ZephyrexClientExtension =>
  entry(`${name}_provider`, `${displayName} provider`, description);

export const authOauth2ServerExtension = entry(
  'auth_oauth2_server',
  'OAuth2 Server',
  'Third-party OAuth2 clients, the authorization-code flow with PKCE, and revocable tokens',
);
export const forwardAuthConsumerExtension = consumer(
  'forward_auth',
  'Forward auth',
  'Sign-in through a forward-auth subrequest',
);
export const forwardAuthProviderExtension = provider('forward_auth', 'Forward auth', 'A forward-auth endpoint for proxies');
export const kerberosConsumerExtension = consumer(
  'kerberos',
  'Kerberos',
  'Sign-in through Kerberos/SPNEGO against an external KDC',
);
export const kerberosProviderExtension = provider('kerberos', 'Kerberos', 'This server as a Kerberos KDC');
export const ldapConsumerExtension = consumer('ldap', 'LDAP', 'Sign-in against an LDAP or Active Directory server');
export const ldapProviderExtension = provider('ldap', 'LDAP', 'This server as an LDAP directory');
export const oauthConsumerExtension = consumer('oauth', 'OAuth', 'Sign-in through OAuth2 identity providers');
export const oauthProviderExtension = provider('oauth', 'OAuth', 'This server as an OAuth2 issuer');
export const oidcConsumerExtension = consumer('oidc', 'OpenID Connect', 'Sign-in through an OpenID Connect provider');
export const oidcProviderExtension = provider('oidc', 'OpenID Connect', 'This server as an OpenID Connect provider');
export const proxyAuthConsumerExtension = consumer('proxy_auth', 'Proxy auth', 'Sign-in from trusted proxy headers');
export const proxyAuthProviderExtension = provider(
  'proxy_auth',
  'Proxy auth',
  'Trusted auth headers for downstream services',
);
export const radiusConsumerExtension = consumer('radius', 'RADIUS', 'Sign-in against a RADIUS server');
export const radiusProviderExtension = provider('radius', 'RADIUS', 'This server as a RADIUS authenticator');
export const samlConsumerExtension = consumer('saml', 'SAML', 'Sign-in through a SAML 2.0 identity provider');
export const samlProviderExtension = provider('saml', 'SAML', 'This server as a SAML 2.0 identity provider');
export const scimConsumerExtension = consumer('scim', 'SCIM', 'Users and groups provisioned from a SCIM 2.0 provider');
export const scimProviderExtension = provider('scim', 'SCIM', 'Users and groups provisioned to SCIM 2.0 services');
export const webauthnConsumerExtension = consumer('webauthn', 'Passkey', 'Sign-in with WebAuthn passkeys');
export const webauthnProviderExtension = provider('webauthn', 'WebAuthn', 'This server as a WebAuthn relying party');
export const x509ConsumerExtension = consumer('x509', 'Certificate', 'Sign-in with X.509 client certificates');
export const x509ProviderExtension = provider('x509', 'X.509', 'This server as a certificate authority');

/** Every registry-only extension, for the registry. */
export const registryOnlyExtensions: readonly ZephyrexClientExtension[] = [
  aiAgentsExtension,
  aiChainsExtension,
  aiMemoriesExtension,
  aiPromptsExtension,
  aiTasksExtension,
  aiTuningExtension,
  authOauth2ServerExtension,
  billingExtension,
  conversationsExtension,
  ecommerceExtension,
  forwardAuthConsumerExtension,
  forwardAuthProviderExtension,
  healthExtension,
  kerberosConsumerExtension,
  kerberosProviderExtension,
  ldapConsumerExtension,
  ldapProviderExtension,
  oauthConsumerExtension,
  oauthProviderExtension,
  oidcConsumerExtension,
  oidcProviderExtension,
  paymentExtension,
  proxyAuthConsumerExtension,
  proxyAuthProviderExtension,
  radiusConsumerExtension,
  radiusProviderExtension,
  samlConsumerExtension,
  samlProviderExtension,
  scimConsumerExtension,
  scimProviderExtension,
  socialExtension,
  webauthnConsumerExtension,
  webauthnProviderExtension,
  x509ConsumerExtension,
  x509ProviderExtension,
];
