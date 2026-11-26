# Neve Alpi Liguri

Previsioni neve a 7 giorni per Garessio 2000, Monesi, Colle d'Oggia e Colle del Turini.

- `index.html`: schermata iniziale (scegli Montagna o Mare).
- `neve.html`: il sito della neve.
- `mare.html`: le onde a Tre Ponti, Sanremo (dati presi dal vivo da Open-Meteo).
- `scripts/aggiorna.mjs`: scarica le previsioni da Open-Meteo e le salva in `data/meteo.json`.
- `.github/workflows/aggiorna.yml`: fa girare lo script ogni 2 ore. Per aggiornare subito: scheda **Actions** → **Aggiorna previsioni** → **Run workflow**.

Dati meteo: [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0). Uso non commerciale.

Edit by PROP-ANO
