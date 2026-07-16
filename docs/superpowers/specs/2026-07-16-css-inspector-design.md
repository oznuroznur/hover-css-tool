# CSS Inspector — Tasarım Dokümanı

**Tarih:** 2026-07-16
**Durum:** Otonom oturumda, kullanıcının verdiği teknik şartnameye göre hazırlandı.
Şartnamenin açık bıraktığı kararlar burada gerekçeleriyle verildi.

## Amaç

Sayfadaki bir elemente hover/tıklama ile o elementin CSS'ini üç formatta
(CSS, SCSS, Tailwind) gösteren ve kopyalatan, Chrome + Firefox uyumlu MV3
tarayıcı uzantısı.

## Karar 1 — Cross-browser strateji: hafif shim (WXT ve polyfill yerine)

Şartname `webextension-polyfill` öneriyor, alternatif olarak WXT'yi değerlendirmemi
istiyordu. Değerlendirme:

| Seçenek | Artı | Eksi |
|---|---|---|
| WXT | Manifest üretimi, HMR, tek kod tabanı | Vite + onlarca bağımlılık; 6 dosyalık uzantı için ağır |
| webextension-polyfill | Mozilla'nın resmi çözümü, geniş API uyumluluğu | Asıl değeri callback→Promise dönüşümü; MV3'te Chrome API'leri zaten Promise döndürüyor |
| **3 satırlık shim** (seçilen) | Sıfır bağımlılık, bundler gerekmez | Sadece kullanılan API'ler için garanti verir |

Bu uzantının kullandığı API'ler yalnızca `action.onClicked`,
`scripting.executeScript`, `tabs.sendMessage`, `runtime.onMessage` — hepsi hem
Chrome MV3'te hem Firefox MV3'te Promise tabanlı ve isim-uyumlu. Bu yüzden
`const ext = globalThis.browser ?? globalThis.chrome` shim'i yeterli.
İleride daha egzotik API'ler gerekirse polyfill'e geçiş tek satırlık değişiklik.

## Karar 2 — İki manifest, concat tabanlı build

- `src/manifest.chrome.json`: `background.service_worker` (Chrome MV3 zorunluluğu).
- `src/manifest.firefox.json`: `background.scripts` (Firefox service worker
  desteklemez, event page kullanır) + `browser_specific_settings.gecko.id`.
- `build.js` (saf Node, bağımlılıksız): `src/lib/*` + content dosyalarını tek
  `content.js` olarak IIFE içinde birleştirir, `dist/chrome/` ve `dist/firefox/`
  paketlerini üretir. Bundler yok.
- Lib dosyaları UMD-vari: tarayıcıda global namespace'e, Node'da
  `module.exports`'a yazar → `node:test` ile bağımlılıksız test edilebilir.

## Karar 3 — Dinamik enjeksiyon (statik content_scripts yerine)

İkon tıklanınca background, `activeTab` + `scripting.executeScript` ile content
script'i o sekmeye enjekte eder ve toggle mesajı yollar. Böylece `<all_urls>`
host izni gerekmez ("tüm sitelerde verilerinizi okur" uyarısı çıkmaz).
İkinci tıklamada script zaten yüklüyse sadece toggle mesajı gider
(önce `tabs.sendMessage` dene, hata alırsan enjekte et deseni).

## Karar 4 — "Default olmayan" property tespiti: gizli iframe baseline

Elementin `getComputedStyle` çıktısı, aynı tag'in **boş bir `about:blank`
iframe içindeki** computed style'ıyla karşılaştırılır (tag başına cache'lenir).
Baseline'a eşit değerler elenir. Sabit default tablosu tutmaktan daha doğru,
tarayıcılar arası fark otomatik çözülür. Karşılaştırma ve önceliklendirme saf
fonksiyon (`css-filter.js`), DOM'suz test edilir.

Sonrası: dörtlü longhand'ler (`margin-*`, `padding-*`, `border-*`,
`border-radius` köşeleri) okunabilirlik için shorthand'e katlanır; property'ler
grup önceliğiyle sıralanır (layout → kutu → flex/grid → tipografi → görsel → diğer).
İzlenen property listesi ~60 layout-relevant property ile sınırlı (300+ satır
gürültü çıkmasın diye computed style'ın tamamı taranmaz).

## Bileşenler

```
src/
  background.js            ikon tıklaması → enjekte et / toggle mesajı
  content/
    inspector.js           inspect modu, hover overlay (mavi), tıkla-seç, Esc
    panel.js               Shadow DOM panel: CSS/SCSS/Tailwind sekmeleri, kopyala
    content-script.js      mesaj dinleme + inspector/panel bağlama (giriş noktası)
  lib/
    css-filter.js          baseline diff + shorthand katlama + öncelik sırası (saf)
    css-to-scss.js         SCSS bloğu + tekrarlayan renkleri $değişken çıkarma (saf)
    css-to-tailwind.js     mapping tablosu + en yakın scale + [arbitrary] fallback (saf)
  manifest.chrome.json / manifest.firefox.json
build.js                   dist/chrome + dist/firefox üretir
test/                      node:test ile saf fonksiyon testleri
demo/demo.html             buton, kart, flex container içeren doğrulama sayfası
```

- **Highlight:** elemente dokunmadan, `pointer-events:none` sabit konumlu bir
  overlay kutusu (mavi çerçeve + tag etiketi). Sayfanın DOM/stiline müdahale yok.
- **Panel:** sağ-alt köşede sabit, Shadow DOM içinde (sayfa CSS'i sızamaz).
  Üç sekme, `<pre>` kod bloğu, Kopyala butonu (`navigator.clipboard`,
  başarısızsa gizli textarea + `execCommand` fallback), kapat butonu.
  Panel ve overlay, seçilebilir element taramasından hariç tutulur.
- **Akış:** ikon → inspect modu açılır → hover'da mavi vurgu → tıklamada seçim
  kilitlenir, panel açılır (inspect modu açık kalır, başka elemente tıklanabilir)
  → Esc veya ikon tekrar → mod kapanır, panel/overlay temizlenir.

## Tailwind eşlemesi (yaklaşıklık bilinçli)

Spacing/font-size/radius/z-index için standart Tailwind scale'leri gömülü tablo;
tam oturmayan değerler `p-[13px]`, renkler `text-[#1a2b3c]` gibi arbitrary
value'ya düşer. `rgb()` → hex normalizasyonu yapılır. README %100 doğruluk
vaat etmez; bu sınırlama açıkça yazılır.

## SCSS

Seçilen elementten türetilen selector (`tag.class1.class2` / `#id`) + property
bloğu. Renk taşıyan property'lerde (color, background-color, border-color) aynı
değer ≥2 kez geçiyorsa `$color-1..n` değişkenine çıkarılır.

## Test stratejisi

- `node:test` ile üç saf modülün birim testleri (TDD): buton, kart, flex
  container senaryolarını temsil eden girdiler.
- Uçtan uca: `demo/demo.html` + Playwright — content bundle sayfaya enjekte
  edilip (uzantı API'si yokken de çalışacak test kancası ile) hover/tıkla/panel
  akışı doğrulanır.
- Firefox gerçek testi otomatikleştirilemiyor; `about:debugging` adımları
  README'de manuel kontrol listesi olarak verilir. Manifest'ler `web-ext lint`
  ile doğrulanmaya çalışılır (erişilebilirse).

## Kapsam dışı (şartnamedeki gibi)

Kayıtlı element listesi, ayarlar sayfası, CSS-in-JS formatları. Ek olarak v1'de
uzantı ikonu görseli yok (tarayıcı varsayılanı kullanılır).
