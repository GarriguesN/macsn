// clients.baml — BAML client definitions
// MiniMax M3 (openai-generic)
//
// BAML `openai-generic` does NOT let us override the per-endpoint path
// (it hardcodes /chat/completions). For MiniMax's
// /v1/text/chatcompletion_v2 path we use the manual wrapper in
// src/lib/baml.ts. This BAML file remains as the schema source of truth
// and would be the natural integration point if BAML ever supports a
// per-client `path` option.

client<llm> MiniMax {
  provider "openai-generic"
  options {
    base_url "https://api.minimax.io/v1/text"
    api_key env.MINIMAX_API_KEY
    model "MiniMax-M3"
  }
}
