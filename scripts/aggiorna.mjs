// Scarica le previsioni da Open-Meteo e le salva in data/meteo.json.
// Lo esegue GitHub ogni 2 ore (vedi .github/workflows/aggiorna.yml).
// I parametri devono restare uguali a quelli di neve.html.
import { writeFile, mkdir } from 'node:fs/promises';

const PLACES = [
  { id: 'garessio', lat: 44.2165, lon: 7.9446, alt: 1381, zone: [[44.185, 7.90], [44.245, 8.04]] },
  { id: 'monesi',   lat: 44.0770, lon: 7.7470, alt: 1310, zone: [[44.04, 7.72], [44.13, 7.90]] },
  { id: 'oggia',    lat: 43.9990, lon: 7.8330, alt: 1167, zone: [[43.94, 7.785], [44.035, 7.905]] },
  { id: 'turini',   lat: 43.9775, lon: 7.3914, alt: 1607, zone: [[43.925, 7.30], [44.01, 7.47]] },
];
// Stesso ordine di MODELS in neve.html
const MODELS = ['ecmwf_ifs025', 'icon_seamless', 'meteofrance_seamless', 'italia_meteo_arpae_icon_2i'];
// Modelli per le mini mappe (valore di mezzo)
const MAP_MODELS = ['icon_seamless', 'italia_meteo_arpae_icon_2i', 'meteofrance_seamless'];
const MR = [0, 1, 2, 3, 4], MC = [0, 1, 2, 3, 4, 5, 6];

// Stessa griglia di gridFor() in neve.html
function gridFor(p) {
  const [[s, w], [n, e]] = p.zone, cla = (s + n) / 2, clo = (w + e) / 2, k = Math.cos(cla * Math.PI / 180);
  const hKm = (n - s) * 111, wKm = (e - w) * 111 * k, W = Math.max(wKm, hKm * 2.6) * 1.08, H = Math.max(hKm, wKm / 1.2) * 1.08;
  const dla = H / 111, dlo = W / (111 * k);
  return {
    lats: MR.map(i => cla - dla / 2 + i * dla / (MR.length - 1)),
    lons: MC.map(j => clo - dlo / 2 + j * dlo / (MC.length - 1)),
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const api = params => 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams(params).toString();

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) throw new Error(`errore ${r.status}: ${(await r.text()).slice(0, 200)}`);
      console.warn(`Risposta ${r.status}, riprovo…`);
    } catch (e) {
      if (i === tries - 1) throw e;
      console.warn('Errore di rete, riprovo…', e.message);
    }
    await sleep(30000 * (i + 1));
  }
  throw new Error('troppi tentativi');
}

const modelli = [];
for (const m of MODELS) {
  try {
    modelli.push(await get(api({
      latitude: PLACES.map(p => p.lat).join(','), longitude: PLACES.map(p => p.lon).join(','),
      elevation: PLACES.map(p => p.alt).join(','),
      daily: 'snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min',
      hourly: 'snowfall,freezing_level_height,temperature_2m',
      models: m, timezone: 'Europe/Rome', forecast_days: '7',
    })));
    console.log('OK', m);
  } catch (e) {
    console.warn('Modello non disponibile:', m, e.message);
    modelli.push(null);
  }
  await sleep(2000);
}
if (!modelli.some(Boolean)) {
  console.error('Nessun modello disponibile: tengo i dati precedenti.');
  process.exit(1);
}

let locali = null;
try {
  const pts = PLACES.flatMap(p => { const g = gridFor(p); return g.lats.flatMap(la => g.lons.map(lo => [la.toFixed(4), lo.toFixed(4)])); });
  locali = await get(api({
    latitude: pts.map(x => x[0]).join(','), longitude: pts.map(x => x[1]).join(','),
    hourly: 'snowfall', models: MAP_MODELS.join(','), timezone: 'Europe/Rome', forecast_days: '2',
  }));
  console.log('OK mini mappe:', Array.isArray(locali) ? locali.length : 1, 'punti');
} catch (e) {
  console.warn('Mini mappe non disponibili:', e.message);
}

await mkdir('data', { recursive: true });
await writeFile('data/meteo.json', JSON.stringify({ aggiornato: new Date().toISOString(), modelli, locali }));
console.log('Salvato data/meteo.json');
