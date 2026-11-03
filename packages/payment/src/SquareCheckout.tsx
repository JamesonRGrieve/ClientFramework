'use client';
// SPDX-License-Identifier: AGPL-3.0-or-later

import { type ReactElement, type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { ApiError, type JsonValue, useClient } from 'zephyrex';
import { Button } from 'zephyrex/ui/button';
import { type SquareAccount, type SquareEnvironment, squareScript } from './square';

const LOAD_FAILED = 'Square’s payment form could not load';

/** The slice of Square's SDK the card form uses. */
export interface SquareCard {
  attach: (target: string | HTMLElement) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: readonly { message: string }[] }>;
  destroy: () => Promise<boolean>;
}
export interface SquareSdk {
  payments: (applicationId: string, locationId: string) => { card: () => Promise<SquareCard> };
}

function isSquareSdk(value: object | undefined): value is SquareSdk {
  return value !== undefined && 'payments' in value && typeof value.payments === 'function';
}

/** Square's SDK, once its script has defined it. */
function definedSdk(): SquareSdk | null {
  const candidate = (window as Window & { Square?: object }).Square;
  return isSquareSdk(candidate) ? candidate : null;
}

/**
 * Loads Square's SDK once, from the app's own code: a server-rendered tag has no CSP nonce and
 * 'strict-dynamic' would block it, whereas a script added by trusted code is allowed.
 */
export async function loadSquareSdk(environment: SquareEnvironment): Promise<SquareSdk> {
  const existing = definedSdk();
  if (existing !== null) {
    return existing;
  }
  const src = squareScript(environment);
  let script = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (script === null) {
    script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.head.append(script);
  }
  const loading = script;
  await new Promise<void>((resolve, reject) => {
    loading.addEventListener('load', () => resolve(), { once: true });
    loading.addEventListener('error', () => reject(new Error(LOAD_FAILED)), { once: true });
  });
  const loaded = definedSdk();
  if (loaded === null) {
    throw new Error(LOAD_FAILED);
  }
  return loaded;
}

/** A product sold once, as `GET /v1/entitlement/products` lists it. */
// A type alias (not an interface) so it narrows from the client's JsonValue.
export type Product = {
  id: string;
  /** The plan it grants; null for a product that sells units (seats, credits). */
  plan: string | null;
  /** The price of one unit. */
  amount: string;
  currency: string;
  description: string;
  features: string[];
  /** How many units one purchase may buy. */
  max_quantity?: number;
  /** Whether a purchase names what the units are for (`subjectId`). */
  needs_subject?: boolean;
};

/** What `POST /v1/entitlement/purchase` answers. */
export type Purchase = {
  payment_id: string;
  status: string;
  entitlement: { plan: string; features: string[] };
};

type JsonRecord = Record<string, JsonValue>;

function isRecord(value: JsonValue | undefined): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const textIn = (value: JsonRecord, key: string): boolean => typeof value[key] === 'string';

function isProduct(value: JsonValue): value is Product {
  return (
    isRecord(value) &&
    ['id', 'amount', 'currency', 'description'].every((key) => textIn(value, key)) &&
    (value['plan'] === null || textIn(value, 'plan'))
  );
}

function isPurchase(value: JsonValue): value is Purchase {
  return isRecord(value) && textIn(value, 'status') && textIn(value, 'payment_id');
}

/** The products in a `GET /v1/entitlement/products` answer. */
function productsIn(listed: JsonValue): Product[] {
  const products = isRecord(listed) ? listed['products'] : undefined;
  return Array.isArray(products) ? products.filter(isProduct) : [];
}

/** A price for display, e.g. "$19.00" for 19.00 USD; `quantity` units cost that many times the amount. */
export function formatPrice(product: Pick<Product, 'amount' | 'currency'>, locale = 'en-US', quantity = 1): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: product.currency }).format(
    Number(product.amount) * quantity,
  );
}

/** Why a payment step failed, in words for the payer. */
function failure(caught: Error | null, fallback: string): string {
  if (caught instanceof ApiError) {
    return caught.detail;
  }
  return caught?.message ?? fallback;
}

export interface SquareCheckoutProps extends SquareAccount {
  /** The product to buy, by its id on the server (`register_product`). */
  productId: string;
  /** How many units to buy, for a product that sells units; the server charges its unit price times this. */
  quantity?: number;
  /** What the units are for (a group, a project), for a product that needs one. */
  subjectId?: string;
  /** Called once the payment has succeeded and the plan is unlocked. */
  onPurchased?: (purchase: Purchase) => void;
  /** Loads Square's SDK; replaceable so stories and tests need no network. */
  loadSdk?: (environment: SquareEnvironment) => Promise<SquareSdk>;
}

