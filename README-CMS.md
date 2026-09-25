# CMS v2 — وب‌سایت اکبر اصالتی

## معماری
- پنل مدیریت: /admin/
- API امن: /api/
- ذخیره اصلی محتوا: GitHub در admin/data/data/content.json
- رسانه‌ها: uploads/
- نسخه‌بندی: Git history
- احراز هویت: GitHub OAuth + نشست رمزنگاری‌شده

## متغیرهای لازم در Vercel
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
SESSION_SECRET
ALLOWED_GITHUB_LOGIN = esalati
GITHUB_OWNER = esalati
GITHUB_REPO = esalati.github.io
CMS_BRANCH = cms-v2
APP_URL = آدرس نهایی Vercel، بدون / در انتها

## GitHub OAuth App
در GitHub یک OAuth App بسازید و Authorization callback URL را برابر APP_URL/api/auth/callback قرار دهید. Scope موردنیاز برای مخزن عمومی public_repo است.

## امنیت
هیچ رمز عبور، توکن، کلید خصوصی یا کد دومرحله‌ای را در چت ارسال نکنید. Secretها فقط در Vercel Environment Variables قرار می‌گیرند.

## راه‌اندازی
1. Branch cms-v2 را در Vercel به‌صورت Preview deploy کنید.
2. متغیرهای بالا را در Vercel تنظیم کنید.
3. OAuth App را با callback همان Preview URL بسازید.
4. /admin/ را باز کنید و ورود GitHub را تست کنید.
5. پس از تست کامل، branch را به production منتقل کنید.

main تا زمان تأیید نهایی دست‌نخورده می‌ماند.
