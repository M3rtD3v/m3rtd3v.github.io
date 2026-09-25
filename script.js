(function () {
  "use strict";

  // Gerçek OneLink ve App Store hedefleri (AppsFlyer dashboard'unun "rIKN" OneLink şablonu için
  // ürettiği resmi Smart Script koduna göre).
  var CONFIG = {
    ONELINK_URL: "https://repostizysoft.onelink.me/rIKN",
    APP_STORE_URL: "https://apps.apple.com/tr/app/repost-for-instagram/id6744257059",
    CAMPAIGN_DEFAULT_NAME: "22_Aug_Repost_US" // "c" parametresi URL'de yoksa clickURL'e bu sabit kampanya adı yazılır.
  };

  /**
   * AppsFlyer OneLink Smart Script ile clickURL üretir.
   * ÖNEMLİ: burada window.location YAPILMAZ — sadece URL üretilip window.afClickURL'e yazılır.
   * Gerçek yönlendirme yalnızca kullanıcı App Store butonuna tıkladığında gerçekleşir (cloaking yasağı).
   *
   * Parametre eşlemesi, AppsFlyer OneLink dashboard'unun bu OneLink için ürettiği resmi
   * Smart Script koduyla birebir aynı — CDN'den yüklenen `AF_SMART_SCRIPT` global objesini kullanır
   * (bkz. index.html <head>), kütüphanenin kendisi burada YENİDEN yazılmıyor/kopyalanmıyor.
   */
  function buildOneLinkURL() {
    if (typeof AF_SMART_SCRIPT === "undefined") {
      console.warn(
        "[PostGram] AppsFlyer Smart Script CDN'den yüklenemedi. Buton tıklandığında doğrudan App Store linkine düşülecek."
      );
      return null;
    }

    var mediaSource = { defaultValue: "googleads_int" };
    var ad = { keys: ["af_ad"] };
    var adSet = { keys: ["af_adset"] };
    var campaign = { keys: ["c"], defaultValue: CONFIG.CAMPAIGN_DEFAULT_NAME }; // "c" gelmezse attribution kaybolmasın diye sabit kampanya adına düşer.
    var afSub1 = { keys: ["af_siteid"], defaultValue: "googleads_w2a" };
    var afSub2 = { keys: ["af_force_transparent"], defaultValue: "true" };

    // NOT: AppsFlyer dashboard'unun ürettiği orijinal kodda afSub3/afSub4/afSub5 default
    // değerleri sırasıyla LİTERAL "gbraid"/"wbraid"/"af_keywords" string'leriydi — yani bu
    // parametreler gelen URL'de yoksa clickURL'e anlamsız af_sub3=gbraid gibi bir değer
    // yazılıyordu (dashboard'un doldurulmamış örnek metni gibi duruyor). Burada bilerek
    // defaultValue'lar kaldırıldı: parametre URL'de varsa taşınır, yoksa alan boş kalır.
    var afSub3 = { keys: ["gbraid"] };
    var afSub4 = { keys: ["wbraid"] };
    var afSub5 = { keys: ["af_keywords"] };

    // Smart Script UI işareti — AppsFlyer dashboard'unun ürettiği koddan aynen korundu.
    var afSsUi = { paramKey: "af_ss_ui", defaultValue: "true" };

    // NOT: GCLID/FBCLID için ayrıca manuel mapping YAPILMIYOR — Smart Script v2.10.4
    // bunları (ve yukarıdaki gbraid/wbraid'i) URL'de varsa clickURL'e otomatik ekliyor;
    // afSub3/afSub4 bunları ayrıca AppsFlyer sub-parametresi olarak da taşır.

    var result = AF_SMART_SCRIPT.generateOneLinkURL({
      oneLinkURL: CONFIG.ONELINK_URL,
      afParameters: {
        mediaSource: mediaSource,
        ad: ad,
        adSet: adSet,
        campaign: campaign,
        afSub1: afSub1,
        afSub2: afSub2,
        afSub3: afSub3,
        afSub4: afSub4,
        afSub5: afSub5,
        afCustom: [afSsUi]
      }
    });

    if (!result || result.error) {
      console.error("[PostGram] OneLink clickURL üretilemedi:", result && result.error);
      return null;
    }

    return result.clickURL;
  }

  function handleCtaClick(event) {
    event.preventDefault();
    // Script henüz yüklenmediyse ya da üretim başarısız olduysa doğrudan App Store'a düş.
    var destination = window.afClickURL || CONFIG.APP_STORE_URL;
    window.location.href = destination;
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Sayfa yüklenirken OTOMATİK YÖNLENDİRME YOK — sadece clickURL üretilip saklanıyor.
    window.afClickURL = buildOneLinkURL();

    var ctaButtons = document.querySelectorAll("#app-store-cta, [data-app-store-cta]");
    ctaButtons.forEach(function (btn) {
      btn.addEventListener("click", handleCtaClick);
    });
  });
})();
