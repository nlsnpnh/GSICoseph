import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// As funcoes puras testadas moram em modulos que tambem exportam hooks do
// Supabase. O client real exige env vars e nao e usado nos testes, entao fica
// stubado globalmente para os imports nao quebrarem.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({}),
    auth: { getUser: async () => ({ data: { user: null } }) },
    storage: { from: () => ({}) },
  },
}));
