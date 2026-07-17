# Store listeleme metinleri / Store listing copy

Chrome Web Store ve Firefox Add-ons (AMO) formlarına yapıştırılmak üzere.
Karakter limitleri metinlerin yanında belirtildi.

---

## Kategori / Category

- **Chrome Web Store:** Developer Tools (Geliştirici Araçları)
- **Firefox AMO:** Web Development

---

## Kısa açıklama / Short description

Chrome limiti 132 karakter; ikisi de limitin altında.

**TR** (99 karakter):

> Sayfadaki bir elemente tıklayın, CSS'ini görün ve CSS, SCSS veya Tailwind olarak tek tıkla kopyalayın.

**EN** (103 karakter):

> Click any element on a page to see its styles and copy them as clean CSS, SCSS or Tailwind classes.

---

## Uzun açıklama / Full description

### TR

**CSS Inspector**, herhangi bir web sayfasındaki bir elementin stillerini
tek tıkla çıkarmanızı sağlar — DevTools'ta yüzlerce satır computed style
arasında kaybolmadan.

**Nasıl çalışır?**

1. Araç çubuğundaki ikona tıklayın; inspect modu açılır.
2. Fareyi gezdirin: elementler mavi çerçeveyle vurgulanır.
3. Elemente tıklayın: köşede açılan panelde stiller hazırdır.
4. İstediğiniz formatı seçin ve **Kopyala**ya basın. Çıkış için Esc yeter.

**Üç format:**

- **CSS** — yalnızca tarayıcı varsayılanından farklı property'ler; longhand'ler
  okunabilir shorthand'lere katlanır (margin, padding, border, gap...).
- **SCSS** — aynı stiller SCSS bloğu olarak; tekrar eden renkler otomatik
  `$color-1` değişkenlerine çıkarılır.
- **Tailwind** — property'ler Tailwind utility class'larına eşlenir
  (`padding: 16px` → `p-4`); ölçeğe oturmayan değerler `p-[13px]` gibi
  arbitrary value olarak yazılır. Dönüşüm yaklaşıktır; eşlenemeyen
  property'ler ayrıca listelenir.

**Gizlilik:** Uzantı hiçbir veri toplamaz, hiçbir sunucuya istek atmaz,
yalnızca ikona tıkladığınız sekmede çalışır (activeTab). Kod açıktır.

Tasarım sistemlerini incelemek, bir siteden ilham almak veya legacy CSS'i
Tailwind'e taşımak için pratik bir araç.

### EN

**CSS Inspector** extracts the styles of any element on any web page with a
single click — no more digging through hundreds of computed-style lines in
DevTools.

**How it works:**

1. Click the toolbar icon to enter inspect mode.
2. Move your mouse: elements highlight with a blue outline.
3. Click an element: a panel opens with its styles ready to go.
4. Pick a format and hit **Copy**. Press Esc to exit.

**Three formats:**

- **CSS** — only the properties that differ from browser defaults; longhands
  are collapsed into readable shorthands (margin, padding, border, gap...).
- **SCSS** — the same styles as an SCSS block; repeated colors are
  automatically extracted into `$color-1` variables.
- **Tailwind** — properties are mapped to Tailwind utility classes
  (`padding: 16px` → `p-4`); values that don't sit on the standard scale
  fall back to arbitrary values like `p-[13px]`. The conversion is
  approximate by nature; unmappable properties are listed separately.

**Privacy:** The extension collects no data, makes no network requests, and
only runs in the tab where you click its icon (activeTab). The code is open.

Handy for studying design systems, borrowing ideas from live sites, or
migrating legacy CSS to Tailwind.

---

## Ekran görüntüsü altyazıları / Screenshot captions

Sıra `assets/store/` içindeki dosya sırasıyla eşleşir.

| Dosya | TR | EN |
|---|---|---|
| screenshot-1-hover.png | Inspect modunda hover: element mavi çerçeve ve etiketle vurgulanır | Inspect mode hover: elements highlight with a blue outline and label |
| screenshot-2-css.png | Seçilen elementin sadeleştirilmiş CSS'i — yalnızca varsayılandan farklı property'ler | Clean CSS of the selected element — only non-default properties |
| screenshot-3-tailwind.png | Aynı stiller Tailwind utility class'ları olarak | The same styles as Tailwind utility classes |
| screenshot-4-scss.png | SCSS çıktısı: tekrar eden renkler otomatik değişkene çıkarılır | SCSS output: repeated colors extracted into variables |

---

## Form alanları için diğer bilgiler / Misc form fields

- **Gizlilik politikası URL'i:** depo GitHub'a itildikten sonra
  `https://github.com/<kullanıcı>/<repo>/blob/master/PRIVACY.md`
- **İzin gerekçeleri** (Chrome "permission justification" alanları):
  - `activeTab`: "Kullanıcı ikona tıkladığında, yalnızca o sekmedeki
    elementlerin stillerini okumak için." / "To read element styles in the
    tab where the user clicked the icon, only after that click."
  - `scripting`: "İkon tıklamasından sonra inceleme arayüzünü aktif sekmeye
    enjekte etmek için." / "To inject the inspection UI into the active tab
    after the icon is clicked."
- **Uzaktan kod / Remote code:** No (tüm kod pakette).
- **Veri kullanımı beyanı:** hiçbir veri toplanmıyor → tüm kutular boş /
  "does not collect user data".
