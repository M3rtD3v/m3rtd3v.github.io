# PostGram Landing Page (Google Ads → AppsFlyer OneLink → App Store)

Google Ads'ten gelen trafiği gerçek, görünür bir sayfada karşılayıp; kullanıcı **App Store**
butonuna tıkladığında AppsFlyer OneLink üzerinden App Store'a yönlendiren statik sayfa.
Sayfa yüklenirken **hiçbir otomatik yönlendirme yapmaz** (Google Ads cloaking politikası
gereği) — yönlendirme yalnızca buton tıklamasında gerçekleşir.

## Dosya Yapısı

```
web/
├── index.html      # Sayfa içeriği
├── style.css       # Stil
├── script.js       # AppsFlyer Smart Script entegrasyonu + buton davranışı
├── CNAME           # Custom domain (GitHub Pages)
├── assets/         # App ikonu, App Store rozeti, ekran görüntüsü kolajı
└── README.md       # Bu dosya
```

## Sayfa İçeriği (mevcut hâli)

Sayfa tek kolonluk, mobile-first, dikeyde ortalanmış tek bir blok:

1. App ikonu (`assets/app-icon.png`)
2. Başlık: **Repost for Instagram**
3. Alt başlık: **Anonymous Story Viewer**
4. Resmi Apple "Download on the App Store" rozeti — **tıklanabilir buton**
   (`#app-store-cta`), aynı zamanda AppsFlyer OneLink clickURL'inin hedeflendiği
   element (`script.js`)
5. Ekran görüntüsü kolajı (`assets/screenshots.png`)

Başka bölüm yok (özellikler, footer linkleri vb. kaldırıldı) — kullanıcı talebiyle
sayfa bilinçli olarak bu minimal yapıya indirildi.

## AppsFlyer OneLink Yapılandırması (dolduruldu)

`script.js` içindeki `CONFIG` artık gerçek değerlerle dolu:

```js
var CONFIG = {
  ONELINK_URL: "https://repostizysoft.onelink.me/rIKN",
  APP_STORE_URL: "https://apps.apple.com/tr/app/repost-for-instagram/id6744257059",
  CAMPAIGN_DEFAULT_NAME: "22_Aug_Repost_US"
};
```

Parametre eşlemesi, AppsFlyer OneLink dashboard'unun bu OneLink (`rIKN`) için ürettiği
**resmi Smart Script koduyla birebir aynı**: `mediaSource` (sabit `googleads_int`), `ad`
(`af_ad`), `adSet` (`af_adset`), `campaign` (`c`, default `CAMPAIGN_DEFAULT_NAME`), `afSub1`
(`af_siteid`, default `googleads_w2a`), `afSub2` (`af_force_transparent`, default `true`),
`afSub3` (`gbraid`), `afSub4` (`wbraid`), `afSub5` (`af_keywords`), ve özel parametre
`af_ss_ui=true`. GCLID/FBCLID için ayrıca mapping yok — Smart Script (v2.10.4) bunları
URL'de varsa otomatik ekliyor.

**Bilinçli yapılan bir değişiklik:** AppsFlyer dashboard'unun ürettiği orijinal kodda
`afSub3`/`afSub4`/`afSub5` için sırasıyla **literal** `"gbraid"` / `"wbraid"` /
`"af_keywords"` string'leri `defaultValue` olarak ayarlıydı — yani bu parametreler gelen
URL'de yoksa (ki çoğu tıklamada `gbraid`/`wbraid` olmayacaktır — bunlar genelde app
kampanyaları / iOS ATT senaryolarında gelir) clickURL'e anlamsız `af_sub3=gbraid` gibi bir
değer yazılıyordu. Bu, dashboard'un doldurulmamış örnek/placeholder metni gibi duruyor;
burada bu üç `defaultValue` kaldırıldı — parametre URL'de varsa taşınır, yoksa alan boş
kalır. Gerçekten bu literal default'ları istiyorsan (örn. AppsFlyer tarafında bir raporlama
mantığı bu değerlere bağlıysa) haber ver, geri ekleyeyim.

`campaign` (`c`) için dashboard kodunda bir fallback/default yoktu; kullanıcı talebiyle
`CAMPAIGN_DEFAULT_NAME` (`"22_Aug_Repost_US"`) `campaign.defaultValue` olarak eklendi —
"c" parametresi URL'de gelmezse (örn. doğrudan/organik ziyaret) attribution kaybolmasın
diye clickURL'e bu sabit kampanya adı yazılır.

### `CNAME` dosyası — hâlâ eksik
İçeriği hâlâ placeholder (`{{CUSTOM_DOMAIN}}`). Gerçek domain adını verdiğinde tek satır
olarak buraya yazılacak (örn. `getpostgram.app`).

### `assets/` klasörü
Şu an yüklü olan görseller:

| Dosya | Açıklama |
|---|---|
| `app-icon.png` | Uygulama ikonu (üstte gösterilir) |
| `app-store-badge.png` | Resmi Apple "Download on the App Store" rozeti — tıklanabilir CTA |
| `screenshots.png` | Ekran görüntüsü kolajı (en altta gösterilir) |

Bu görselleri değiştirmek istersen aynı dosya adlarının üzerine yazman yeterli;
`index.html`'de dosya adı değişikliği gerekmez.

