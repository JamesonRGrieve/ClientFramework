# Extension System

A static core + installable extensions, modeled on the ServerFramework pattern. Downstream forks customize behavior by editing one file (`src/extensions/index.tsx`) and adding their own directories under `src/extensions/`. The core never touches downstream files, so framework merges stay conflict-free.

## Layout

```
src/extensions/
  types.ts                     # Manifest + contribution types
  index.tsx                    # Registry + React runtime (ExtensionProviders, Slot, getExtensionNav)
  middleware.ts                # Edge-safe middleware chain (React-free)
  example-banner/              # Example extension — delete in downstream forks
    index.ts                   # Manifest
    provider.tsx               # 'use client' context provider
    FooterStamp.tsx            # Slot contribution
```

## Manifest

Each extension exports a default `ExtensionManifest`:

```ts
{
  id: 'my-extension',
  version: '0.1.0',
  providers: [MyProvider],            // Wrapped around <body> children, outermost first
  nav: [{ title, url, order, ... }],  // Appended to the sidebar
  slots: [{ id: 'nav.footer', render: MyComponent, order }],
}
```

## Injection points

| Point                    | Mechanism                                    | Where it lives                       |
| ------------------------ | -------------------------------------------- | ------------------------------------ |
| React provider tree      | `providers: ComponentType[]`                 | `app/layout.tsx` `<ExtensionProviders>` |
| Sidebar nav              | `nav: ExtensionNavItem[]`                    | `app/NavMain.tsx` via `getExtensionNav()` |
| Named UI slot            | `slots: [{ id, render, order? }]`            | Anywhere — `<Slot id='...' />`       |
| Edge middleware          | `extensionMiddleware` array in `middleware.ts` | `src/middleware.tsx` hook chain     |

Slot ids are declared in `types.ts` (`SlotId` union). Adding a new injection point to the framework means adding a new id and rendering `<Slot id='...' />` in the appropriate core file. Extensions can contribute to any declared slot without further core changes.

## Why the middleware split

`src/extensions/middleware.ts` is a separate module from `index.tsx` so the edge runtime that loads `src/middleware.tsx` never imports React or any client component. Manifests imported by `index.tsx` may pull in a full React tree; the edge bundle stays small and serializable.

## Adding an extension

1. Create `src/extensions/<name>/` with an `index.ts` exporting a default `ExtensionManifest`.
2. Add it to the array in `src/extensions/index.tsx`.
3. (Optional) If it ships middleware, append a hook to `extensionMiddleware` in `middleware.ts`.

## Removing the example

Delete `src/extensions/example-banner/` and remove its entry from the `extensions` array in `index.tsx`.

## Constraints

- Every injection point must be declared in core. Extensions cannot invent new slot ids without a framework change.
- Manifests must be statically importable — no dynamic env-driven `await import()` calls inside the registry, since the edge runtime requires a static dependency graph.
- An extension's React tree is loaded for every request; gate expensive work behind feature flags or user state inside the components, not at the manifest level.
