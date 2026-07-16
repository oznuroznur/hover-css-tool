# CSS Inspector

Sayfadaki bir elementi hover ile vurgulayıp tıklayarak seçen ve o elementin
CSS'ini üç formatta — **CSS**, **SCSS**, **Tailwind** — gösterip kopyalatan
tarayıcı uzantısı. Chrome ve Firefox (Manifest V3) ile çalışır.

## Kullanım

1. Uzantı ikonuna tıkla → inspect modu açılır.
2. Sayfada gezin: hover edilen element mavi çerçeveyle vurgulanır (tag + class
   etiketiyle).
3. Elemente tıkla → sağ altta panel açılır; CSS / SCSS / Tailwind sekmelerinden
   birini seçip **Kopyala** ile panoya al.
4. Başka elemente tıklayarak seçimi değiştirebilirsin. Çıkış: **Esc** veya
   ikona tekrar tıklama.

## Kurulum (geliştirme)

```bash
npm run build   # dist/chrome ve dist/firefox paketlerini üretir
npm test        # saf dönüşüm fonksiyonlarının birim testleri
```

**Chrome:** `chrome://extensions` → "Geliştirici modu"nu aç → "Paketlenmemiş
öğe yükle" → `dist/chrome` klasörünü seç.

**Firefox:** `about:debugging#/runtime/this-firefox` → "Geçici Eklenti Yükle" →
`dist/firefox/manifest.json` dosyasını seç. (Geçici eklentiler Firefox
kapanınca kaldırılır; her oturumda yeniden yüklemek gerekir.)

## Nasıl çalışıyor

- İkon tıklanınca background script, content script'i **o sekmeye** enjekte
  eder (`activeTab` + `scripting`) — uzantı hiçbir sitede kalıcı izin istemez.
- Elementin `getComputedStyle` çıktısı, aynı tag'in boş bir iframe'deki
  tarayıcı-varsayılanı ile karşılaştırılır; yalnızca **varsayılandan farklı**
  property'ler gösterilir. Longhand'ler okunabilirlik için shorthand'e
  katlanır (`margin`, `padding`, `border`, `border-radius`, `gap`).
- `width`/`height` gibi geometri değerleri, sayfanın CSS'inde gerçekten
  yazılmışsa gösterilir (auto boyutlanan elementin çözümlenmiş pikselleri
  gürültü olarak eklenmez).
- Panel, sayfanın CSS'inden etkilenmemesi için **Shadow DOM** içinde çizilir.

## Sınırlamalar

- **Tailwind dönüşümü yaklaşıktır, %100 doğruluk vaat edilmez.** Standart
  Tailwind scale'ine oturan değerler utility class'a çevrilir (`16px` → `p-4`);
  oturmayanlar arbitrary value olarak yazılır (`13px` → `p-[13px]`, renkler
  `text-[#3b82f6]`). Eşlenemeyen property'ler çıktının altında yorum bloğunda
  listelenir.
- Değerler **computed (kullanılan) değerlerdir**: `em`/`rem`/`%` piksele,
  renk adları `rgb()`'ye çözülmüş gelir. Ekran ölçekleme (ör. Windows %125)
  yüzünden `1px` border `0.8px` görünebilir — tarayıcının raporladığı gerçek
  kullanılan değerdir.
- Cross-origin stylesheet'li sayfalarda geometri filtresi devre dışı kalır
  (hangi property'nin yazıldığı okunamadığından hepsi gösterilir).
- Pseudo-element'ler (`::before` vb.) ve hover/focus durum stilleri v1
  kapsamında değil.

## Chrome ↔ Firefox farkları (geliştirici notları)

Tek kod tabanı iki manifest ile paketlenir (`build.js`):

| | Chrome | Firefox |
|---|---|---|
| Background | `service_worker` | `scripts` (event page — FF service worker desteklemez) |
| Kimlik | — | `browser_specific_settings.gecko.id` zorunlu |
| Veri beyanı | — | `data_collection_permissions` (FF 140+; eski sürümler yok sayar) |

Kullanılan API'ler (`action`, `scripting`, `tabs.sendMessage`,
`runtime.onMessage`) iki tarayıcıda da Promise tabanlı ve isim uyumlu olduğu
için `webextension-polyfill` yerine üç satırlık
`globalThis.browser ?? globalThis.chrome` shim'i yeterli (gerekçe:
`docs/superpowers/specs/2026-07-16-css-inspector-design.md`).

`dist/firefox`, `web-ext lint` ile doğrulanmıştır (0 hata). Gerçek Firefox'ta
manuel kontrol listesi: ikonla aç/kapat, hover vurgusu, üç sekmenin içeriği,
kopyalama, Esc ile çıkış.

## Proje yapısı

```
src/lib/         saf, test edilebilir dönüşüm fonksiyonları
  css-filter.js        baseline diff + shorthand katlama + öncelik sırası
  css-to-scss.js       SCSS + tekrarlayan renkleri $değişkene çıkarma
  css-to-tailwind.js   Tailwind mapping + arbitrary fallback
src/content/     inspector (hover/seçim), panel (Shadow DOM UI), giriş noktası
src/background.js, src/manifest.{chrome,firefox}.json
build.js         bağımlılıksız build → dist/chrome, dist/firefox
test/            node:test birim testleri
demo/demo.html   buton + kart + flex container içeren deneme sayfası
```
