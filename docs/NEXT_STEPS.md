# Ab kya karna hai

AI Studio mein aur phases paste mat karein. `build.yml` delete mat karein. Wohi workflow APK banata hai.

## Jo check ho chuka hai (31 Oct 2026)

- Tests: 48/48 pass, Pakistan time (`TZ=Asia/Karachi`), GitHub par bhi.
- Type-check pass.
- Debug APK ban chuka hai.

Download (login chahiye, yeh aapki repo hai):

https://github.com/shanbhatti978-cloud/PAKISTAN-TRADERS-CORP./actions/runs/41190953092

Neeche **Artifacts** mein `Pakistan-Trader-App-APK` zip hai. Zip kholen, andar `.apk` hai.

`Android Release Build` wala red cross purana hai. Woh `npm ci` par Node 20 ki wajah se fail hua tha. Ab woh har push par nahi chalega. Dukaan wala APK `Build Web & Android APK` se aata hai.

## Phone par, isi order mein

1. Ek faltu Android phone par yeh APK install karein. Pehle sirf ek phone.
2. Setup mein apna naam, dukaan ka naam, aur password likhein.
3. **Keep sample demo dataset** wala option OFF rakhein. Warna fake customers, stock, aur Hall Road wala demo address reh jayega.
4. App band karke dobara kholen. Wohi owner login hona chahiye. Password wahi chalna chahiye jo aapne abhi rakha.
5. Screen lock ka factory PIN abhi `1234` hai jab tak Settings mein na badlein. Aaj hi badal dein. Staff ko yeh PIN na batayein.
6. Ek asli customer, ek item, ek agreement, ek payment, phir usi payment ka reversal karein. Due date wahi din honi chahiye jo aapne likhi.
7. Encrypted backup bana kar WhatsApp ya Drive par apne aap ko bhej dein. Roz shaam yahi karein.
8. Do teen din ek phone par theek chale, tab doosre phones par install karein. Jis phone par pehle se data ho, us par naya install se pehle backup lein.

## Abhi mat karein

- Play Store.
- Signing key. Jab Play Store chahiye ho tab aap khud banayenge aur do jagah mehfooz rakhenge. Key kisi ko na bhejein, AI ko bhi nahi.
- `git tag v1.0.0` tab, jab upar wala phone test theek ho.