type State =
  | { phase: 'loading' }
  | { phase: 'ready' | 'paying' | 'done'; product: Product }
  | { phase: 'unavailable'; message: string };

const SUCCEEDED = 'succeeded';

/**
 * Buys a product once with a card, through Square's own card form (the card number never touches
 * the app). The price shown comes from the server's product list, and the server charges its own
 * price: the client sends only which product, and Square's one-time token for the card.
 */
export function SquareCheckout({
  applicationId = '',
  locationId = '',
  environment = 'production',
  productId,
  quantity = 1,
  subjectId,
  onPurchased,
  loadSdk = loadSquareSdk,
}: SquareCheckoutProps): ReactElement {
  const client = useClient();
  const cardRef = useRef<SquareCard | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const configured = applicationId !== '' && locationId !== '';

  useEffect(() => {
    if (!configured) {
      return undefined;
    }
    // An object, so the loader below sees the cleanup's write after its awaits.
    const mounted = { current: true };
    void (async () => {
      try {
        const offered = productsIn(await client.get('/v1/entitlement/products')).find((p) => p.id === productId);
        if (offered === undefined) {
          throw new Error('This product is not for sale here');
        }
        const sdk = await loadSdk(environment);
        const card = await sdk.payments(applicationId, locationId).card();
        const container = containerRef.current;
        if (!mounted.current || container === null) {
          void card.destroy();
          return;
        }
        await card.attach(container);
        cardRef.current = card;
        setState({ phase: 'ready', product: offered });
      } catch (caught) {
        if (mounted.current) {
          setState({
            phase: 'unavailable',
            message: failure(caught instanceof Error ? caught : null, 'Payments are unavailable'),
          });
        }
      }
    })();
    return () => {
      mounted.current = false;
      void cardRef.current?.destroy();
      cardRef.current = null;
    };
  }, [client, configured, applicationId, locationId, environment, productId, loadSdk]);

  const pay = async (event: SyntheticEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const card = cardRef.current;
    if (state.phase !== 'ready' || card === null) {
      return;
    }
    const buying = state.product;
    setError(null);
    setState({ phase: 'paying', product: buying });
    try {
      const token = await card.tokenize();
      if (token.status !== 'OK' || token.token === undefined) {
        throw new Error(token.errors?.map((e) => e.message).join(' ') ?? 'Check the card details and try again');
      }
      const answer = await client.post('/v1/entitlement/purchase', {
        product_id: buying.id,
        payment_method_id: token.token,
        quantity,
        ...(subjectId === undefined ? {} : { subject_id: subjectId }),
      });
      if (!isPurchase(answer)) {
        throw new Error('The payment could not be confirmed');
      }
      if (answer.status !== SUCCEEDED) {
        throw new Error(`The payment was not completed (${answer.status})`);
      }
      setState({ phase: 'done', product: buying });
      onPurchased?.(answer);
    } catch (caught) {
      setError(failure(caught instanceof Error ? caught : null, 'Payment failed'));
      setState({ phase: 'ready', product: buying });
    }
  };

  if (!configured) {
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        Card payments are not available here yet.
      </p>
    );
  }
  if (state.phase === 'unavailable') {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {state.message}
      </p>
    );
  }
  if (state.phase === 'done') {
    return (
      <p role='status' className='font-medium'>
        {state.product.plan === null
          ? `Payment received for ${quantity} × ${state.product.description}.`
          : `Payment received. ${state.product.description} is unlocked.`}
      </p>
    );
  }
  const product = state.phase === 'loading' ? null : state.product;
  return (
    <form onSubmit={(event) => void pay(event)} className='space-y-4' aria-busy={state.phase !== 'ready'}>
      {product !== null && (
        <p>
          {product.description}
          {quantity > 1 && ` × ${quantity}`}:{' '}
          <span className='font-semibold'>{formatPrice(product, 'en-US', quantity)}</span>
        </p>
      )}
      <fieldset className='min-h-24'>
        <legend className='sr-only'>Card details</legend>
        {/* Square mounts its card form (its own iframe) here. */}
        <div ref={containerRef} />
      </fieldset>
      {error !== null && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      )}
      <Button type='submit' disabled={state.phase !== 'ready'}>
        {product === null
          ? 'Loading…'
          : state.phase === 'paying'
            ? 'Paying…'
            : `Pay ${formatPrice(product, 'en-US', quantity)}`}
      </Button>
    </form>
  );
}