### Sayfa metinleri
Başlık **"Repost for Instagram"** ve alt başlık **"Anonymous Story Viewer"** olarak
sabitlendi (App Store listeleme diliyle tutarlı). Değiştirmek istersen `index.html`
içindeki `.title` ve `.subtitle` metinlerini düzenle.

## GitHub Pages'e Deploy

GitHub Pages klasik ayarlarında bir repo yalnızca **kök dizinini** ya da **`/docs`** klasörünü
statik site kaynağı olarak sunabilir; rastgele bir alt klasörü (`/web`) doğrudan seçemezsin.
İki seçeneğin var:

### Seçenek A — Ayrı/bağımsız repo (en basit, önerilen)
1. Bu `web/` klasörünün içeriğini yeni, ayrı bir GitHub reposunun **köküne** kopyala
   (örn. `postgram-landing` adlı repo; `index.html`, `style.css`, `script.js`, `CNAME`, `assets/`
   repo kökünde olacak şekilde).
2. Repo → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `(root)`.
3. Repo → **Settings → Pages → Custom domain** alanına domain'i gir (bu, kökteki `CNAME`
   dosyasını GitHub'ın otomatik yazmasını sağlar/doğrular) → **Enforce HTTPS**'i işaretle
   (sertifika hazır olunca).

### Seçenek B — Bu monorepo içinde kalıp GitHub Actions ile `/web`'i deploy etmek
`main` dalına push'ta `web/` klasörünü GitHub Pages'e yayınlayan bir workflow ekle:

```yaml
# .github/workflows/deploy-landing.yml
name: Deploy landing page
on:
  push:
    branches: [main]
    paths: ["web/**"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web
      - id: deployment
        uses: actions/deploy-pages@v4
```
Ardından repo → **Settings → Pages** → Source: `GitHub Actions` seç. Bu yöntemde `CNAME`
dosyası repo kökünde değil `web/CNAME` içinde kalabilir; `upload-pages-artifact` klasörün
tamamını (CNAME dahil) yayınlar.

> Not: Seçenek A, Google Ads'in domain/SSL doğrulaması ve gelecekteki bakım açısından daha
> sade ve hataya kapalı. Bu proje App'in ana kod tabanından (iOS + parser-service) tamamen
> bağımsız bir yayın hedefi olduğu için ayrı repo önerilir.

## Domain DNS Ayarları

Domain sağlayıcının (Namecheap, GoDaddy, Cloudflare vb.) DNS panelinde:

**Apex/kök domain kullanacaksan** (örn. `postgram.app`):
```
Tip: A     Ad/Host: @     Değer: 185.199.108.153
Tip: A     Ad/Host: @     Değer: 185.199.109.153
Tip: A     Ad/Host: @     Değer: 185.199.110.153
Tip: A     Ad/Host: @     Değer: 185.199.111.153
```
(Bunlar GitHub Pages'in resmi IP'leridir — [GitHub dokümantasyonundan](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site) güncel listeyi teyit et.)

**Subdomain kullanacaksan** (örn. `go.postgram.app` veya `www.postgram.app`):
```
Tip: CNAME   Ad/Host: go (veya www)   Değer: <github-kullanici-adi>.github.io
```

DNS yayıldıktan sonra (birkaç dakika – birkaç saat) GitHub → Settings → Pages sayfasında
"DNS check successful" görülür ve **Enforce HTTPS** kutusu işaretlenebilir hale gelir.
Cloudflare kullanıyorsan ilk kurulumda turuncu bulut (proxy) kapalı (gri/DNS only) olmalı,
GitHub'ın SSL sertifikası (Let's Encrypt) doğrulanana kadar; sonrasında proxy açılabilir.

## Test Etme (Parametre Aktarımı Doğrulaması)

1. Sayfayı parametrelerle aç:
   ```
   https://<domain>/?gclid=test123&c=testcampaign&af_ad=testad&af_adset=testadset
   ```
2. Tarayıcı DevTools → **Network** sekmesini aç, "Preserve log" işaretle.
3. App Store butonuna tıkla.
4. Yönlenen isteğin (OneLink `clickURL`) query string'inde `gclid`, `af_c`/`campaign`,
   `af_ad`, `af_adset` değerlerinin göründüğünü doğrula.
5. Konsolda hata yoksa ve `window.afClickURL` (DevTools Console'da yazarak kontrol edilebilir)
   dolu bir OneLink URL'i içeriyorsa entegrasyon doğru çalışıyor demektir.
6. `CONFIG.ONELINK_URL` / `APP_STORE_URL` boş ya da `{{...}}` placeholder olarak bırakılırsa
   script konsola uyarı basar ve buton doğrudan `APP_STORE_URL`'e (o da boşsa hataya) düşer —
   deploy öncesi ikisinin de gerçek değerlerle dolu olduğundan emin ol.

## Cloaking Kuralına Uyum Kontrol Listesi

- [x] `DOMContentLoaded` içinde `window.location` çağrısı **yok** — yalnızca `generateOneLinkURL` çağrılıp sonuç saklanıyor.
- [x] Sayfa görünür başlık, açıklama, ekran görüntüleri ve buton içeriyor (boş/beyaz ekran değil).
- [x] Yönlendirme yalnızca kullanıcı tıklamasıyla (`click` event handler) tetikleniyor.
- [x] GCLID/GBRAID/WBRAID/FBCLID için manuel parametre mapping yok — Smart Script otomatik ekliyor.
