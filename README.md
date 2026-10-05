# EPG Mapper

Provider-agnostic tooling for turning IPTV M3U playlists into curated, EPG-aware playlists using XMLTV data.

## Initial scope

- MegaOTT as the first provider adapter
- EPG6/XMLTV as the first guide source
- Markets: UK, US, CA, IE, AU, NZ
- Curated order:
  1. UK sports (Sky, TNT, Premier, football, racing)
  2. NFL
  3. UK entertainment
  4. UK news / kids / documentary / music / regional
  5. US sports
  6. US entertainment / networks / news
  7. Ireland
  8. Canada
  9. Australia
  10. New Zealand
- Unmatched channels are retained.
- Provider prefixes such as EU / AM / OC are metadata, not countries.

## Security

Never commit provider playlist URLs, usernames, passwords, or generated playlists containing provider credentials.

For automation, use GitHub Actions secrets for provider inputs and publish generated output to external storage.

## Development

```bash
npm install
npm run build
npm start
```

The CLI will evolve as the provider adapters and matcher are implemented.
